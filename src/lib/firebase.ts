// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKofhni6U_izWTd7bdGayfW2gVG4tCsAc",
  authDomain: "skillfiesta.firebaseapp.com",
  projectId: "skillfiesta",
  storageBucket: "skillfiesta.firebasestorage.app",
  messagingSenderId: "294782662108",
  appId: "1:294782662108:web:5af404a22d68a637d04b19"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
