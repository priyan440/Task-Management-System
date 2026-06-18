import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/shared/Sidebar';
import Navbar from './components/shared/Navbar';
import CommandPalette from './components/shared/CommandPalette';
import TaskModal from './components/shared/TaskModal';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import CalendarView from './pages/CalendarView';
import FocusMode from './pages/FocusMode';
import Settings from './pages/Settings';
import AdminConsole from './pages/AdminConsole';

import AuroraBackground from './components/shared/AuroraBackground';
import toast, { Toaster } from 'react-hot-toast';

// Secure Private Router Guard wrapper
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] text-slate-400 flex items-center justify-center font-bold">
        🚀 Launching Aurora Workspaces...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Shared application layout configurations
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeTaskModalId, setActiveTaskModalId] = useState(null);

  // Check if current page is public auth page (does not require dashboard sidebar/nav layout)
  const isAuthPage = ['/', '/login', '/register', '/forgot-password'].includes(location.pathname) || 
                     location.pathname.startsWith('/reset-password/');

  return (
    <div className="relative min-h-screen bg-darkBg text-slate-100 flex flex-col font-sans">
      {/* Toast provider */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(5, 8, 22, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#fff',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '12px',
            backdropFilter: 'blur(8px)',
          }
        }}
      />

      {isAuthPage ? (
        // Render auth page straight
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        // Render full dashboard layouts
        <PrivateRoute>
          <div className="flex w-full min-h-screen">
            {/* Collapsible Sidebar */}
            <Sidebar 
              collapsed={sidebarCollapsed} 
              toggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />

            {/* Dashboard contents pane */}
            <div className="flex-1 flex flex-col min-w-0 bg-darkBg">
              {/* Navbar with Voice and Notifications */}
              <Navbar onSearchTrigger={() => setCommandPaletteOpen(true)} />

              {/* Page Contents */}
              <main className="flex-grow flex flex-col">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard onOpenTaskModal={setActiveTaskModalId} />} />
                  <Route path="/board" element={<KanbanBoard onOpenTaskModal={setActiveTaskModalId} />} />
                  <Route path="/calendar" element={<CalendarView onOpenTaskModal={setActiveTaskModalId} />} />
                  <Route path="/focus" element={<FocusMode />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Admin role guard check */}
                  {user?.role === 'Admin' && (
                    <Route path="/admin" element={<AdminConsole />} />
                  )}

                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </main>
            </div>
          </div>

          {/* Overlays / Modals */}
          <CommandPalette 
            isOpen={commandPaletteOpen} 
            onClose={() => setCommandPaletteOpen(false)} 
            onOpenTaskModal={setActiveTaskModalId}
          />

          {activeTaskModalId && (
            <TaskModal 
              taskId={activeTaskModalId} 
              onClose={() => setActiveTaskModalId(null)} 
            />
          )}
        </PrivateRoute>
      )}
    </div>
  );
};

export default App;
