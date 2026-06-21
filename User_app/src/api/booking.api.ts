import apiClient from "./client";

const deduplicate = (bookings: any[]) => {
  if (!Array.isArray(bookings)) return [];
  const uniqueMap = new Map();
  for (const b of bookings) {
    if (b && b._id) {
      uniqueMap.set(String(b._id), b);
    }
  }
  return Array.from(uniqueMap.values());
};

export const BookingAPI = {
  async getUserBookings() {
    const res = await apiClient.get("/booking/history/user");
    return deduplicate(res.data.bookings);
  },

  async getActiveBookings() {
    const res = await apiClient.get("/booking/active/user");
    return deduplicate(res.data.bookings);
  },

  async getScheduledBookings() {
    const res = await apiClient.get("/booking/scheduled/user");
    return deduplicate(res.data.bookings);
  },
};



