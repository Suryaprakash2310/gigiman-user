// firebase_integration.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// These values are required for the Firebase JS SDK to work in Expo
// IMPORTANT: Copy these from your Firebase Console (Web App settings)
const firebaseConfig = {
  apiKey: "AIzaSyBinxX6SohboBjea3jH__3dNXWHK4jQ8xQ", // Found in your config
  authDomain: "gigiman-dd267.firebaseapp.com",       // Project ID based
  projectId: "gigiman-dd267", 
  storageBucket: "gigiman-dd267.appspot.com",
  messagingSenderId: "102044038719378645139",         // Likely messaging sender ID
  appId: "1:102044038719378645139:web:???",           // Replace with your Web App ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
