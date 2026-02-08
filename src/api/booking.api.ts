import apiClient from "./client";

export const BookingAPI = {
  async getUserBookings() {
    const res = await apiClient.get("/booking/history/user");
    return res.data.bookings;
  },
};



