import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');

    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse local user data:', err);
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
      }
    } else {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    // Backend contract shape: response.data.data -> { token, user }
    const { token: jwtToken, user: userData } = response.data.data;

    if (!jwtToken || !userData) {
      throw new Error('Invalid backend response structure.');
    }

    setToken(jwtToken);
    setUser(userData);

    localStorage.setItem('erp_token', jwtToken);
    localStorage.setItem('erp_user', JSON.stringify(userData));

    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
  };

  const hasRole = (allowedRoles = []) => {
    if (!user || !user.role) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};