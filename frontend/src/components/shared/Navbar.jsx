import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import API from '../../api/client';
import { 
  Bell, Search, Sun, Moon, Mic, Sparkles, Check, CheckSquare, 
  Trash2, Volume2, ShieldCheck, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = ({ onSearchTrigger }) => {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/notifications');
      if (response.data?.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Hook WebSockets for incoming notifications
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
      };
      
      socket.on('new-notification', handleNewNotification);
      return () => {
        socket.off('new-notification', handleNewNotification);
      };
    }
  }, [socket]);

  const markRead = async (id) => {
    try {
      const res = await API.put(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      const res = await API.put('/notifications/read-all');
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications cleared');
      }
    } catch (err) {}
  };

  // Web Speech API Voice Search
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported by this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast('Voice recognizer listening... Speak task title.', { icon: '🎙️' });
    };

    recognition.onerror = (event) => {
      console.error('Voice search error:', event.error);
      setIsListening(false);
      toast.error('Could not capture voice input');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      toast.success(`Search query captured: "${transcript}"`);
      if (onSearchTrigger) {
        onSearchTrigger(transcript);
      }
    };

    recognition.start();
  };

  // Listen to keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (onSearchTrigger) {
          onSearchTrigger(''); // Trigger Command Palette
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchTrigger]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 w-full z-30 bg-darkBg/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
      {/* Search Bar Trigger */}
      <div 
        onClick={() => onSearchTrigger && onSearchTrigger('')}
        className="w-full max-w-md bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all rounded-xl py-2 px-4 flex items-center gap-3 text-slate-400 cursor-pointer"
      >
        <Search size={16} />
        <span className="text-xs font-semibold">Search everything...</span>
        <span className="ml-auto text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono border border-white/5 text-slate-300 font-bold">
          Ctrl + K
        </span>
      </div>

      {/* Quick Action controls */}
      <div className="flex items-center gap-4 relative">
        {/* Voice Speech Recognition Trigger */}
        <button 
          onClick={handleVoiceSearch}
          className={`
            p-2.5 rounded-xl border transition-all duration-300
            ${isListening 
              ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse glow-secondary' 
              : 'bg-white/[0.03] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.06]'}
          `}
          title="Voice Search Tasks"
        >
          <Mic size={16} />
        </button>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all duration-300"
          title="Toggle UI Theme"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification panel */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all duration-300 relative"
            title="Read Alerts"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications feed dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glassmorphism rounded-2xl border-white/10 shadow-glass overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold font-poppins text-slate-200">Alert Center</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-[10px] text-accent font-semibold hover:underline flex items-center gap-1"
                  >
                    <CheckSquare size={10} /> Clear all
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto flex flex-col divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 font-medium">
                    No new alerts to show
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif._id} 
                      onClick={() => markRead(notif._id)}
                      className={`
                        px-4 py-3 flex gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors
                        ${!notif.read ? 'bg-primary/5' : ''}
                      `}
                    >
                      <div className="w-1.5 h-1.5 rounded-full mt-2 self-start flex-shrink-0 bg-accent" style={{ opacity: notif.read ? 0 : 1 }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-slate-300 leading-normal">{notif.content}</span>
                        <span className="text-[9px] text-slate-500 font-semibold mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
