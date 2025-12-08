/**
 * Socket Context
 * Provides real-time communication capabilities using Socket.io
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [attendanceUpdates, setAttendanceUpdates] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
        auth: {
          token: localStorage.getItem('token'),
          userId: user.id,
          userRole: user.role
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Join user-specific room
        newSocket.emit('join-room', {
          userId: user.id,
          userRole: user.role
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Attendance-related events
      newSocket.on('attendance-session-started', (data) => {
        setAttendanceUpdates(prev => [...prev, {
          type: 'session-started',
          data,
          timestamp: new Date()
        }]);
      });

      newSocket.on('attendance-session-ended', (data) => {
        setAttendanceUpdates(prev => [...prev, {
          type: 'session-ended',
          data,
          timestamp: new Date()
        }]);
      });

      newSocket.on('attendance-marked', (data) => {
        setAttendanceUpdates(prev => [...prev, {
          type: 'attendance-marked',
          data,
          timestamp: new Date()
        }]);
      });

      newSocket.on('class-notification', (data) => {
        setAttendanceUpdates(prev => [...prev, {
          type: 'class-notification',
          data,
          timestamp: new Date()
        }]);
      });

      setSocket(newSocket);

      // Cleanup function
      return () => {
        newSocket.close();
      };
    } else {
      // Cleanup when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setAttendanceUpdates([]);
      }
    }
  }, [isAuthenticated, user]);

  // Helper functions
  const joinAttendanceSession = (classId) => {
    if (socket && isConnected) {
      socket.emit('join-attendance-session', { classId });
    }
  };

  const leaveAttendanceSession = (classId) => {
    if (socket && isConnected) {
      socket.emit('leave-attendance-session', { classId });
    }
  };

  const markAttendance = (attendanceData) => {
    if (socket && isConnected) {
      socket.emit('mark-attendance', attendanceData);
    }
  };

  const clearAttendanceUpdates = () => {
    setAttendanceUpdates([]);
  };

  const value = {
    socket,
    isConnected,
    attendanceUpdates,
    joinAttendanceSession,
    leaveAttendanceSession,
    markAttendance,
    clearAttendanceUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;