// FIX: Add type augmentations for firebase auth and firestore services.
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// The global 'firebase' object is now loaded from index.html via script tags.
// This file initializes the services from that global object.
declare var firebase: any; // Inform TypeScript that 'firebase' is a global variable.

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

let auth: any;
let db: any;

if (isFirebaseConfigured) {
  // This prevents re-initializing the app on hot reloads in development
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  // Get the auth and firestore instances using standard v8 syntax from the global object
  auth = firebase.auth();
  db = firebase.firestore();
} else {
  console.warn("Firebase configuration is missing or incomplete. Some features will be disabled.");
}

// Export the initialized services and the firebase namespace for accessing types like Timestamp
export { auth, db, firebase };
export const FIREBASE_ENABLED = isFirebaseConfigured;
