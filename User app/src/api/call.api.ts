import api from "@/src/api/client";

/**
 * Initiate a masked call between the user and the technician
 * @param bookingId The ID of the booking
 * @returns Promise with API response
 */
export const initiateMaskedCall = (bookingId: string) => {
  return api.post(`/booking/mask-call/${bookingId}`);
};
