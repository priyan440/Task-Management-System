import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, createTask } from '../store/slices/taskSlice';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, 
  Clock, Tag, ShieldCheck, Target, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const CalendarView = ({ onOpenTaskModal }) => {
  const dispatch = useDispatch();
  const { currentWorkspaceId } = useAuth();
  const tasks = useSelector(state => state.tasks.items);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetDateStr, setTargetDateStr] = useState('');
  
  // Quick task creation form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Work');
  const [newPriority, setNewPriority] = useState('Medium');

  useEffect(() => {
    if (currentWorkspaceId) {
      dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
    }
  }, [currentWorkspaceId]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // day of week (0-6)

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const calendarCells = [];
  // Empty blocks for padding before first day
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(new Date(year, month, d));
  }

  const handleCellClick = (date) => {
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    setTargetDateStr(dateStr);
    
    // Filter tasks on this day
    const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === dateStr);
    setSelectedDayTasks(dayTasks);
    setShowAddModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentWorkspaceId || !targetDateStr) return;

    try {
      const created = await dispatch(createTask({
        title: newTitle,
        category: newCategory,
        priority: newPriority,
        dueDate: targetDateStr,
        status: 'Todo',
        workspaceId: currentWorkspaceId
      })).unwrap();

      setNewTitle('');
      setShowAddModal(false);
      dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
    } catch (err) {}
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 h-[92vh] overflow-hidden">
      
      {/* Calendar Header with Controls */}
      <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <CalIcon className="text-primary w-5 h-5 animate-pulse-slow" />
          <h3 className="text-lg font-poppins font-extrabold text-white">
            {monthNames[month]} {year}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 bg-white/[0.03] border border-white/10 hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 bg-white/[0.03] border border-white/10 hover:border-slate-500 rounded-xl text-xs font-bold text-slate-300"
          >
            Today
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 bg-white/[0.03] border border-white/10 hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-grow bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
        {/* Days of week titles */}
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex-shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Days grid cells */}
        <div className="flex-grow grid grid-cols-7 gap-2 overflow-y-auto">
          {calendarCells.map((cellDate, index) => {
            if (!cellDate) {
              return <div key={`empty-${index}`} className="bg-transparent rounded-xl border border-transparent min-h-[90px]" />;
            }

            const isToday = cellDate.toDateString() === new Date().toDateString();
            const dateStr = cellDate.toISOString().split('T')[0];
            const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === dateStr);

            return (
              <div
                key={`day-${index}`}
                onClick={() => handleCellClick(cellDate)}
                className={`
                  rounded-xl border p-2 flex flex-col gap-1 min-h-[90px] cursor-pointer text-left transition-all duration-300 select-none group
                  ${isToday 
                    ? 'bg-primary/10 border-primary shadow-neonPrimary/10' 
                    : 'bg-white/[0.01] border-white/5 hover:border-white/20 hover:bg-white/[0.03]'}
                `}
              >
                {/* Day Number */}
                <span className={`text-[10px] font-bold ${isToday ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
                  {cellDate.getDate()}
                </span>

                {/* Day Tasks Badges */}
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[70px]">
                  {dayTasks.map(task => (
                    <div
                      key={task._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenTaskModal) onOpenTaskModal(task._id);
                      }}
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold truncate transition-all active:scale-95 text-white shadow"
                      style={{ 
                        backgroundColor: task.color || '#6366F1',
                        opacity: task.status === 'Completed' ? 0.6 : 1,
                        textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                      }}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date details and quick task creation modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <GlassCard 
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full border-white/10 shadow-neonPrimary/10 p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target Schedule Date</span>
                <span className="text-base font-poppins font-extrabold text-white">{new Date(targetDateStr).toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Existing tasks on this date */}
            {selectedDayTasks.length > 0 && (
              <div className="flex flex-col gap-2 mb-6 text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tasks Due Today ({selectedDayTasks.length})</span>
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {selectedDayTasks.map(t => (
                    <div 
                      key={t._id} 
                      onClick={() => {
                        if (onOpenTaskModal) onOpenTaskModal(t._id);
                        setShowAddModal(false);
                      }}
                      className="glassmorphism p-2 rounded-lg border-white/5 hover:border-primary/20 text-xs text-slate-200 cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate font-semibold">{t.title}</span>
                      <ArrowUpRight size={10} className="text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Add Form */}
            <form onSubmit={handleCreateTask} className="flex flex-col gap-4 text-left">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quick Schedule Task</span>
              
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-primary focus:shadow-neonPrimary/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-[#050816] text-xs text-slate-200 border border-white/10 px-3 py-2 rounded-xl"
                  >
                    {['Work', 'Personal', 'Study', 'Fitness', 'Meetings', 'Projects'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="bg-[#050816] text-xs text-slate-200 border border-white/10 px-3 py-2 rounded-xl"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full mt-2 py-3" icon={Plus}>
                Schedule Card
              </Button>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

// Import Close Icon for popup close
import { X } from 'lucide-react';
export default CalendarView;
