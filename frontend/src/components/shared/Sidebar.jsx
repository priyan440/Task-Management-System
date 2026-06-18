import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/client';
import { 
  Kanban, Calendar, Clock, LayoutDashboard, Settings, LogOut, 
  Menu, ChevronLeft, ChevronRight, Plus, FolderKanban, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = ({ collapsed, toggleCollapsed }) => {
  const { user, logout, currentWorkspaceId, setCurrentWorkspaceId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [showWsModal, setShowWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsIcon, setNewWsIcon] = useState('💼');

  const fetchUserWorkspaces = async () => {
    try {
      const response = await API.get('/workspaces');
      if (response.data?.success) {
        setWorkspaces(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserWorkspaces();
    }
  }, [user]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    try {
      const response = await API.post('/workspaces', { name: newWsName, icon: newWsIcon });
      if (response.data?.success) {
        toast.success('Workspace created successfully!');
        setWorkspaces(prev => [...prev, response.data.data]);
        setCurrentWorkspaceId(response.data.data._id);
        setNewWsName('');
        setShowWsModal(false);
      }
    } catch (error) {
      toast.error('Failed to create workspace');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Kanban Board', path: '/board', icon: Kanban },
    { name: 'Calendar View', path: '/calendar', icon: Calendar },
    { name: 'Focus Timer', path: '/focus', icon: Clock },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside 
      className={`
        fixed md:sticky top-0 left-0 h-screen z-40 bg-darkBg/95 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold font-poppins text-white">
              A
            </div>
            <span className="font-poppins font-bold text-lg text-white">Aurora</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white mx-auto">
            A
          </div>
        )}
        <button 
          onClick={toggleCollapsed} 
          className="hidden md:flex items-center justify-center p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Workspace Selector */}
      <div className="px-4 py-4 border-b border-white/5">
        {!collapsed ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Workspaces</span>
              <button 
                onClick={() => setShowWsModal(true)} 
                className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
            <select
              value={currentWorkspaceId || ''}
              onChange={(e) => setCurrentWorkspaceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white/[0.03] border border-white/10 text-slate-200 font-semibold outline-none focus:border-primary/50 cursor-pointer"
            >
              {workspaces.map(ws => (
                <option key={ws._id} value={ws._id}>
                  {ws.icon} {ws.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <button 
            onClick={() => setShowWsModal(true)} 
            className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 hover:border-primary/40 text-slate-300 flex items-center justify-center mx-auto transition-colors"
            title="Create Workspace"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Navigation Options */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm
                ${isActive 
                  ? 'bg-gradient-to-r from-primary/20 to-secondary/10 text-white border-l-4 border-primary shadow-neonPrimary/5' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'}
                ${collapsed ? 'justify-center px-0' : ''}
              `}
              title={item.name}
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-slate-400'} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {/* Admin Console Route */}
        {user?.role === 'Admin' && (
          <Link
            to="/admin"
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm
              ${location.pathname === '/admin'
                ? 'bg-gradient-to-r from-accent/20 to-primary/10 text-white border-l-4 border-accent'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'}
              ${collapsed ? 'justify-center px-0' : ''}
            `}
            title="Admin Console"
          >
            <ShieldCheck size={18} className={location.pathname === '/admin' ? 'text-accent' : 'text-slate-400'} />
            {!collapsed && <span>Admin Console</span>}
          </Link>
        )}
      </nav>

      {/* Profile summary footer */}
      <div className="p-4 border-t border-white/5 flex flex-col gap-4">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <img 
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} 
            alt="user avatar" 
            className="w-10 h-10 rounded-xl object-cover border border-white/10"
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-500 font-semibold truncate">{user?.role}</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={logout}
          className={`
            flex items-center gap-3 px-4 py-2.5 rounded-xl border border-red-500/10 text-red-400 hover:text-white hover:bg-red-500/10 transition-all duration-300 text-xs font-semibold
            ${collapsed ? 'justify-center px-0 border-none' : ''}
          `}
          title="Logout Account"
        >
          <LogOut size={14} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Workspace Creation Modal */}
      {showWsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full border-white/10 p-6 shadow-neonPrimary/10">
            <h3 className="text-lg font-poppins font-extrabold text-white mb-4">Create New Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Sprint"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-primary focus:shadow-neonPrimary/10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Emoji Icon</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  placeholder="💼"
                  value={newWsIcon}
                  onChange={(e) => setNewWsIcon(e.target.value)}
                  className="w-12 text-center py-2 rounded-xl bg-white/[0.03] border border-white/10 text-lg outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowWsModal(false)} 
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-bold text-white hover:brightness-110 shadow-neonPrimary transition-all duration-300"
                >
                  Create
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
