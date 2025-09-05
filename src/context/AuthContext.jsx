import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../axios';
import socket from '../socketClient'; // ⭐️ تم تعديل هذا الملف

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⭐️ 2. دالة مركزية لإعداد حالة المصادقة والاتصال
  const setupAuthSession = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    
    // ربط الـ socket بالتوكن ثم الاتصال
    socket.auth = { token };
    socket.connect();
  };

  const login = async (email, password) => {
    const { data } = await axios.post('/auth/login', { email, password });
    if (data.ok) {
      // بعد نجاح تسجيل الدخول، قم بإعداد الجلسة
      setupAuthSession(data.data.token, data.data);
    }
    return data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    socket.disconnect(); // فصل الاتصال عند تسجيل الخروج
  }, []);

  // ⭐️ 3. التحقق من التوكن عند تحميل التطبيق لأول مرة
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        // نستخدم التوكن مباشرة للتحقق
        const { data } = await axios.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.ok) {
          // إذا كان التوكن صالحًا، قم بإعداد الجلسة
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

// 3. Create a custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};