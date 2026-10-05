import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { auth, googleProvider, db, signInWithPopup, fbSignOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('campusfix_token'));
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Auth state
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          let profile;
          if (userSnap.exists()) {
            profile = userSnap.data();
            const savedPortalRole = localStorage.getItem('campusfix_selected_role');
            if (savedPortalRole && profile.role !== savedPortalRole) {
              profile.role = savedPortalRole;
              await setDoc(userDocRef, { ...profile, role: savedPortalRole }, { merge: true });
            }
          } else {
            const savedPortalRole = localStorage.getItem('campusfix_selected_role') || 'STUDENT';
            profile = {
              id: fbUser.uid,
              uid: fbUser.uid,
              name: fbUser.displayName || 'Campus Member',
              email: fbUser.email,
              role: savedPortalRole,
              department:
                savedPortalRole === 'ADMIN'
                  ? 'Campus Administration'
                  : savedPortalRole === 'STAFF'
                  ? 'Maintenance & Facilities'
                  : 'Student Department',
              phone: fbUser.phoneNumber || '+91 98401 23456',
              photoURL: fbUser.photoURL,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, profile);
          }

          if (isMounted) {
            setUser(profile);
            const fbToken = `fb-${fbUser.uid}`;
            setToken(fbToken);
            localStorage.setItem('campusfix_token', fbToken);
            localStorage.setItem('campusfix_user', JSON.stringify(profile));
          }
        } catch (err) {
          console.error('Error fetching Firestore user profile:', err);
        }
      } else {
        // Fallback to local session check if not logged into Firebase Google
        const storedToken = localStorage.getItem('campusfix_token');
        if (storedToken && !storedToken.startsWith('fb-')) {
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
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Google Sign-In with Firebase Auth respecting selected portal role
  const signInWithGoogle = async (preferredRole = 'STUDENT') => {
    try {
      localStorage.setItem('campusfix_selected_role', preferredRole);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      let profile;
      if (userSnap.exists()) {
        profile = userSnap.data();
        profile.role = preferredRole;
        await setDoc(userDocRef, { ...profile, role: preferredRole }, { merge: true });
      } else {
        profile = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: fbUser.displayName || 'Campus Member',
          email: fbUser.email,
          role: preferredRole,
          department:
            preferredRole === 'ADMIN'
              ? 'Campus Administration'
              : preferredRole === 'STAFF'
              ? 'Maintenance & Facilities'
              : 'Student Department',
          phone: fbUser.phoneNumber || '+91 98401 23456',
          photoURL: fbUser.photoURL,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profile);
      }

      const sessionToken = `fb-${fbUser.uid}`;
      localStorage.setItem('campusfix_token', sessionToken);
      localStorage.setItem('campusfix_user', JSON.stringify(profile));
      setToken(sessionToken);
      setUser(profile);
      return profile;
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
      await fbSignOut(auth);
      if (token && !token.startsWith('fb-')) {
        await authApi.logout();
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('campusfix_token');
      localStorage.removeItem('campusfix_user');
      localStorage.removeItem('campusfix_selected_role');
      setToken(null);
      setUser(null);
    }
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
