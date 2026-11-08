import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Fetch additional profile info from Firestore
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          let userData = userDoc.exists() ? userDoc.data() : null;

          if (!userData) {
            // Fallback for new users or if doc doesn't exist
            const email = fbUser.email || '';
            const role = email.includes('admin') ? 'ADMIN' : (email.includes('staff') ? 'STAFF' : 'STUDENT');
            const dept = role === 'ADMIN' ? 'Campus Operations' : (role === 'STAFF' ? 'Maintenance' : 'Student');
            
            userData = {
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || email.split('@')[0],
              role,
              department: dept,
              photoURL: fbUser.photoURL,
              createdAt: serverTimestamp(),
            };
            // Create user doc if it doesn't exist
            await setDoc(doc(db, 'users', fbUser.uid), userData);
          }

          setUser({
            ...userData,
            id: fbUser.uid, // ensure consistency
            uid: fbUser.uid,
          });
        } catch (err) {
          console.error('[AuthContext] Profile sync error:', err);
          // Still set basic user info from FB Auth
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName,
            role: 'STUDENT', // default fallback
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (preferredRole = 'STUDENT') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const email = fbUser.email.toLowerCase();
      let role = preferredRole;
      if (email.includes('admin')) role = 'ADMIN';
      else if (email.includes('staff')) role = 'STAFF';

      const department = role === 'ADMIN' ? 'Campus Operations' : (role === 'STAFF' ? 'Maintenance' : 'Student');

      const userData = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName,
        role,
        department,
        photoURL: fbUser.photoURL,
        lastLogin: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', fbUser.uid), userData, { merge: true });
      
      // The onAuthStateChanged listener will handle setting the state
      return fbUser;
    } catch (error) {
      console.error('[AuthContext] Google Sign-In error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
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

