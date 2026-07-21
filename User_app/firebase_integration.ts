// firebase_integration.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

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

// 1. Initialize Firebase Modular SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 2. Initialize Firebase Compat SDK (Required for expo-firebase-recaptcha compatibility)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

export const registerUserFcmToken = async (userAuthToken: string, API_BASE_URL: string) => {
  try {
    // 1. Request notification permissions from user
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled) {
      // 2. Get FCM Device Token
      const fcmToken = await messaging().getToken();
      console.log("User FCM Token:", fcmToken);
      // 3. Register FCM token with backend
      const endpoint = API_BASE_URL.endsWith('/api')
        ? `${API_BASE_URL}/notification/user/fcm-token`
        : `${API_BASE_URL}/api/notification/user/fcm-token`;
      await axios.post(
        endpoint,
        { fcmToken },
        { headers: { Authorization: `Bearer ${userAuthToken}` } }
      );
    }
  } catch (error) {
    console.error("Failed to register FCM token:", error);
  }
};

