import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

// Your verified Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcGk0qNWVAXkJRhkyIHzaG27vyMaIFNWY",
  authDomain: "pocketcourt.firebaseapp.com",
  databaseURL: "https://pocketcourt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pocketcourt",
  storageBucket: "pocketcourt.firebasestorage.app",
  messagingSenderId: "580375244629",
  appId: "1:580375244629:web:b516f562ddb1cc037089dc",
  measurementId: "G-50FWBRZF40"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = null; // 100% Free: Proof is handled directly via Realtime Database

export async function ensureSignedIn() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser;
}
