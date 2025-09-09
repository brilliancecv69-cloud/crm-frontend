import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../axios';
// ✅ 1. استيراد الـ socket بالإضافة إلى دوال الاتصال
import socket, { connectSocket, disconnectSocket } from '../socketClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setupAuthSession = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    connectSocket(token, userData);
  };

  const login = async (email, password) => {
    const { data } = await axios.post('/auth/login', { email, password });
    if (data.ok) {
      setupAuthSession(data.data.token, data.data);
    }
    return data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    disconnectSocket();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const { data } = await axios.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.ok) {
          setupAuthSession(token, data.data);
        } else {
          logout();
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    verifyToken();
  }, [logout]);

  // --- ✅ START: NEW EFFECT FOR HANDLING REAL-TIME EVENTS ---
  useEffect(() => {
    // We only listen for events if a user is logged in
    if (user) {
      const handleForceLogout = (data) => {
        console.log('Force logout event received from server:', data.message);
        // You can use a more sophisticated notification library like react-toastify
        alert(`You have been logged out automatically.\nReason: ${data.message}`);
        logout();
      };

      // Listen for the 'force_logout' event from the server
      socket.on('force_logout', handleForceLogout);

      // Cleanup: It's important to remove the listener when the component unmounts
      // or when the user logs out to prevent memory leaks.
      return () => {
        socket.off('force_logout', handleForceLogout);
      };
    }
  }, [user, logout]); // Dependencies: Re-run this effect if user or logout function changes
  // --- ✅ END: NEW EFFECT FOR HANDLING REAL-TIME EVENTS ---


  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};