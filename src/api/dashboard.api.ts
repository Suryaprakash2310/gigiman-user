import api from "./client";


export const getPopularServices = async () => {
  const res = await api.get("booking/popularbookings?days=30");
  return res.data.popularServices;
};

export const getBanners = async () => {
  const res = await api.get("banners");
  return res.data.banners;
};