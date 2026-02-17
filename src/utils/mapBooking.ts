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

  // Handle technician data from both response shapes:
  // 1. Backend getBookingById: booking.name (company/employee name)
  // 2. Socket "servicer-accepted": booking.primaryEmployee.fullname
  // 3. GET /booking/:id API: booking.technician.name
  const techName =
    booking.name ||
    booking.technician?.name ||
    booking.primaryEmployee?.fullname ||
    undefined;

  const techRating =
    booking.technician?.rating ||
    booking.primaryEmployee?.rating ||
    booking.rating ||
    undefined;

  const price = booking.totalPrice ?? booking.cost ?? booking.amount;

  return {
    _id: booking._id,

    serviceCategoryName: booking.serviceCategoryName,
    totalPrice: price,

    dateLabel: booking.scheduleDateTime
      ? new Date(booking.scheduleDateTime).toLocaleDateString()
      : booking.dateLabel || "",

    timeLabel: booking.scheduleDateTime
      ? new Date(booking.scheduleDateTime).toLocaleTimeString()
      : booking.timeLabel || "",

    address: booking.address,

    status: booking.status,

    otp: otp ?? booking.StartWorkOTP ?? booking.otp,

    name: techName,
    rating: techRating,

    isScheduled: booking.isScheduled,
    scheduleDateTime: booking.scheduledAt ?? booking.scheduleDateTime,
  };
}
