
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
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from '@firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';


interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<AppUser>) => Promise<void>;
  register: (details: { displayName: string; username: string; email: string; tiktokUsername: string; discordUsername: string; }, password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
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
          let userDoc = await getDoc(userDocRef);

          // FIX: This block now checks the provider to avoid a race condition with the register function.
          // It will only auto-create a profile for social media sign-ups.
          if (!userDoc.exists()) {
            const isPasswordProvider = firebaseUser.providerData.some(
              (provider) => provider.providerId === 'password'
            );

            if (!isPasswordProvider) {
              // User signed up with a social provider for the first time
              console.log("Creating new user profile for social login:", firebaseUser.uid);
              const userProfileData = {
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  username: firebaseUser.displayName?.replace(/\s+/g, '').toLowerCase() || firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.substring(0,6)}`,
                  tiktokUsername: '',
                  discordUsername: '',
                  role: 'Affiliate' as const,
                  status: 'Verified' as const,
                  createdAt: Timestamp.now(),
                  onboardingStatus: 'needsToJoinCommunity' as const,
              };
              await setDoc(userDocRef, userProfileData);
              userDoc = await getDoc(userDocRef); // Re-fetch the doc to continue
            }
          }

          if (userDoc.exists()) {
            const data = userDoc.data();
            // Convert Firestore Timestamps to JS Dates
            if (data && data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
            if (data && data.feedbackRequest && data.feedbackRequest.requestedAt instanceof Timestamp) {
                data.feedbackRequest.requestedAt = data.feedbackRequest.requestedAt.toDate();
            }
            if (data && data.feedbackRequest && data.feedbackRequest.expiresAt instanceof Timestamp) {
                data.feedbackRequest.expiresAt = data.feedbackRequest.expiresAt.toDate();
            }
            setUser({ uid: firebaseUser.uid, ...data } as AppUser);
          }
          // FIX: Removed the aggressive 'else' block that was signing out new email users during the registration race condition.

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

  // Real-time listener for user status changes (e.g., being banned)
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          // FIX: Removed incorrect type assertion `as AppUser` from `doc.data()` to resolve type error. The `data` from Firestore should be treated as `DocumentData` before converting its `Timestamp` fields to `Date` objects and casting to the final `AppUser` type.
          const data = doc.data();
          // If user status is updated to 'Banned', log them out
          if (data.status === 'Banned') {
            console.warn("User has been banned. Signing out.");
            signOut(auth);
          }
           // Keep local user state in sync with database
           if (data && data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
            if (data && data.feedbackRequest && data.feedbackRequest.requestedAt instanceof Timestamp) {
                data.feedbackRequest.requestedAt = data.feedbackRequest.requestedAt.toDate();
            }
            if (data && data.feedbackRequest && data.feedbackRequest.expiresAt instanceof Timestamp) {
                data.feedbackRequest.expiresAt = data.feedbackRequest.expiresAt.toDate();
            }
           setUser({ uid: user.uid, ...data } as AppUser);
        } else {
            // Document deleted, log user out
            signOut(auth);
        }
      });

      return () => unsubscribe();
    }
  }, [user?.uid]);


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
        onboardingStatus: 'needsToJoinCommunity' as const,
    };

    await setDoc(userDocRef, userProfileData);

    // FIX: Manually set the user state immediately after creating the profile
    // to prevent a race condition with the onAuthStateChanged listener.
    // The listener will still run but will find the document exists and harmlessly set the same state.
    const newUser: AppUser = {
        uid: firebaseUser.uid,
        email: userProfileData.email,
        displayName: userProfileData.displayName,
        username: userProfileData.username,
        tiktokUsername: userProfileData.tiktokUsername,
        discordUsername: userProfileData.discordUsername,
        role: userProfileData.role,
        status: userProfileData.status,
        createdAt: userProfileData.createdAt.toDate(), // Convert timestamp to Date
        onboardingStatus: userProfileData.onboardingStatus,
    };
    setUser(newUser);
  };
  
  const changePassword = async (newPassword: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    await updatePassword(currentUser, newPassword);
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithApple = async () => {
    const provider = new OAuthProvider('apple.com');
    await signInWithPopup(auth, provider);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, register, changePassword, signInWithGoogle, signInWithApple }}>
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
