// src/api/client.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/env';

import { DeviceEventEmitter } from 'react-native';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1000000,
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
  (error) => {
    console.error('API ERROR:', error?.response?.data || error.message);
    if (error?.response?.status === 401) {
      DeviceEventEmitter.emit('FORCE_LOGOUT');
    }
    return Promise.reject(error);
  }
);

export default api;
