import { BookingItem, BookingStatus } from "@/src/context/BookingContext";

function normalizeStatus(booking: any): BookingStatus {
  const backendStatus = booking.status?.toLowerCase();

  switch (backendStatus) {
    case "pending":
      // Provider accepted → OTP stage
      return "otp";

    case "in_progress":
      return "in_progress";

    case "completed":
      return "completed";

    case "cancelled":
    case "cancalled":
      return "cancelled";

    default:
      // Before acceptance
      return "searching";
  }
}

export function mapBookingToBookingItem(
  booking: any,
  otp?: number
): BookingItem {
  if (!booking || !booking._id) {
    throw new Error("Invalid booking object received in mapper");
  }

  const normalizedStatus = normalizeStatus(booking);

  return {
    _id: booking._id,
    serviceCategoryName: booking.serviceCategoryName,
    totalPrice: booking.totalPrice,
    address: booking.address,

    status: normalizedStatus,

    isScheduled: booking.bookingType === "scheduled" || booking.isScheduled,
    otp: otp ?? booking.StartWorkOTP,
    scheduleDateTime:
      booking.scheduleDateTime ||
      booking.scheduledAt ||
      null,

    technicianName: booking.primaryEmployee?.fullname,
    technicianPhone: booking.primaryEmployee?.phoneNo,
    technicianRating: booking.primaryEmployee?.rating,
  };
}