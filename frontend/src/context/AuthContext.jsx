import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // The response payload will be inside response.data (e.g. { data: { token, email, role } }) or response.data direct
      // Let's assume standard response wrapper ApiResponse { success, message, data }
      const resData = response.data.data || response.data;
      
      const { token: jwtToken, role } = resData;
      const userData = { email, role };

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(jwtToken);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      const message = error.response?.data?.message || 'Invalid email or password';
      return { success: false, error: message };
    }
  };

  const register = async (firstName, lastName, email, password) => {
    try {
      await api.post('/auth/register', { firstName, lastName, email, password });
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      const message = error.response?.data?.message || 'Registration failed. Email may already be in use.';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
