// Fix: Use the Firebase compat library for app initialization to resolve module errors.
// The v9 modular SDK functions used in the rest of the app are compatible with the app instance created here.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

let app;
let auth;
let db;

if (isFirebaseConfigured) {
  // This prevents re-initializing the app on hot reloads in development
  // Use v8 compat API for app management
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
  // The app object is compatible with v9 modular functions
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn("Firebase configuration is missing or incomplete. Some features will be disabled.");
}

export { auth, db };
export const FIREBASE_ENABLED = isFirebaseConfigured;
