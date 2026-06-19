import apiClient from "./client";

export const CouponAPI = {
  async validateCoupon(code: string, cartTotal: number) {
    const res = await apiClient.post("/coupon/validate", {
      code,
      cartTotal,
    });
    return res.data;
  },
};
