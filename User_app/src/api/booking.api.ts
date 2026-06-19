import apiClient from "./client";

export const BookingAPI = {
  async getUserBookings() {
    const res = await apiClient.get("/booking/history/user");
    return res.data.bookings;
  },

  async getActiveBookings() {
    const res = await apiClient.get("/booking/active/user");
    return res.data.bookings;
  },

  async getScheduledBookings() {
    const res = await apiClient.get("/booking/scheduled/user");
    return res.data.bookings;
  },
};



