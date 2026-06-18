import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, currentWorkspaceId } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      // console.log('🔌 Connected to WebSocket Server');
      
      // Register presence
      newSocket.emit('register-user', {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar
      });
    });

    // Handle online users updates
    newSocket.on('online-users-changed', (usersList) => {
      setOnlineUsers(usersList);
    });

    // Handle incoming general notification triggers
    newSocket.on('new-notification', (notif) => {
      toast.success(notif.content, {
        icon: '🔔',
        duration: 4000
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Handle workspace room subscriptions dynamically
  useEffect(() => {
    if (socket && currentWorkspaceId) {
      socket.emit('join-workspace', currentWorkspaceId);
      
      return () => {
        socket.emit('leave-workspace', currentWorkspaceId);
      };
    }
  }, [socket, currentWorkspaceId]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
