import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aarna_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('aarna_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('aarna_user', JSON.stringify(res.data));
          }
        } catch {
          localStorage.removeItem('aarna_token');
          localStorage.removeItem('aarna_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.success && res.data) {
      const userData = res.data;
      localStorage.setItem('aarna_token', userData.token);
      localStorage.setItem('aarna_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.success && res.data) {
      const userData = res.data;
      localStorage.setItem('aarna_token', userData.token);
      localStorage.setItem('aarna_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.success && res.data) {
      const userData = res.data;
      if (userData.token) {
        localStorage.setItem('aarna_token', userData.token);
      }
      localStorage.setItem('aarna_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(res.message || 'Profile update failed');
  };

  const logout = () => {
    localStorage.removeItem('aarna_token');
    localStorage.removeItem('aarna_user');
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'OWNER') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
