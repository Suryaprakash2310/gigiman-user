import api from './client';

export const completeProfileAPI = (data: {
  fullName: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
}) => {
  return api.post('/user/register', data);
};

export const sendOtpApi = (phoneNo: string) => {
  return api.post("/user/send-otp", { phoneNo });
};


export const verifyOtpApi = (phoneNo: string, firebaseToken: string) => {
  return api.post("/user/verify-otp", { phoneNo, firebaseToken });
};

export const verifyFirebaseTokenAPI = (token: string) => {
  return api.post("/user/verify-firebase-token", { idToken: token });
};


export const getAddressesAPI = () => {
  return api.get("/user/address");
};

export const addAddressAPI = (data: {
  title: string
  address: string
  latitude?: number
  longitude?: number
}) => {
  return api.post("/user/address", data);
};

export const deleteAddressAPI = (addressId: string) => {
  return api.delete(`/user/address/${addressId}`);
};

export const updateAddressAPI = (addressId: string, data: any) => {
  return api.put(`/user/address/${addressId}`, data);
};



