'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on initial load
  const verifySession = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem('foodly_pos_token');
    const storedUser = localStorage.getItem('foodly_pos_user');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // ignore json parse error
      }
    }

    try {
      const res = await api.get('/auth/me');
      if (res?.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('foodly_pos_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      if (err.status === 401) {
        console.warn('Session expired or invalid, clearing credentials');
        localStorage.removeItem('foodly_pos_token');
        localStorage.removeItem('foodly_pos_user');
        setUser(null);
        setToken(null);
      } else {
        // Retain local session cache on network or temporary backend maintenance
        console.warn('Backend temporarily unreachable during session verification:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);

    if (typeof window !== 'undefined') {
      localStorage.setItem('foodly_pos_token', receivedToken);
      localStorage.setItem('foodly_pos_user', JSON.stringify(receivedUser));
    }

    return receivedUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('foodly_pos_token');
      localStorage.removeItem('foodly_pos_user');
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res?.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('foodly_pos_user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      // ignore
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
