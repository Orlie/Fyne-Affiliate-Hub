import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVtZFT-rqFJbZj0goU07wgAweuSDc5fgI",
  authDomain: "fyne-affiliate-hub.firebaseapp.com",
  projectId: "fyne-affiliate-hub",
  storageBucket: "fyne-affiliate-hub.firebasestorage.app",
  messagingSenderId: "468746870595",
  appId: "1:468746870595:web:cd53c29e2b0b10e5dbd9f6",
  measurementId: "G-7287356S0G"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Prefer Fetch streaming (no WebChannel). If it fails, use the fallback below.
export const db = initializeFirestore(app, {
  useFetchStreams: true,
  experimentalAutoDetectLongPolling: false
});

// Fallback if still failing:
// export const db = initializeFirestore(app, {
//   experimentalForceLongPolling: true,
//   useFetchStreams: false
// });
