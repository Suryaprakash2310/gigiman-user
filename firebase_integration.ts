// firebase_integration.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// These values are required for the Firebase JS SDK to work in Expo
// IMPORTANT: Copy these from your Firebase Console (Web App settings)
const firebaseConfig = {
  apiKey: "AIzaSyAj9D6Yi0Y0_eMA1bQ-E4IQSObJlqSVGq8",
  authDomain: "gigiman-serviers.firebaseapp.com",
  projectId: "gigiman-serviers",
  storageBucket: "gigiman-serviers.firebasestorage.app",
  messagingSenderId: "909756007187",
  appId: "1:909756007187:web:8628d9ee17dd62136e10e6",
  measurementId: "G-Y0ZR2TG395"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
