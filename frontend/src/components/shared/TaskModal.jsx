import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask, deleteTask, fetchTasks, fetchTaskDetails } from '../../store/slices/taskSlice';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/client';
import GlassCard from './GlassCard';
import Button from './Button';
import { 
  X, Calendar, AlertTriangle, Tag, Paperclip, MessageSquare, Clock, 
  CheckSquare, Plus, Trash2, Pin, Star, Copy, Share2, Sparkles, Send, Play, Square
} from 'lucide-react';
import toast from 'react-hot-toast';

const TaskModal = ({ taskId, onClose }) => {
  const dispatch = useDispatch();
  const { currentWorkspaceId } = useAuth();
  const task = useSelector(state => state.tasks.activeTask);
  const workspaceMembers = useSelector(state => state.workspaces.members);
  
  const [activeTab, setActiveTab] = useState('details'); // details, comments, files
  const [editingFields, setEditingFields] = useState({});
  const [newCheckItem, setNewCheckItem] = useState('');
  
  // Comments state
  const [newComment, setNewComment] = useState('');
  
  // File Upload State
  const [files, setFiles] = useState([]);
  
  // Time tracking states
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStart, setTrackingStart] = useState(null);

  useEffect(() => {
    if (task) {
      setEditingFields({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Todo',
        priority: task.priority || 'Medium',
        category: task.category || 'Work',
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours || 0,
        timeTracked: task.timeTracked || 0,
        pinned: task.pinned || false,
        favorite: task.favorite || false,
        assignedTo: task.assignedTo ? task.assignedTo.map(u => u._id || u) : [],
        checklist: task.checklist || [],
        color: task.color || '#6366F1'
      });
    }
  }, [task]);

  if (!task) return null;

  const handleFieldChange = (field, value) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
  };

  const saveTaskDetails = async (updates = editingFields) => {
    try {
      await dispatch(updateTask({ id: task._id, fields: updates })).unwrap();
      dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
    } catch (err) {
      toast.error('Failed to save task updates');
    }
  };

  // AI suggestions recommendation triggers
  const handleAISuggestions = async () => {
    try {
      const response = await API.post('/ai/suggest', {
        title: editingFields.title,
        description: editingFields.description
      });
      if (response.data?.success) {
        const { priority, category, tags, dueDate } = response.data.suggestions;
        
        // Build updates
        const updates = {
          ...editingFields,
          priority,
          category,
          dueDate: dueDate ? dueDate.split('T')[0] : editingFields.dueDate
        };
        
        setEditingFields(updates);
        await saveTaskDetails(updates);
        toast.success(`AI suggested: Category: ${category}, Priority: ${priority}`, { icon: '🤖' });
      }
    } catch (err) {
      toast.error('AI Suggestion helper failed');
    }
  };

  // Checklist utilities
  const toggleCheckItem = async (index) => {
    const updatedList = editingFields.checklist.map((item, idx) => 
      idx === index ? { ...item, done: !item.done } : item
    );
    handleFieldChange('checklist', updatedList);
    
    // Calculate progress
    const doneCount = updatedList.filter(item => item.done).length;
    const progress = Math.round((doneCount / updatedList.length) * 100);
    
    await saveTaskDetails({
      checklist: updatedList,
      progress: progress,
      status: progress === 100 ? 'Completed' : editingFields.status
    });
  };

  const addCheckItem = async (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;

    const newItem = { text: newCheckItem, done: false };
    const updatedList = [...(editingFields.checklist || []), newItem];
    setNewCheckItem('');
    handleFieldChange('checklist', updatedList);
    
    const doneCount = updatedList.filter(item => item.done).length;
    const progress = Math.round((doneCount / updatedList.length) * 100);

    await saveTaskDetails({
      checklist: updatedList,
      progress
    });
  };

  const deleteCheckItem = async (index) => {
    const updatedList = editingFields.checklist.filter((_, idx) => idx !== index);
    handleFieldChange('checklist', updatedList);

    const doneCount = updatedList.filter(item => item.done).length;
    const progress = updatedList.length > 0 ? Math.round((doneCount / updatedList.length) * 100) : 0;

    await saveTaskDetails({
      checklist: updatedList,
      progress
    });
  };

  // File Upload Handlers
  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach(f => {
      formData.append('attachments', f);
    });

    const uploadToast = toast.loading('Uploading attachments...');
    try {
      const res = await API.put(`/tasks/${task._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        toast.success('Files attached successfully', { id: uploadToast });
        dispatch(fetchTaskDetails(task._id));
        dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
      }
    } catch (err) {
      toast.error('File upload failed', { id: uploadToast });
    }
  };

  // Comment Thread utilities
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await API.post('/comments', {
        taskId: task._id,
        content: newComment
      });
      if (response.data?.success) {
        setNewComment('');
        dispatch(fetchTaskDetails(task._id));
        toast.success('Comment posted');
      }
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  // Time Tracker stopwatch functions
  const toggleTimeTracking = () => {
    if (!isTracking) {
      // Start Tracking
      setIsTracking(true);
      setTrackingStart(Date.now());
      toast.success('Time tracker running...', { icon: '⏱️' });
    } else {
      // Stop Tracking and log duration
      const durationMs = Date.now() - trackingStart;
      const durationMin = Math.round(durationMs / 1000 / 60) || 1; // Minimum 1 min
      const totalTime = (editingFields.timeTracked || 0) + durationMin;
      
      handleFieldChange('timeTracked', totalTime);
      saveTaskDetails({ timeTracked: totalTime });
      
      setIsTracking(false);
      setTrackingStart(null);
      toast.success(`Logged ${durationMin} minutes to task!`);
    }
  };

  const handleDuplicate = async () => {
    try {
      await API.post(`/tasks/${task._id}/duplicate`);
      dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
      toast.success('Task card duplicated');
      onClose();
    } catch (err) {}
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteTask(task._id)).unwrap();
      dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
      onClose();
    } catch (err) {}
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <GlassCard 
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl w-full h-[90vh] md:h-[80vh] flex flex-col p-0 overflow-hidden border-white/10 shadow-glass animate-scale-in"
      >
        {/* Modal Window Header */}
        <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const p = !editingFields.pinned;
                handleFieldChange('pinned', p);
                saveTaskDetails({ pinned: p });
              }}
              className={`p-1.5 rounded-lg border transition-colors ${editingFields.pinned ? 'bg-primary/20 border-primary text-primary' : 'border-white/5 text-slate-500 hover:text-slate-300'}`}
              title="Pin Task"
            >
              <Pin size={14} />
            </button>
            <button 
              onClick={() => {
                const f = !editingFields.favorite;
                handleFieldChange('favorite', f);
                saveTaskDetails({ favorite: f });
              }}
              className={`p-1.5 rounded-lg border transition-colors ${editingFields.favorite ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500' : 'border-white/5 text-slate-500 hover:text-slate-300'}`}
              title="Star Task"
            >
              <Star size={14} />
            </button>
            <button 
              onClick={handleDuplicate}
              className="p-1.5 rounded-lg border border-white/5 text-slate-500 hover:text-slate-300 transition-colors"
              title="Clone Card"
            >
              <Copy size={14} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Assistant button */}
            <Button onClick={handleAISuggestions} variant="glass" className="py-1 px-3 text-xs" icon={Sparkles}>
              AI Autofill
            </Button>
            <button 
              onClick={handleDelete}
              className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Task"
            >
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Workspace views grid tabs */}
        <div className="flex border-b border-white/5 bg-white/[0.01]">
          <button 
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab === 'details' ? 'border-primary text-white' : 'border-transparent text-slate-400'}`}
          >
            Details & Checklist
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`px-6 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab === 'comments' ? 'border-primary text-white' : 'border-transparent text-slate-400'}`}
          >
            Discussion ({task.comments?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`px-6 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab === 'files' ? 'border-primary text-white' : 'border-transparent text-slate-400'}`}
          >
            Time & Attachments ({task.attachments?.length || 0})
          </button>
        </div>

        {/* Modal Body Panels */}
        <div className="flex-1 overflow-y-auto p-6 text-left">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Core Details (Left side 2/3) */}
              <div className="md:col-span-2 flex flex-col gap-6">
                {/* Title */}
                <input
                  type="text"
                  value={editingFields.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={() => saveTaskDetails()}
                  className="bg-transparent text-2xl font-poppins font-extrabold text-white outline-none border-b border-transparent focus:border-white/10 w-full"
                />

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Description</label>
                  <textarea
                    rows={4}
                    value={editingFields.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    onBlur={() => saveTaskDetails()}
                    placeholder="Enter comprehensive instructions, rich descriptions, or notes..."
                    className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-slate-200 outline-none focus:border-white/10 resize-none"
                  />
                </div>

                {/* Checklist widget */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare size={12} /> Checklist ({editingFields.progress || 0}%)
                    </span>
                  </div>
                  
                  {/* Checklist Items list */}
                  <div className="flex flex-col gap-2">
                    {editingFields.checklist?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 group">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleCheckItem(idx)}
                          className="w-4.5 h-4.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                        />
                        <span className={`text-xs flex-1 ${item.done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                          {item.text}
                        </span>
                        <button 
                          onClick={() => deleteCheckItem(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Checkitem */}
                  <form onSubmit={addCheckItem} className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add sub-task checklist item..."
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-primary/50"
                    />
                    <Button type="submit" variant="secondary" className="py-2 px-3 text-xs" icon={Plus}>
                      Add
                    </Button>
                  </form>
                </div>
              </div>

              {/* Sidebar Config Panels (Right side 1/3) */}
              <div className="flex flex-col gap-5 bg-white/[0.01] border-l border-white/5 pl-0 md:pl-6">
                
                {/* Status Options */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</label>
                  <select
                    value={editingFields.status || 'Todo'}
                    onChange={(e) => {
                      handleFieldChange('status', e.target.value);
                      saveTaskDetails({ status: e.target.value });
                    }}
                    className="w-full bg-[#050816] text-xs font-semibold text-slate-200 border border-white/10 px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                {/* Priority Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle size={10} /> Priority
                  </label>
                  <select
                    value={editingFields.priority || 'Medium'}
                    onChange={(e) => {
                      handleFieldChange('priority', e.target.value);
                      saveTaskDetails({ priority: e.target.value });
                    }}
                    className="w-full bg-[#050816] text-xs font-semibold text-slate-200 border border-white/10 px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                {/* Category Tags */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Tag size={10} /> Category
                  </label>
                  <select
                    value={editingFields.category || 'Work'}
                    onChange={(e) => {
                      handleFieldChange('category', e.target.value);
                      saveTaskDetails({ category: e.target.value });
                    }}
                    className="w-full bg-[#050816] text-xs font-semibold text-slate-200 border border-white/10 px-3 py-2 rounded-xl cursor-pointer"
                  >
                    {['Personal', 'Work', 'Study', 'Shopping', 'Fitness', 'Meetings', 'Projects', 'Important', 'Completed'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Dates Selector */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      value={editingFields.startDate || ''}
                      onChange={(e) => {
                        handleFieldChange('startDate', e.target.value);
                        saveTaskDetails({ startDate: e.target.value });
                      }}
                      className="bg-transparent text-xs border border-white/10 rounded-xl px-3 py-2 text-slate-300 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Due Date</label>
                    <input
                      type="date"
                      value={editingFields.dueDate || ''}
                      onChange={(e) => {
                        handleFieldChange('dueDate', e.target.value);
                        saveTaskDetails({ dueDate: e.target.value });
                      }}
                      className="bg-transparent text-xs border border-white/10 rounded-xl px-3 py-2 text-slate-300 outline-none"
                    />
                  </div>
                </div>

                {/* Team Assignees list checkbox */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Assignee</label>
                  <div className="flex flex-col gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-2 max-h-32 overflow-y-auto">
                    {workspaceMembers.map(member => {
                      const mUser = member.user || {};
                      const isAssigned = editingFields.assignedTo?.includes(mUser._id);
                      return (
                        <label key={mUser._id} className="flex items-center gap-2 text-xs text-slate-300 py-1 hover:bg-white/5 px-2 rounded cursor-pointer selection:bg-transparent">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => {
                              let list = [...(editingFields.assignedTo || [])];
                              if (list.includes(mUser._id)) {
                                list = list.filter(id => id !== mUser._id);
                              } else {
                                list.push(mUser._id);
                              }
                              handleFieldChange('assignedTo', list);
                              saveTaskDetails({ assignedTo: list });
                            }}
                            className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary"
                          />
                          <span>{mUser.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Comments Panel */}
          {activeTab === 'comments' && (
            <div className="flex flex-col h-full justify-between gap-6 max-h-[50vh]">
              {/* Comments Feed List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
                {task.comments?.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 font-medium">
                    No comments posted yet. Begin the discussion below.
                  </div>
                ) : (
                  task.comments?.map((comment) => (
                    <div key={comment._id} className="flex gap-3 bg-white/[0.02] border border-white/5 p-3.5 rounded-xl text-xs">
                      <img 
                        src={comment.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} 
                        alt="commenter avatar" 
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{comment.user?.name || 'User'}</span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-semibold mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex items-center gap-3 border-t border-white/5 pt-4 bg-darkBg">
                <input
                  type="text"
                  placeholder="Ask a question or leave updates..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-primary/50"
                />
                <Button type="submit" variant="primary" className="py-2.5 px-4 text-xs" icon={Send}>
                  Comment
                </Button>
              </form>
            </div>
          )}

          {/* Time Tracking & Files Panel */}
          {activeTab === 'files' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Time tracker stopwatch widget */}
              <div className="flex flex-col gap-4 border-r border-white/5 pr-0 md:pr-8">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} /> Time Tracking & Productivity
                </span>
                
                <div className="glassmorphism p-6 rounded-2xl flex flex-col items-center gap-4 text-center border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-poppins font-extrabold text-white">
                      {editingFields.timeTracked || 0}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">minutes logged</span>
                  </div>
                  
                  <div className="text-xs text-slate-500 font-semibold">
                    Estimated Time Limit: {editingFields.estimatedHours || 0} hours
                  </div>

                  {/* Manual Hours setting */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      placeholder="Estimate (Hours)"
                      value={editingFields.estimatedHours || ''}
                      onChange={(e) => {
                        const h = parseFloat(e.target.value) || 0;
                        handleFieldChange('estimatedHours', h);
                        saveTaskDetails({ estimatedHours: h });
                      }}
                      className="w-24 text-center py-1 bg-white/5 border border-white/10 rounded text-xs text-white"
                    />
                  </div>

                  {/* Active stopwatch trigger */}
                  <Button 
                    onClick={toggleTimeTracking} 
                    variant={isTracking ? 'danger' : 'primary'}
                    icon={isTracking ? Square : Play}
                    className="w-full mt-4 py-3"
                  >
                    {isTracking ? 'Stop Focus Stopwatch' : 'Start Focus Timer'}
                  </Button>
                </div>
              </div>

              {/* Attachments List and upload widget */}
              <div className="flex flex-col gap-4">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip size={12} /> Document Attachments
                </span>
                
                {/* List Attachments */}
                <div className="flex flex-col gap-2 overflow-y-auto max-h-48 pr-2">
                  {task.attachments?.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No document files attached
                    </div>
                  ) : (
                    task.attachments?.map((file, idx) => (
                      <a 
                        key={idx} 
                        href={`http://localhost:5000${file.url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors text-xs text-slate-300 font-semibold"
                      >
                        <Paperclip size={12} className="text-slate-400" />
                        <span className="truncate flex-grow">{file.name}</span>
                        <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded font-bold uppercase text-slate-400">{file.type}</span>
                      </a>
                    ))
                  )}
                </div>

                {/* Upload Trigger Input */}
                <label className="w-full border border-dashed border-white/10 hover:border-primary/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors mt-4 bg-white/[0.01]">
                  <Paperclip size={18} className="text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-300">Drag files here, or click to upload</span>
                  <span className="text-[10px] text-slate-500 mt-1">PDF, Excel, images, ZIP up to 5MB</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default TaskModal;
