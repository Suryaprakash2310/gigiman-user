import { BookingItem, BookingStatus } from "@/src/context/BookingContext";

function normalizeStatus(booking: any): BookingStatus {
  const status = booking.status?.toLowerCase();
  const assignment = booking.assignmentStatus?.toLowerCase();

  // 1. Check for Terminal Statuses
  if (status === "completed") return "completed";
  if (status === "cancelled" || status === "cancalled" || status === "failed") return "cancelled";

  // 2. Check for Scheduled Status
  if (assignment === "scheduled" || status === "scheduled") return "scheduled";

  // 3. Check for Active / In-Progress Statuses
  if (status === "in_progress") return "in_progress";

  // 4. Check for Assigned / OTP Statuses
  // If assignment is "searching", we stay on searching screen
  if (assignment === "searching") return "searching";

  if (
    status === "otp" ||
    status === "accepted" ||
    status === "assigned" ||
    assignment === "assigned"
  ) {
    // If technician is assigned, we go to OTP
    return "otp";
  }

  // 5. Default to Searching
  return "searching";
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

    status: normalizeStatus(booking),

    otp: otp ?? booking.StartWorkOTP ?? booking.otp,

    name: techName,
    rating: techRating,

    isScheduled: booking.isScheduled,
    scheduleDateTime: booking.scheduledAt ?? booking.scheduleDateTime,
  };
}
