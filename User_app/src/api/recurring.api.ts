import apiClient from "./client";

export const RecurringAPI = {
  // Create a new recurring plan
  async createPlan(planData: any) {
    const res = await apiClient.post("/recurring", planData);
    return res.data;
  },

  // Fetch all recurring plans of the current user
  async getPlans() {
    const res = await apiClient.get("/recurring");
    return res.data.data;
  },

  // Fetch a specific plan by ID
  async getPlanById(planId: string) {
    const res = await apiClient.get(`/recurring/${planId}`);
    return res.data.data;
  },

  // Update a recurring plan (e.g. reschedule)
  async updatePlan(planId: string, planData: any) {
    const res = await apiClient.put(`/recurring/${planId}`, planData);
    return res.data;
  },

  // Pause / Resume a recurring plan
  async togglePausePlan(planId: string) {
    const res = await apiClient.post(`/recurring/${planId}/pause`);
    return res.data;
  },

  // Cancel a recurring plan
  async cancelPlan(planId: string) {
    const res = await apiClient.post(`/recurring/${planId}/cancel`);
    return res.data;
  },

  // Skip the next scheduled visit
  async skipNextVisit(planId: string) {
    const res = await apiClient.post(`/recurring/${planId}/skip`);
    return res.data;
  },

  // Initiate Razorpay mandate/subscription payment
  async initiatePayment(planId: string) {
    const res = await apiClient.post(`/recurring/${planId}/initiate-payment`);
    return res.data;
  },

  // Verify payment signatures (mandates or subscription setups)
  async verifyPayment(planId: string, verificationData: {
    razorpayOrderId?: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    razorpaySubscriptionId?: string;
  }) {
    const res = await apiClient.post(`/recurring/${planId}/verify-payment`, verificationData);
    return res.data;
  }
};
