import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { auth, db, FIREBASE_ENABLED } from '../firebase';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword, User as FirebaseUser, getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  register: (details: { displayName: string; username: string; email: string; tiktokUsername: string; discordUsername: string; }, password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
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
            const data = userDoc.data();
            // Convert Firestore Timestamp to JS Date
            if (data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
            setUser({ uid: firebaseUser.uid, ...data } as User);
          } else {
            console.error("User document not found in Firestore for UID:", firebaseUser.uid);
            setUser(null);
            await signOut(auth); // Sign out if profile doesn't exist
          }
        } catch (error: any) {
           console.error(`Error fetching user profile: ${error.code} - ${error.message}`);
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

  const register = async (details: { displayName: string; username: string; email: string; tiktokUsername: string; discordUsername: string; }, password: string) => {
    if (!FIREBASE_ENABLED || !auth || !db) throw new Error("Firebase not configured.");
    
    const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
    const firebaseUser = userCredential.user;

    const userProfileData = {
        email: details.email,
        displayName: details.displayName,
        username: details.username,
        tiktokUsername: details.tiktokUsername,
        discordUsername: details.discordUsername,
        role: 'Affiliate' as const,
        status: 'Verified' as const,
        createdAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userProfileData);
    // onAuthStateChanged will automatically handle setting the new user state
  };
  
  const changePassword = async (newPassword: string) => {
    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;
    if (!FIREBASE_ENABLED || !currentUser) throw new Error("User not authenticated.");
    await updatePassword(currentUser, newPassword);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, register, changePassword }}>
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