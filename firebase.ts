// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// FIX: Changed import path from 'firebase/auth' to '@firebase/auth' to resolve missing export members.
import { getAuth } from "@firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBVtZFT-rqFJbZj0goU07wgAweuSDc5fgI",
  authDomain: "fyne-affiliate-hub.firebaseapp.com",
  projectId: "fyne-affiliate-hub",
  storageBucket: "fyne-affiliate-hub.firebasestorage.app",
  messagingSenderId: "468746870595",
  appId: "1:468746870595:web:cd53c29e2b0b10e5dbd9f6",
  measurementId: "G-7287356S0G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// FIX: Removed Firebase Analytics initialization. The getAnalytics function was causing an import error,
// and the 'analytics' feature was not being used within the application.
export const auth = getAuth(app);
export const db = getFirestore(app);