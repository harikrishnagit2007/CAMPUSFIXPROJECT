import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('campusfix_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('campusfix_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and verify session directly with Spring Boot backend
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = localStorage.getItem('campusfix_token');
      if (storedToken) {
        try {
          const userData = await authApi.getCurrentUser();
          if (isMounted) {
            setUser(userData);
            localStorage.setItem('campusfix_user', JSON.stringify(userData));
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          localStorage.removeItem('campusfix_token');
          localStorage.removeItem('campusfix_user');
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      }
      if (isMounted) setLoading(false);
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Google Sign-In powered by Spring Boot REST API and MySQL persistence
  const signInWithGoogle = async (preferredRole = 'STUDENT') => {
    try {
      const cleanRole = preferredRole ? preferredRole.toUpperCase() : 'STUDENT';
      const email = `${cleanRole.toLowerCase()}@campusfix.edu`;
      const name = `${cleanRole.charAt(0) + cleanRole.slice(1).toLowerCase()} Member`;
      
      const data = await authApi.googleLogin({
        email,
        name,
        role: cleanRole,
      });

      localStorage.setItem('campusfix_token', data.token);
      localStorage.setItem('campusfix_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('campusfix_token', data.token);
    localStorage.setItem('campusfix_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const quickDemoLogin = async (role) => {
    let creds = { email: 'student@campusfix.edu', password: 'Student@123' };
    if (role === 'ADMIN') {
      creds = { email: 'admin@campusfix.edu', password: 'Admin@123' };
    } else if (role === 'STAFF') {
      creds = { email: 'staff@campusfix.edu', password: 'Staff@123' };
    }
    return login(creds.email, creds.password);
  };

  const register = async (userData) => {
    const data = await authApi.register(userData);
    localStorage.setItem('campusfix_token', data.token);
    localStorage.setItem('campusfix_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem('campusfix_token');
      localStorage.removeItem('campusfix_user');
      localStorage.removeItem('campusfix_selected_role');
      setToken(null);
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    return await authApi.forgotPassword(email);
  };

  const resetPassword = async (email, token, newPassword) => {
    const data = await authApi.resetPassword(email, token, newPassword);
    localStorage.setItem('campusfix_token', data.token);
    localStorage.setItem('campusfix_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signInWithGoogle,
        quickDemoLogin,
        register,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isStudent: user?.role === 'STUDENT',
        isStaff: user?.role === 'STAFF',
      }}
    >
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
