
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { auth, db, FIREBASE_ENABLED } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!FIREBASE_ENABLED || !auth) {
      console.warn("Firebase is not configured. App is in offline mode.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && db) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            console.error("User document not found in Firestore for UID:", firebaseUser.uid);
            setUser(null);
            await signOut(auth); // Sign out if profile doesn't exist
          }
        } catch (error) {
           console.error("Error fetching user profile:", error);
           setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!FIREBASE_ENABLED || !auth) throw new Error("Firebase not configured.");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!FIREBASE_ENABLED || !auth) return;
    await signOut(auth);
  };
  
  const updateProfile = async (data: Partial<User>) => {
    if (user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, data, { merge: true });
      setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
    } else {
       console.error("Cannot update profile. User not logged in or DB not available.");
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};