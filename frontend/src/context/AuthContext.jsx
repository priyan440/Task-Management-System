import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);

  useEffect(() => {
    // Check local storage on load
    const loadSession = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const response = await API.get('/auth/me');
          if (response.data?.success) {
            setUser(response.data.data);
            localStorage.setItem('user', JSON.stringify(response.data.data));
            
            // Set default workspace
            if (response.data.data.defaultWorkspaceId) {
              setCurrentWorkspaceId(response.data.data.defaultWorkspaceId);
            }
          }
        } catch (err) {
          // Token expired or invalid
          console.error('Session validation failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    loadSession();

    // Listen to session expiry events from client axios client
    const handleExpiry = () => {
      setUser(null);
      setCurrentWorkspaceId(null);
      toast.error('Session expired. Please login again.');
    };

    window.addEventListener('auth-session-expired', handleExpiry);
    return () => window.removeEventListener('auth-session-expired', handleExpiry);
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await API.post('/auth/login', { email, password, rememberMe });
      if (response.data?.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        if (userData.defaultWorkspaceId) {
          setCurrentWorkspaceId(userData.defaultWorkspaceId);
        } else {
          // Fetch user workspaces if no default in payload
          const wsResponse = await API.get('/workspaces');
          if (wsResponse.data?.data?.length > 0) {
            setCurrentWorkspaceId(wsResponse.data.data[0]._id);
          }
        }
        
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await API.post('/auth/register', { name, email, password });
      if (response.data?.success) {
        toast.success(response.data.message, { duration: 6000 });
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setCurrentWorkspaceId(null);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (formData) => {
    try {
      const response = await API.put('/auth/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data?.success) {
        const updated = response.data.data;
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        toast.success('Profile updated successfully');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Update profile failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await API.put('/auth/change-password', { currentPassword, newPassword });
      if (response.data?.success) {
        toast.success('Password changed successfully');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Change password failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await API.delete('/auth/delete-account');
      if (response.data?.success) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setCurrentWorkspaceId(null);
        toast.success('Account deleted successfully');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Delete account failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      currentWorkspaceId,
      setCurrentWorkspaceId,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
