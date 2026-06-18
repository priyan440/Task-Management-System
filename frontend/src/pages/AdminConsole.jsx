import React, { useEffect, useState } from 'react';
import API from '../api/client';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { 
  Users, Terminal, ShieldAlert, Cpu, Database, 
  Trash2, RefreshCw, Activity, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const AdminConsole = () => {
  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('users'); // users, logs, diagnostics

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const metricsRes = await API.get('/admin/dashboard');
      if (metricsRes.data?.success) {
        setMetrics(metricsRes.data.data);
      }
      
      const usersRes = await API.get('/admin/users');
      if (usersRes.data?.success) {
        setUsersList(usersRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load administrative panels data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await API.put(`/admin/users/${userId}`, { role: newRole });
      if (res.data?.success) {
        toast.success('User authorization role updated successfully!');
        setUsersList(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      toast.error('Failed to change user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    
    try {
      const res = await API.delete(`/admin/users/${userId}`);
      if (res.data?.success) {
        toast.success('User deleted successfully');
        setUsersList(prev => prev.filter(u => u._id !== userId));
      }
    } catch (error) {
      toast.error('Could not delete user account');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold">
        🔒 Validating credentials and launching Admin console diagnostics...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
      
      {/* Console Header details */}
      <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-400 w-5 h-5 animate-pulse" />
          <h3 className="text-lg font-poppins font-extrabold text-white">System Admin Console</h3>
        </div>
        <Button onClick={loadAdminData} variant="secondary" icon={RefreshCw} className="py-2 text-xs">
          Refresh Systems
        </Button>
      </div>

      {/* Grid count aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        {[
          { name: 'System Database', val: metrics?.system?.databaseType.split(' ')[0] || 'JSON', icon: Database },
          { name: 'Registered Users', val: metrics?.counts?.users || usersList.length, icon: Users },
          { name: 'Active Tasks', val: metrics?.counts?.tasks || 0, icon: Activity },
          { name: 'Allocated Heap', val: metrics?.system?.memoryUsage || '0 MB', icon: Cpu }
        ].map((c, idx) => {
          const Icon = c.icon;
          return (
            <GlassCard key={idx} className="p-4 border-white/5 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{c.name}</span>
                <span className="text-base font-poppins font-extrabold mt-1 text-white truncate max-w-[130px]">{c.val}</span>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Icon size={14} /></div>
            </GlassCard>
          );
        })}
      </div>

      {/* Tabs list inside console */}
      <div className="flex border-b border-white/5 bg-white/[0.01]">
        <button 
          onClick={() => setActiveSubTab('users')}
          className={`px-6 py-3 text-xs font-semibold border-b-2 transition-all ${activeSubTab === 'users' ? 'border-primary text-white' : 'border-transparent text-slate-400'}`}
        >
          Users Management
        </button>
        <button 
          onClick={() => setActiveSubTab('logs')}
          className={`px-6 py-3 text-xs font-semibold border-b-2 transition-all ${activeSubTab === 'logs' ? 'border-primary text-white' : 'border-transparent text-slate-400'}`}
        >
          Audit History Logs
        </button>
        <button 
          onClick={() => setActiveSubTab('diagnostics')}
          className={`px-6 py-3 text-xs font-semibold border-b-2 transition-all ${activeSubTab === 'diagnostics' ? 'border-primary text-white' : 'border-transparent text-slate-400'}`}
        >
          System Diagnostics
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 text-left">
        
        {/* User list table grid */}
        {activeSubTab === 'users' && (
          <GlassCard className="border-white/10 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-300">
                <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email Address</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Permissions Role</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-semibold">
                  {usersList.map(u => (
                    <tr key={u._id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img 
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} 
                          alt="avatar" 
                          className="w-7 h-7 rounded-lg object-cover border border-white/5"
                        />
                        <span className="text-white font-bold">{u.name}</span>
                      </td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${u.isVerified ? 'bg-green-500/20 text-green-300 border border-green-500/20' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20'}`}>
                          {u.isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="bg-[#050816] text-[10px] font-bold uppercase text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          <option value="User">User</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/20 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Audit Logs logs feed */}
        {activeSubTab === 'logs' && (
          <GlassCard className="border-white/10 flex flex-col gap-3">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">System Activities Feed</span>
            <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-2">
              {metrics?.logs?.map((log, i) => (
                <div key={log._id || i} className="flex gap-4 p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0 animate-pulse" />
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span className="font-bold text-slate-300">{log.user?.name || 'System'} ({log.user?.email || 'event'})</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-300 font-bold mt-1 leading-normal">{log.details || log.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* System diagnostics parameters */}
        {activeSubTab === 'diagnostics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="border-white/10 flex flex-col gap-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Cpu size={12} className="text-accent" /> Server Diagnostics
              </span>
              <div className="flex flex-col gap-3 text-xs mt-2 font-semibold">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Node JS Runtime</span>
                  <span className="text-slate-200">{metrics?.system?.nodeVersion}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Operation System</span>
                  <span className="text-slate-200 capitalize">{metrics?.system?.platform}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Memory Usage</span>
                  <span className="text-slate-200">{metrics?.system?.memoryUsage}</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="border-white/10 flex flex-col gap-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Database size={12} className="text-accent" /> Active Database Mode
              </span>
              <div className="flex flex-col gap-3 text-xs mt-2 font-semibold leading-relaxed">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Primary Core</span>
                  <span className="text-indigo-400">{metrics?.system?.databaseType}</span>
                </div>
                <p className="text-slate-500 mt-2">
                  Our dual database schema automatically registers MongoDB status. If it hangs or times out, the local JSON Flat-file engine activates to preserve full platform runnability.
                </p>
              </div>
            </GlassCard>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminConsole;
