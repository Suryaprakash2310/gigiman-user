// src/api/client.ts
import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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
    return Promise.reject(error);
  }
);

export default api;
