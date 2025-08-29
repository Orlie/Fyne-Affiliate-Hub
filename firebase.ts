import { initializeApp, SDK_VERSION } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVtZFT-rqFJbZj0goU07wgAweuSDc5fgI",
  authDomain: "fyne-affiliate-hub.firebaseapp.com",
  projectId: "fyne-affiliate-hub",
  storageBucket: "fyne-affiliate-hub.appspot.com",
  messagingSenderId: "468746870595",
  appId: "1:468746870595:web:cd53c29e2b0b10e5dbd9f6",
  measurementId: "G-7287356S0G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth();

// Prefer fetch streaming: avoids /Listen/channel entirely.
export const db = initializeFirestore(app, {
  useFetchStreams: true,
  experimentalAutoDetectLongPolling: false
});

// Runtime guard: fail fast if a wrong SDK is in the bundle.
if (SDK_VERSION.startsWith("11.") || SDK_VERSION.startsWith("12.")) {
  throw new Error(`Wrong Firebase SDK version loaded: ${SDK_VERSION}. Expected 10.12.2`);
}
console.log("Firebase SDK", SDK_VERSION);


// Fallback (use only if your network blocks fetch streaming):
// export const db = initializeFirestore(app, {
//   experimentalForceLongPolling: true,
//   useFetchStreams: false
// });