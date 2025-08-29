import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User as AppUser } from '../types';
import { auth, db } from '../firebase';
// FIX: Changed import path from 'firebase/auth' to '@firebase/auth' to resolve missing export members.
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  updatePassword,
  User as FirebaseUser
} from '@firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';


interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<AppUser>) => Promise<void>;
  register: (details: { displayName: string; username: string; email: string; tiktokUsername: string; discordUsername: string; }, password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Convert Firestore Timestamp to JS Date
            if (data && data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
            setUser({ uid: firebaseUser.uid, ...data } as AppUser);
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const updateProfile = async (data: Partial<AppUser>) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, data, { merge: true });
      setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
    } else {
       console.error("Cannot update profile. User not logged in or DB not available.");
    }
  }

  const register = async (details: { displayName: string; username: string; email: string; tiktokUsername: string; discordUsername: string; }, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
    const firebaseUser = userCredential.user;

    if (!firebaseUser) {
        throw new Error("Failed to create user account.");
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
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

    await setDoc(userDocRef, userProfileData);

    // Confirm via one-shot read to ensure profile write succeeded.
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      // If the write fails, the user is in a bad state (auth created, but no profile).
      // We should sign them out and ask them to try again.
      await signOut(auth);
      throw new Error("Profile write failed after user creation. Your account was not fully created. Please try signing up again.");
    }
    // onAuthStateChanged will automatically handle setting the new user state
  };
  
  const changePassword = async (newPassword: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
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