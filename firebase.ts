import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

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

if (!isFirebaseConfigured) {
  console.warn("Firebase configuration is missing or incomplete. Some features will be disabled.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Transport fix: Force long-polling to work around restrictive networks.
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false
});

// Export the initialized services
export { app, auth, db };
export const FIREBASE_ENABLED = isFirebaseConfigured;
