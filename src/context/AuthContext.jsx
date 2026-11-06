import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { auth, googleProvider, db, signInWithPopup, signInWithRedirect, getRedirectResult, fbSignOut } from '../firebase';
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

  // Handle Redirect Result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const fbUser = result.user;
          const preferredRole = localStorage.getItem('campusfix_selected_role') || 'STUDENT';
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
             // Handle new user creation if needed
             await setDoc(userDocRef, {
               id: fbUser.uid,
               name: fbUser.displayName,
               email: fbUser.email,
               role: preferredRole,
               created_at: new Date().toISOString()
             });
          }
        }
      } catch (err) {
        console.error('Redirect result error:', err);
      }
    };
    handleRedirectResult();
  }, []);

  // Google Sign-In with Firebase Auth respecting selected portal role
  const signInWithGoogle = async (preferredRole = 'STUDENT') => {
    try {
      localStorage.setItem('campusfix_selected_role', preferredRole);
      await signInWithRedirect(auth, googleProvider);
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
    try {
      if (data?.user?.id || data?.user?.uid) {
        const userId = String(data.user.id || data.user.uid);
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, {
          ...data.user,
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore login sync notice:', e);
    }
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
    try {
      if (data?.user?.id) {
        const userDocRef = doc(db, 'users', String(data.user.id));
        await setDoc(userDocRef, {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          username: data.user.username || data.user.email.split('@')[0],
          role: data.user.role || 'STUDENT',
          department: data.user.department || 'General',
          phone: data.user.phone || '',
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore registration sync notice:', e);
    }
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
