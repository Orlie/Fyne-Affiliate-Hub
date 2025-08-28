import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
// FIX: Use v8 compat firebase instances and types
import { auth, db, FIREBASE_ENABLED, firebase } from '../firebase';


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

    // FIX: Use v8 onAuthStateChanged syntax
    // FIX: Correctly type the firebase user object using `firebase.User`.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: firebase.User | null) => {
      if (firebaseUser && db) {
        try {
          // FIX: Use v8 firestore syntax
          const userDocRef = db.collection('users').doc(firebaseUser.uid);
          const userDoc = await userDocRef.get();
          if (userDoc.exists) {
            const data = userDoc.data();
            // Convert Firestore Timestamp to JS Date
            // FIX: Use v8 Timestamp type
            if (data && data.createdAt && data.createdAt instanceof firebase.firestore.Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
            setUser({ uid: firebaseUser.uid, ...data } as User);
          } else {
            console.error("User document not found in Firestore for UID:", firebaseUser.uid);
            setUser(null);
            // FIX: Use v8 signOut syntax
            await auth.signOut(); // Sign out if profile doesn't exist
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
    // FIX: Use v8 signInWithEmailAndPassword syntax
    await auth.signInWithEmailAndPassword(email, password);
  };

  const logout = async () => {
    if (!FIREBASE_ENABLED || !auth) return;
    // FIX: Use v8 signOut syntax
    await auth.signOut();
  };
  
  const updateProfile = async (data: Partial<User>) => {
    if (user && db) {
      // FIX: Use v8 firestore syntax
      const userDocRef = db.collection('users').doc(user.uid);
      await userDocRef.set(data, { merge: true });
      setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
    } else {
       console.error("Cannot update profile. User not logged in or DB not available.");
    }
  }

  const register = async (details: { displayName: string; username: string; email: string; tiktokUsername: string; discordUsername: string; }, password: string) => {
    if (!FIREBASE_ENABLED || !auth || !db) throw new Error("Firebase not configured.");
    
    // FIX: Use v8 createUserWithEmailAndPassword syntax
    const userCredential = await auth.createUserWithEmailAndPassword(details.email, password);
    const firebaseUser = userCredential.user;

    if (!firebaseUser) {
        throw new Error("Failed to create user.");
    }

    const userProfileData = {
        email: details.email,
        displayName: details.displayName,
        username: details.username,
        tiktokUsername: details.tiktokUsername,
        discordUsername: details.discordUsername,
        role: 'Affiliate' as const,
        status: 'Verified' as const,
        // FIX: Use v8 Timestamp syntax
        createdAt: firebase.firestore.Timestamp.now(),
    };

    // FIX: Use v8 firestore syntax
    await db.collection('users').doc(firebaseUser.uid).set(userProfileData);
    // onAuthStateChanged will automatically handle setting the new user state
  };
  
  const changePassword = async (newPassword: string) => {
    // FIX: Use imported auth instance from firebase.ts
    const currentUser = auth.currentUser;
    if (!FIREBASE_ENABLED || !currentUser) throw new Error("User not authenticated.");
    // FIX: Use v8 updatePassword syntax
    await currentUser.updatePassword(newPassword);
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
