const Workspace = require('../models/Workspace');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get workspaces user belongs to
// @route   GET /api/v1/workspaces
// @access  Private
exports.getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    }).populate('owner', 'name email avatar');

    res.status(200).json({ success: true, count: workspaces.length, data: workspaces });
  } catch (error) {
    next(error);
  }
};

// @desc    Get members details of a workspace
// @route   GET /api/v1/workspaces/:id/members
// @access  Private
exports.getWorkspaceMembers = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('members.user', 'name email avatar role');

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    res.status(200).json({ success: true, data: workspace.members });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new workspace
// @route   POST /api/v1/workspaces
// @access  Private
exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide workspace name' });
    }

    const workspace = await Workspace.create({
      name,
      icon: icon || '💼',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }]
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_WORKSPACE',
      targetId: workspace._id,
      targetType: 'Workspace',
      details: `Created workspace: "${name}"`
    });

    res.status(201).json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite/Add User to workspace
// @route   POST /api/v1/workspaces/:id/invite
// @access  Private (Admin or Manager only)
exports.inviteUser = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide user email' });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Check permissions: requesting user must be Admin or Manager of workspace
    const requesterMember = workspace.members.find(m => String(m.user) === String(req.user._id));
    if (!requesterMember || (requesterMember.role !== 'Admin' && requesterMember.role !== 'Manager')) {
      return res.status(403).json({ success: false, message: 'Not authorized to invite members to this workspace' });
    }

    // Find invited user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email does not exist' });
    }

    // Check if user already in workspace
    const isMember = workspace.members.some(m => String(m.user) === String(user._id));
    if (isMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
    }

    // Add user
    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      {
        $push: { members: { user: user._id, role: role || 'User' } }
      },
      { new: true }
    );

    await ActivityLog.create({
      user: req.user._id,
      action: 'INVITE_USER',
      targetId: user._id,
      targetType: 'User',
      details: `Invited "${user.name}" to workspace "${workspace.name}"`
    });

    res.status(200).json({ 
      success: true, 
      message: 'User added to workspace successfully',
      data: updatedWorkspace 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role inside workspace
// @route   PUT /api/v1/workspaces/:id/members/:userId
// @access  Private (Admin only)
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { id, userId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Requester must be Admin
    const requester = workspace.members.find(m => String(m.user) === String(req.user._id));
    if (!requester || requester.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only Workspace Admins can update roles' });
    }

    // Update role
    const memberIndex = workspace.members.findIndex(m => String(m.user) === String(userId));
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'User is not a member of this workspace' });
    }

    workspace.members[memberIndex].role = role;
    await workspace.save();

    res.status(200).json({ success: true, message: 'User role updated successfully', data: workspace });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from workspace
// @route   DELETE /api/v1/workspaces/:id/members/:userId
// @access  Private (Admin or self leave)
exports.removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Requester must be Admin, or the user is leaving themselves
    const isSelf = String(req.user._id) === String(userId);
    const requester = workspace.members.find(m => String(m.user) === String(req.user._id));

    if (!isSelf && (!requester || requester.role !== 'Admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized to remove member' });
    }

    // Prevent leaving if they are the owner
    if (String(workspace.owner) === String(userId)) {
      return res.status(400).json({ success: false, message: 'Workspace owners cannot leave. Delete workspace instead.' });
    }

    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      id,
      {
        $pull: { members: { user: userId } }
      },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'Member removed successfully', data: updatedWorkspace });
  } catch (error) {
    next(error);
  }
};
