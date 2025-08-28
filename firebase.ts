// FIX: Changed to use the firebase/compat library to resolve import errors with older firebase versions
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration is now hardcoded for reliability
const firebaseConfig = {
  apiKey: "AIzaSyBVtZFT-rqFJbZj0goU07wgAweuSDc5fgI",
  authDomain: "fyne-affiliate-hub.firebaseapp.com",
  projectId: "fyne-affiliate-hub",
  storageBucket: "fyne-affiliate-hub.appspot.com",
  messagingSenderId: "468746870595",
  appId: "1:468746870595:web:cd53c29e2b0b10e5dbd9f6",
  measurementId: "G-7287356S0G"
};

const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

// Initialize Firebase using compat syntax, which is robust to version mismatches.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get the app instance and then get the v9 services, which are compatible.
const app = firebase.app();
const auth = getAuth(app);
const db = getFirestore(app);

if (!isFirebaseConfigured) {
  console.warn("Firebase configuration is missing or incomplete. Some features will be disabled.");
}

// Export the initialized services
export { app, auth, db };
export const FIREBASE_ENABLED = isFirebaseConfigured;
