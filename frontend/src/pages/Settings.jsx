import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/client';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { 
  User, Lock, Download, Upload, ShieldAlert, 
  Trash2, Sun, Moon, CheckCircle2, Cloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user, updateProfile, changePassword, deleteAccount, currentWorkspaceId } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Backup Importer States
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    const formData = new FormData();
    formData.append('name', profileName);
    formData.append('email', profileEmail);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const res = await updateProfile(formData);
    setProfileLoading(false);
    if (res?.success) setAvatarFile(null);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }

    setPasswordLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (res?.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleExportBackup = () => {
    if (!currentWorkspaceId) return toast.error('No active workspace selected');
    // Open CSV export endpoint in new tab to trigger browser download dialog
    window.open(`http://localhost:5000/api/v1/tasks/export/csv?workspaceId=${currentWorkspaceId}`, '_blank');
  };

  // Client-side JSON task backup importer
  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedTasks = JSON.parse(event.target.result);
        if (!Array.isArray(importedTasks)) {
          return toast.error('Invalid backup format. Must be an array of tasks.');
        }

        const importToast = toast.loading(`Importing ${importedTasks.length} task records...`);
        let count = 0;

        for (const t of importedTasks) {
          try {
            await API.post('/tasks', {
              title: t.title,
              description: t.description || '',
              status: t.status || 'Todo',
              priority: t.priority || 'Medium',
              category: t.category || 'Work',
              dueDate: t.dueDate,
              workspaceId: currentWorkspaceId,
              checklist: t.checklist || [],
              color: t.color || '#6366F1'
            });
            count++;
          } catch (err) {
            console.error('Import failed for item:', t.title);
          }
        }
        toast.success(`Successfully imported ${count} task cards!`, { id: importToast });
      } catch (err) {
        toast.error('JSON parsing failed. Verify backup integrity.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAccountConfirm = async () => {
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    await deleteAccount();
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* Profile Settings form card */}
        <GlassCard className="border-white/10 flex flex-col gap-4">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <User size={12} className="text-accent" /> Profile Configuration
          </span>

          <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-4">
              <img 
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} 
                alt="user avatar" 
                className="w-16 h-16 rounded-2xl object-cover border border-white/10"
              />
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-semibold text-slate-300">Upload new avatar</span>
                <input 
                  type="file" 
                  onChange={(e) => setAvatarFile(e.target.files[0])}
                  className="text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-white/5 file:text-white file:cursor-pointer hover:file:bg-white/10 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-semibold">Username</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-primary focus:shadow-neonPrimary/10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-semibold">Email Address</label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-primary"
              />
            </div>

            <Button type="submit" loading={profileLoading} variant="primary" className="self-start py-2 px-6 mt-2">
              Save Profile
            </Button>
          </form>
        </GlassCard>

        {/* Change Password form card */}
        <GlassCard className="border-white/10 flex flex-col gap-4">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Lock size={12} className="text-accent" /> Security Credentials
          </span>

          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-semibold">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-semibold">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-semibold">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none focus:border-primary"
              />
            </div>

            <Button type="submit" loading={passwordLoading} variant="primary" className="self-start py-2 px-6 mt-2">
              Change Password
            </Button>
          </form>
        </GlassCard>

        {/* Theme Settings & Backup Recovery Options */}
        <GlassCard className="border-white/10 flex flex-col gap-4">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Download size={12} className="text-accent" /> Data Back-up & Recovery
          </span>

          <div className="flex flex-col gap-4 mt-2 text-xs">
            {/* Export data */}
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-xl">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-white">Backup CSV spreadsheet</span>
                <span className="text-slate-500 font-medium">Download all tasks data for active workspace channel.</span>
              </div>
              <Button onClick={handleExportBackup} variant="secondary" icon={Download} className="py-2 text-xs">
                Export Data
              </Button>
            </div>

            {/* Import Data */}
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-xl">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-white">Import JSON Backup</span>
                <span className="text-slate-500 font-medium">Re-populate workspaces from offline task lists.</span>
              </div>
              <label className="bg-white/5 px-4 py-2 rounded-xl text-slate-200 border border-white/10 text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors flex items-center gap-2">
                <Upload size={12} />
                <span>Upload JSON</span>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </GlassCard>

        {/* System parameters & Account deletions */}
        <GlassCard className="border-white/10 border-l-4 border-l-red-500 flex flex-col gap-4">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-red-400" /> Account Termination
          </span>

          <div className="flex flex-col gap-4 mt-2 text-xs">
            <p className="text-slate-400 leading-normal font-semibold">
              Deleting your account is permanent. It tears down all workspaces owned by you, comment structures, checklists, and active session configurations.
            </p>

            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col">
                <span className="font-bold text-white">Permanently delete account</span>
                {showConfirmDelete && (
                  <span className="text-red-400 font-bold text-[10px] uppercase mt-1 animate-pulse">
                    Are you absolutely sure? Click again to execute.
                  </span>
                )}
              </div>
              <Button 
                onClick={handleDeleteAccountConfirm} 
                variant="danger" 
                icon={Trash2} 
                className="py-2.5 px-6 font-bold"
              >
                {showConfirmDelete ? 'Confirm Delete' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default Settings;
