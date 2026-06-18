import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, createTask, fetchTaskDetails } from '../store/slices/taskSlice';
import { fetchWorkspaceMembers } from '../store/slices/workspaceSlice';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  CheckCircle, Clock, AlertTriangle, Play, Check, Plus, 
  TrendingUp, Calendar, ChevronRight, Activity, CloudSun, Target, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Dashboard = ({ onOpenTaskModal }) => {
  const dispatch = useDispatch();
  const { currentWorkspaceId, user } = useAuth();
  const tasks = useSelector(state => state.tasks.items);
  const loading = useSelector(state => state.tasks.loading);

  const [quote, setQuote] = useState('Determine never to be idle.');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Work');
  const [recentLogs, setRecentLogs] = useState([]);

  // Fetch data
  const loadDashboardData = () => {
    if (currentWorkspaceId) {
      dispatch(fetchTasks({ workspaceId: currentWorkspaceId }));
      dispatch(fetchWorkspaceMembers(currentWorkspaceId));
      fetchQuote();
      fetchLogs();
    }
  };

  const fetchQuote = async () => {
    try {
      const res = await API.get('/ai/quote');
      if (res.data?.success) setQuote(res.data.quote);
    } catch (err) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await API.get('/admin/dashboard'); // Admin/Logs endpoint
      if (res.data?.success) {
        setRecentLogs(res.data.data.logs || []);
      }
    } catch (err) {
      // Direct mock fallback if they are not Admin role (Admin console has full logs access)
      setRecentLogs([
        { _id: '1', action: 'CREATE_TASK', details: 'Created task "Production launch"', createdAt: new Date().toISOString() },
        { _id: '2', action: 'UPDATE_TASK', details: 'Marked "WebSocket integration" complete', createdAt: new Date(Date.now() - 3600000).toISOString() }
      ]);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentWorkspaceId]);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !currentWorkspaceId) return;

    try {
      await dispatch(createTask({
        title: quickTitle,
        category: quickCategory,
        status: 'Todo',
        priority: 'Medium',
        workspaceId: currentWorkspaceId
      })).unwrap();
      
      setQuickTitle('');
      loadDashboardData();
    } catch (err) {}
  };

  // 1. Process Tasks count
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const review = tasks.filter(t => t.status === 'Review').length;
  const pending = tasks.filter(t => t.status === 'Todo').length;
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 2. Upcoming tasks
  const upcomingTasks = tasks
    .filter(t => t.status !== 'Completed' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  // 3. Process chart data
  // Category Breakdown for Pie Chart
  const categoriesMap = {};
  tasks.forEach(t => {
    categoriesMap[t.category] = (categoriesMap[t.category] || 0) + 1;
  });
  const pieData = Object.entries(categoriesMap).map(([name, val]) => ({ name, value: val }));
  const COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EC4899'];

  // Weekly progress Line Chart mock data
  const lineData = [
    { name: 'Mon', completed: Math.round(completed * 0.2) },
    { name: 'Tue', completed: Math.round(completed * 0.4) },
    { name: 'Wed', completed: Math.round(completed * 0.5) },
    { name: 'Thu', completed: Math.round(completed * 0.7) },
    { name: 'Fri', completed: completed },
  ];

  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      
      {/* Welcome & motivational quote widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="md:col-span-2 border-white/10 relative overflow-hidden flex flex-col justify-between p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-2">
            <h2 className="text-xl sm:text-2xl font-poppins font-extrabold text-white">
              Space sync active, {user?.name}!
            </h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Your default workspace is active. You have completed {completed} out of {total} total sprints. Let's finish your pending backlog today.
            </p>
          </div>
          <div className="mt-6 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-indigo-200 italic font-semibold flex items-center gap-2">
            <Sparkles size={12} className="text-accent flex-shrink-0" />
            <span>"{quote}"</span>
          </div>
        </GlassCard>

        {/* Weather Diagnostics widget */}
        <GlassCard className="border-white/10 flex items-center justify-between p-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">System Climate</span>
            <span className="text-2xl font-poppins font-extrabold text-white">21°C</span>
            <span className="text-xs text-slate-400 font-semibold">Clear Sky &bull; Workspace optimal</span>
          </div>
          <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent glow-accent">
            <CloudSun size={24} />
          </div>
        </GlassCard>
      </div>

      {/* Task Overview Count stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Backlog (Todo)', val: pending, color: 'text-indigo-400', border: 'border-l-primary' },
          { name: 'Active Tasks', val: inProgress, color: 'text-violet-400', border: 'border-l-secondary' },
          { name: 'In Review', val: review, color: 'text-cyan-400', border: 'border-l-accent' },
          { name: 'Completed', val: completed, color: 'text-green-400', border: 'border-l-green-500' }
        ].map((stat, i) => (
          <GlassCard key={i} className={`p-4 border-white/5 border-l-4 ${stat.border}`}>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{stat.name}</span>
            <div className={`text-xl font-poppins font-extrabold mt-1.5 ${stat.color}`}>{stat.val}</div>
          </GlassCard>
        ))}
      </div>

      {/* Graphs & Productivity Ring */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Weekly Progress chart */}
        <GlassCard className="md:col-span-2 border-white/10 flex flex-col gap-4">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={12} className="text-accent" /> Weekly Tasks Progress
          </span>
          <div className="h-60 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                <YAxis stroke="rgba(255,255,255,0.3)" />
                <Tooltip contentStyle={{ backgroundColor: '#050816', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Line type="monotone" dataKey="completed" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#06B6D4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Completion Ring Widget */}
        <GlassCard className="border-white/10 flex flex-col items-center justify-center text-center gap-4">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Productivity Ring</span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="timer-svg w-36 h-36">
              <circle cx="72" cy="72" r="60" stroke="rgba(255,255,255,0.03)" strokeWidth="10" fill="transparent" />
              <circle 
                cx="72" 
                cy="72" 
                r="60" 
                stroke="url(#indigoGrad)" 
                strokeWidth="10" 
                fill="transparent" 
                strokeDasharray={377}
                strokeDashoffset={377 - (377 * completionRate) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col">
              <span className="text-3xl font-poppins font-extrabold text-white">{completionRate}%</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">COMPLETED</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
            Overall workspace completion rate. Finish outstanding backlogs to close the ring.
          </p>
        </GlassCard>
      </div>

      {/* Split details columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Quick Add and Upcoming tasks */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Quick Add */}
          <GlassCard className="border-white/10">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 block">Quick Create Task</span>
            <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="What needs to be done next? (e.g. Write project readme)"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="flex-grow bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-primary/50"
              />
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                className="bg-[#050816] border border-white/10 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 outline-none cursor-pointer"
              >
                {['Work', 'Personal', 'Study', 'Fitness', 'Meetings', 'Projects'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Button type="submit" variant="primary" className="py-2 px-4 text-xs font-bold" icon={Plus}>
                Add Card
              </Button>
            </form>
          </GlassCard>

          {/* Upcoming tasks list */}
          <GlassCard className="border-white/10 flex flex-col gap-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} className="text-accent" /> Upcoming Schedules
            </span>
            <div className="flex flex-col gap-3">
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-medium">
                  No upcoming deadlines found.
                </div>
              ) : (
                upcomingTasks.map(task => (
                  <div 
                    key={task._id} 
                    onClick={() => onOpenTaskModal && onOpenTaskModal(task._id)}
                    className="glassmorphism p-3 rounded-xl border-white/5 hover:border-primary/30 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.color }} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{task.title}</span>
                        <span className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">{task.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold font-mono">
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      <ChevronRight size={12} className="text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Activity Feed logs */}
        <GlassCard className="border-white/10 flex flex-col gap-4">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={12} className="text-accent" /> Activity Audit Feed
          </span>
          <div className="flex-grow overflow-y-auto max-h-80 flex flex-col gap-3 pr-1 text-xs">
            {recentLogs.slice(0, 5).map((log, index) => (
              <div key={log._id || index} className="flex gap-3 items-start bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-slate-300 font-semibold leading-normal">{log.details || log.action}</span>
                  <span className="text-[8px] text-slate-500 font-bold mt-1">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default Dashboard;
