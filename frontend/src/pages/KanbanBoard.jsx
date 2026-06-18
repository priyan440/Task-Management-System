import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTasks, updateTask, deleteTask, wsTaskCreated, 
  wsTaskUpdated, wsTaskDeleted, pushUndoTask, popUndoTask 
} from '../store/slices/taskSlice';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/client';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Search, Filter, Plus, Pin, Star, Clock, CheckSquare, 
  Paperclip, MessageSquare, AlertCircle, Edit, Trash2, ArrowUpRight, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const KanbanBoard = ({ onOpenTaskModal }) => {
  const dispatch = useDispatch();
  const { currentWorkspaceId, user } = useAuth();
  const { socket } = useSocket();

  const tasks = useSelector(state => state.tasks.items);
  const filters = useSelector(state => state.tasks.filters);
  const undoStack = useSelector(state => state.tasks.undoStack);
  const loading = useSelector(state => state.tasks.loading);

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showQuickAddColumn, setShowQuickAddColumn] = useState(null); // column name
  const [quickTitle, setQuickTitle] = useState('');

  // Fetch tasks when workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
    }
  }, [currentWorkspaceId]);

  // Hook WebSockets for real-time board updates
  useEffect(() => {
    if (socket && currentWorkspaceId) {
      const handleTaskCreated = (newTask) => {
        dispatch(wsTaskCreated(newTask));
      };
      const handleTaskUpdated = (updatedTask) => {
        dispatch(wsTaskUpdated(updatedTask));
      };
      const handleTaskDeleted = (payload) => {
        dispatch(wsTaskDeleted(payload));
      };
      const handleReloadBoard = () => {
        dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
      };

      socket.on('task-created', handleTaskCreated);
      socket.on('task-updated', handleTaskUpdated);
      socket.on('task-deleted', handleTaskDeleted);
      socket.on('board-reload', handleReloadBoard);

      return () => {
        socket.off('task-created', handleTaskCreated);
        socket.off('task-updated', handleTaskUpdated);
        socket.off('task-deleted', handleTaskDeleted);
        socket.off('board-reload', handleReloadBoard);
      };
    }
  }, [socket, currentWorkspaceId]);

  // Handle Drag Completion
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside list
    if (!destination) return;

    // Dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    // Fetch the dragged task
    const draggedTask = tasks.find(t => t._id === draggableId);
    if (!draggedTask) return;

    // Optimistic UI updates
    const updatedTask = { ...draggedTask, status: destColumn };
    if (destColumn === 'Completed') {
      updatedTask.progress = 100;
    } else if (sourceColumn === 'Completed') {
      updatedTask.progress = 0; // reset completed checklist status if moved back
    }
    dispatch(wsTaskUpdated(updatedTask));

    try {
      await dispatch(updateTask({
        id: draggableId,
        fields: { 
          status: destColumn,
          progress: destColumn === 'Completed' ? 100 : draggedTask.progress
        }
      })).unwrap();
    } catch (err) {
      toast.error('Could not sync drag transition to server');
      // Rollback to source columns
      dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
    }
  };

  const handleQuickAdd = async (column) => {
    if (!quickTitle.trim() || !currentWorkspaceId) return;

    try {
      await dispatch(createTask({
        title: quickTitle,
        status: column,
        category: 'Work',
        priority: 'Medium',
        workspaceId: currentWorkspaceId
      })).unwrap();

      setQuickTitle('');
      setShowQuickAddColumn(null);
    } catch (err) {}
  };

  const handleUndoDelete = async () => {
    if (undoStack.length === 0) return;
    const lastDeleted = undoStack[undoStack.length - 1];

    try {
      // Re-create the deleted task
      await API.post('/tasks', {
        title: lastDeleted.title,
        description: lastDeleted.description,
        status: lastDeleted.status,
        priority: lastDeleted.priority,
        category: lastDeleted.category,
        dueDate: lastDeleted.dueDate,
        workspaceId: currentWorkspaceId,
        checklist: lastDeleted.checklist,
        progress: lastDeleted.progress,
        color: lastDeleted.color
      });
      toast.success('Task restored successfully!');
      dispatch(popUndoTask());
      dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
    } catch (err) {
      toast.error('Failed to undo deletion');
    }
  };

  const handleDeleteTask = async (id, e) => {
    e.stopPropagation();
    try {
      const deletedTaskResponse = await dispatch(deleteTask(id)).unwrap();
      
      // Present Undo action Toast
      toast((t) => (
        <span className="flex items-center gap-3">
          Task deleted.
          <button 
            onClick={() => {
              handleUndoDelete();
              toast.dismiss(t.id);
            }}
            className="flex items-center gap-1 text-accent font-extrabold hover:underline"
          >
            <RotateCcw size={12} /> Undo
          </button>
        </span>
      ), { duration: 5000 });

    } catch (err) {}
  };

  // 1. Columns configuration
  const columns = ['Todo', 'In Progress', 'Review', 'Completed'];

  // 2. Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
    const matchesCategory = categoryFilter ? task.category === categoryFilter : true;
    return matchesSearch && matchesPriority && matchesCategory;
  });

  return (
    <div className="flex-grow p-6 flex flex-col gap-6 h-[92vh] overflow-hidden">
      
      {/* Filtering Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Text search input */}
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary/50"
            />
          </div>

          {/* Priority filter selector */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#050816] border border-white/10 px-3 py-2 rounded-xl text-xs text-slate-300 font-semibold cursor-pointer outline-none"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Category filter selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#050816] border border-white/10 px-3 py-2 rounded-xl text-xs text-slate-300 font-semibold cursor-pointer outline-none"
          >
            <option value="">All Categories</option>
            {['Personal', 'Work', 'Study', 'Shopping', 'Fitness', 'Meetings', 'Projects', 'Important'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Undo stack triggers indicator */}
        {undoStack.length > 0 && (
          <Button onClick={handleUndoDelete} variant="glass" className="py-2 px-3 text-xs" icon={RotateCcw}>
            Undo Action
          </Button>
        )}
      </div>

      {/* Kanban Drag Drop Board Context layout */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4 h-full items-start">
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter(t => t.status === column);

            return (
              <div key={column} className="flex flex-col max-h-[72vh] bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                {/* Column details header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-poppins font-extrabold text-white">{column}</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-slate-400 font-bold">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowQuickAddColumn(column)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Quick Add item form card inside lane */}
                {showQuickAddColumn === column && (
                  <GlassCard className="p-3 border-primary/20 mb-3 flex-shrink-0">
                    <input
                      type="text"
                      placeholder="Enter card name..."
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(column)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary mb-2"
                    />
                    <div className="flex justify-end gap-2 text-[10px] font-bold">
                      <button onClick={() => setShowQuickAddColumn(null)} className="text-slate-500 hover:text-white px-2 py-1">Cancel</button>
                      <button onClick={() => handleQuickAdd(column)} className="bg-primary px-3 py-1 rounded text-white hover:brightness-115">Add</button>
                    </div>
                  </GlassCard>
                )}

                {/* Droppable Board lane container */}
                <Droppable droppableId={column}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 flex flex-col gap-3.5 overflow-y-auto pr-1 pb-10 transition-all ${snapshot.isDraggingOver ? 'bg-primary/5 rounded-xl border border-dashed border-primary/20' : ''}`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onOpenTaskModal && onOpenTaskModal(task._id)}
                              style={{ 
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1
                              }}
                              className={`
                                glassmorphism border-white/5 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-white/20 select-none group relative
                                ${task.pinned ? 'border-t-2 border-t-primary' : ''}
                              `}
                            >
                              {/* Task Card Header details */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  {task.pinned && <Pin size={10} className="text-primary rotate-45" />}
                                  {task.favorite && <Star size={10} className="text-yellow-500 fill-yellow-500" />}
                                  <span className="text-[9px] bg-white/5 text-indigo-300 font-bold font-mono px-1.5 py-0.5 rounded border border-white/5">
                                    {task.category}
                                  </span>
                                </div>
                                <button 
                                  onClick={(e) => handleDeleteTask(task._id, e)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-opacity self-start"
                                  title="Delete Card"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {/* Task Title */}
                              <h4 className="text-xs font-bold font-poppins text-slate-200 mt-2.5 leading-normal truncate group-hover:text-primary transition-colors">
                                {task.title}
                              </h4>

                              {/* Indicators feed items */}
                              <div className="flex items-center gap-4 mt-4 text-[9px] text-slate-500 font-bold">
                                {task.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Clock size={9} /> {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                {task.checklist?.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <CheckSquare size={9} /> {task.checklist.filter(c => c.done).length}/{task.checklist.length}
                                  </span>
                                )}
                                {task.comments?.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare size={9} /> {task.comments.length}
                                  </span>
                                )}
                                {task.attachments?.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Paperclip size={9} /> {task.attachments.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
