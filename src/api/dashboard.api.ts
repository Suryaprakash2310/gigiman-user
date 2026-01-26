import api from "./client";


export const getPopularServices = async () => {
  const res = await api.get("booking/popularbookings?days=30");
  return res.data.popularServices;
};