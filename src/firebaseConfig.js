import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAuth, getReactNativePersistence, signInAnonymously, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);

let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const storage = null; // 100% Free: Proof is handled directly via Realtime Database

export async function ensureSignedIn() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    return auth.currentUser;
  } catch (err) {
    // If Anonymous Sign-In is restricted in Firebase Console, persist a stable device UID
    console.warn("Firebase Auth fallback to persistent device session:", err.message);
    let deviceUid = await AsyncStorage.getItem("pocketcourt_device_uid");
    if (!deviceUid) {
      deviceUid = "usr_" + Math.random().toString(36).substring(2, 10);
      await AsyncStorage.setItem("pocketcourt_device_uid", deviceUid);
    }
    return {
      uid: deviceUid,
      isAnonymous: true
    };
  }
}
