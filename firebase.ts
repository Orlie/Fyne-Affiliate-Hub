

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: These environment variables must be configured in your deployment environment (e.g., Netlify).
// They are not available in the code directly but are substituted during the build/runtime process.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// A check to ensure Firebase is configured before initialization
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: firebase.app.App | null = null;

if (isFirebaseConfigured) {
    if (firebase.apps.length === 0) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
} else {
    console.warn("Firebase configuration is missing or incomplete. Please set up your environment variables. Some features will be disabled.");
}

// Export Firebase services, which will be null if configuration is missing
// The v9 modular services can be retrieved using the compat app instance.
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Export a flag to check if Firebase is enabled throughout the app
export const FIREBASE_ENABLED = isFirebaseConfigured && !!app;
