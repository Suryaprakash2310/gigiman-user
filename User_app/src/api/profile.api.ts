
import { api } from './client';

export interface UserProfile {
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phoneNo?: string;
  avatar?: string | null;
}

export const completeProfileAPI = (payload: {
  fullName: string;
  latitude?: number;
  longitude?: number;
  phoneNo?: string;
  email?: string;
  avatar?: string | null;
}) => api.post('/user/complete-profile', payload);

export const ProfileAPI = {
  getProfileAPI: async (): Promise<{ success: boolean; user?: UserProfile }> => {
    const res = await api.get("/user/profile");
    console.log(res.data);

    return res.data; // { success, user }
  },
};

export const updateProfile = (data: {
  fullName?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  avatar?: string | null;
}) => {
  console.log(data);
  return api.put('/user/edit-profile', data);
};
