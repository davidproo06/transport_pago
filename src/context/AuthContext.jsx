import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('transpago_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await authApi.getMe();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const data = await authApi.login(username, password);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('Refresh error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
