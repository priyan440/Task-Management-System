import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTaskDetails } from '../../store/slices/taskSlice';
import GlassCard from './GlassCard';
import { Search, Terminal, ArrowRight, Kanban, Calendar, Settings, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommandPalette = ({ isOpen, onClose, onOpenTaskModal, onOpenCreateTask }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tasks = useSelector(state => state.tasks.items);
  
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter tasks based on input
  const filteredTasks = query.trim() === ''
    ? []
    : tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  const navigationActions = [
    { name: 'Navigate to Kanban Board', path: '/board', icon: Kanban, desc: 'Drag-and-drop workflow status card lanes' },
    { name: 'Navigate to Calendar View', path: '/calendar', icon: Calendar, desc: 'Schedule, agenda, and due dates grid' },
    { name: 'Navigate to Focus Timer', path: '/focus', icon: Clock, desc: 'Boost concentration using Pomodoro method' },
    { name: 'Navigate to Settings Panel', path: '/settings', icon: Settings, desc: 'Toggle user themes, delete accounts' },
  ];

  const handleAction = (item) => {
    if (item.path) {
      navigate(item.path);
      onClose();
    }
  };

  const handleTaskClick = (id) => {
    dispatch(fetchTaskDetails(id));
    onOpenTaskModal(id);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl"
        >
          <GlassCard className="p-0 border-white/10 shadow-neonPrimary/10 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-white/[0.01]">
              <Search className="text-slate-500 w-5 h-5" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tasks, navigate views, trigger command actions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">ESC to Exit</span>
            </div>

            {/* List Results */}
            <div className="p-2 max-h-80 overflow-y-auto flex flex-col gap-1">
              
              {/* Task results search */}
              {filteredTasks.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1">Matching Tasks</span>
                  {filteredTasks.map(task => (
                    <div
                      key={task._id}
                      onClick={() => handleTaskClick(task._id)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs text-white font-semibold">{task.title}</span>
                        <span className="text-[9px] text-slate-500 font-bold">{task.category} &bull; {task.status}</span>
                      </div>
                      <ArrowRight size={12} className="text-slate-400" />
                    </div>
                  ))}
                  <div className="h-px bg-white/5 my-1" />
                </div>
              )}

              {/* Suggestions */}
              {query.trim().length > 0 && filteredTasks.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-500 font-semibold">
                  No matching tasks found for "{query}"
                </div>
              )}

              {/* Navigation Actions */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1">Navigation Commands</span>
                {navigationActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.name}
                      onClick={() => handleAction(action)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400">
                        <Icon size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-200 font-semibold">{action.name}</span>
                        <span className="text-[9px] text-slate-500">{action.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create Task Shortcut trigger */}
              <div className="h-px bg-white/5 my-1" />
              <div 
                onClick={() => { onOpenCreateTask && onOpenCreateTask(); onClose(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-accent transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-200 font-semibold">Create New Task Card</span>
                  <span className="text-[9px] text-slate-500">Bypasses lists to spawn new task modals</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPalette;
