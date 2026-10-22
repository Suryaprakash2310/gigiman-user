import apiClient from "./client";

export interface AvailableCoupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  maxDiscount?: number | null;
  minOrderValue?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number;
}

export const CouponAPI = {
  async getAvailableCoupons(): Promise<{ success: boolean; coupons: AvailableCoupon[] }> {
    const res = await apiClient.get("/coupon/available");
    return res.data;
  },

  async validateCoupon(code: string, cartTotal: number, userId?: string) {
    const res = await apiClient.post("/coupon/validate", {
      code,
      cartTotal,
      userId,
    });
    return res.data;
  },
};
