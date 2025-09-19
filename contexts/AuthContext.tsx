
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
import { doc, getDoc, setDoc, Timestamp, onSnapshot, query, collection, where, limit, getDocs, deleteDoc } from 'firebase/firestore';


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

          if (!userDoc.exists()) {
            const isPasswordProvider = firebaseUser.providerData.some(
              (provider) => provider.providerId === 'password'
            );

            if (!isPasswordProvider) {
              console.log("Creating new user profile for social login:", firebaseUser.uid);
              const userProfileData = {
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  username: firebaseUser.displayName?.replace(/\s+/g, '').toLowerCase() || firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.substring(0,6)}`,
                  tiktokUsername: '',
                  discordUsername: '',
                  role: 'Affiliate' as const,
                  status: 'Applied' as const, // Social signups are now 'Applied' for review
                  partnerTier: 'Standard' as const,
                  createdAt: Timestamp.now(),
                  onboardingStatus: 'needsToJoinCommunity' as const,
              };
              await setDoc(userDocRef, userProfileData);
              userDoc = await getDoc(userDocRef);
            }
          }

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data && data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
             if (data && data.lastContacted && data.lastContacted instanceof Timestamp) {
                data.lastContacted = data.lastContacted.toDate();
            }
            if (data && data.feedbackRequest && data.feedbackRequest.requestedAt instanceof Timestamp) {
                data.feedbackRequest.requestedAt = data.feedbackRequest.requestedAt.toDate();
            }
            if (data && data.feedbackRequest && data.feedbackRequest.expiresAt instanceof Timestamp) {
                data.feedbackRequest.expiresAt = data.feedbackRequest.expiresAt.toDate();
            }
            setUser({ uid: firebaseUser.uid, ...data } as AppUser);
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

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.status === 'Inactive' || data.status === 'Rejected' || data.status === 'Banned') { // Extended logout conditions
            console.warn(`User status is ${data.status}. Signing out.`);
            signOut(auth);
          }
           if (data && data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
             if (data && data.lastContacted && data.lastContacted instanceof Timestamp) {
                data.lastContacted = data.lastContacted.toDate();
            }
            if (data && data.feedbackRequest && data.feedbackRequest.requestedAt instanceof Timestamp) {
                data.feedbackRequest.requestedAt = data.feedbackRequest.requestedAt.toDate();
            }
            if (data && data.feedbackRequest && data.feedbackRequest.expiresAt instanceof Timestamp) {
                data.feedbackRequest.expiresAt = data.feedbackRequest.expiresAt.toDate();
            }
           setUser({ uid: user.uid, ...data } as AppUser);
        } else {
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
    // 1. Check if a prospect/pitched user already exists with this email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', details.email), limit(1));
    const existingUserSnapshot = await getDocs(q);
    const existingUserData = !existingUserSnapshot.empty ? { id: existingUserSnapshot.docs[0].id, ...existingUserSnapshot.docs[0].data() } : null;

    const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
    const firebaseUser = userCredential.user;
    if (!firebaseUser) throw new Error("Failed to create user account.");
    
    // 2. Prepare the new user profile
    let userProfileData = {
        email: details.email,
        displayName: details.displayName,
        username: details.username,
        tiktokUsername: details.tiktokUsername,
        discordUsername: details.discordUsername,
        role: 'Affiliate' as const,
        status: 'Applied' as const, // New registrations are 'Applied' for admin review
        partnerTier: 'Standard' as const,
        createdAt: Timestamp.now(),
        onboardingStatus: 'needsToJoinCommunity' as const,
        adminNotes: '',
    };
    
    // 3. If it was a pitched creator, merge their old notes
    if (existingUserData && (existingUserData.status === 'Pitched' || existingUserData.status === 'Prospect')) {
        console.log('Found existing prospect, converting to applicant...');
        userProfileData.adminNotes = existingUserData.adminNotes || `Converted from prospect on ${new Date().toLocaleDateString()}`;
        // Delete the old prospect document after creating the new one
        await deleteDoc(doc(db, 'users', existingUserData.id));
    }
    
    // 4. Create the definitive user document with the auth UID
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, userProfileData);

    const newUser: AppUser = {
        uid: firebaseUser.uid,
        ...userProfileData,
        createdAt: userProfileData.createdAt.toDate(),
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