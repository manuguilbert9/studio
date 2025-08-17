// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "skillfiesta",
  "appId": "1:294782662108:web:5af404a22d68a637d04b19",
  "storageBucket": "skillfiesta.firebasestorage.app",
  "apiKey": "AIzaSyDKofhni6U_izWTd7bdGayfW2gVG4tCsAc",
  "authDomain": "skillfiesta.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "294782662108"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
