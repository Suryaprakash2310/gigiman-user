import api from "./client";

export const BannerAPI = {
  getBanners: async () => {
    const res = await api.get("/banners");
    return res.data?.banners || [];
  },
};