const express = require('express');
const router = express.Router();
const { 
  getWorkspaces, getWorkspaceMembers, createWorkspace, 
  inviteUser, updateMemberRole, removeMember 
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getWorkspaces);
router.post('/', createWorkspace);
router.get('/:id/members', getWorkspaceMembers);
router.post('/:id/invite', inviteUser);
router.put('/:id/members/:userId', updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
