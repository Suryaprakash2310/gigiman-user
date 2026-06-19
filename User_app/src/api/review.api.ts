import api from "./client";

export const submitReviewApi = (data: {
  bookingId: string;
  rating: number;
  comment?: string;
}) => {
  return api.post(`/booking/review/${data.bookingId}`, data);
};
