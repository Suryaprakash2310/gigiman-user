// src/api/client.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/env';

import { DeviceEventEmitter } from 'react-native';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('gg_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    //console.error('API ERROR:', error?.response?.data || error.message);
    if (error?.response?.status === 401) {
      // ⛔ Only emit FORCE_LOGOUT when the user was already fully verified.
      // A new user receives a tempToken before completing their profile.
      // If we emit FORCE_LOGOUT for their 401s, they get sent back to the
      // onboarding slider instead of staying on the profile completion screen.
      try {
        const savedUser = await AsyncStorage.getItem('gg_user');
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        if (parsedUser?.isVerified) {
          DeviceEventEmitter.emit('FORCE_LOGOUT');
        }
      } catch {
        // If we can't read the stored user, don't force logout.
      }
    }
    return Promise.reject(error);
  }
);

export default api;
