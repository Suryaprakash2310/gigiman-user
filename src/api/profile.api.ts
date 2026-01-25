
import { api } from './client';

export const completeProfileAPI = (payload: {
  fullName: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
}) => api.post('/user/complete-profile', payload);

export const getProfileAPI = () =>
  api.get('/user/profile');

export const updateProfile = (data: {
  fullName?: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
}) => {
  return api.put('/user/edit-profile', data);
};
