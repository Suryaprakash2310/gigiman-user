import { BookingItem, BookingStatus } from "@/src/context/BookingContext";

function normalizeStatus(booking: any): BookingStatus {
  const status = booking.status?.toLowerCase();
  const assignment = booking.assignmentStatus?.toLowerCase();

  // 1. Check for Terminal Statuses
  if (status === "completed") return "completed";
  if (
    status === "cancelled" ||
    status === "cancalled" ||
    (status === "failed" && assignment !== "failed" && assignment !== "manual_assign")
  ) {
    return "cancelled";
  }

  // 2. Check for Manual Assign / Failed Assignment Statuses
  if (status === "manual_assign" || assignment === "manual_assign" || assignment === "failed") {
    return "manual_assign";
  }

  // 3. Check for Scheduled Status
  if (assignment === "scheduled" || status === "scheduled") return "scheduled";

  // 4. Check for Active / In-Progress Statuses
  if (status === "in_progress") return "in_progress";

  // 5. Check for Assigned / OTP Statuses
  // If assignment is "searching", we stay on searching screen
  if (assignment === "searching") return "searching";

  //if (status === "pending") return "otp";

  if (
    status === "otp" ||
    status === "accepted" ||
    status === "assigned" ||
    assignment === "assigned"
  ) {
    // If technician is assigned, we go to OTP
    // But if it is manually assigned and still in "assigned" status, we keep it as "assigned"
    if (booking.isManuallyAssigned && status === "assigned") {
      return "assigned";
    }
    return "otp";
  }

  // 6. Default to Searching
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
    booking.externalTechnicianName ||
    undefined;

  const techRating =
    booking.technician?.rating ||
    booking.primaryEmployee?.rating ||
    booking.rating ||
    undefined;

  const techReviews = 
    booking.technician?.reviews ||
    booking.reviews ||
    0;

  const techImage =
    booking.technician?.image ||
    booking.primaryEmployee?.image ||
    booking.image ||
    undefined;

  const price = booking.totalPrice ?? booking.cost ?? booking.amount;

  return {
    _id: booking._id,

    serviceCategoryName: booking.serviceCategoryName
      ? (Array.isArray(booking.serviceCategoryName)
        ? booking.serviceCategoryName.join(", ")
        : String(booking.serviceCategoryName))
      : booking.serviceCategory
      ? (Array.isArray(booking.serviceCategory)
        ? booking.serviceCategory.join(", ")
        : String(booking.serviceCategory))
      : "",
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
    reviews: techReviews,
    image: techImage,
    phone: booking.technician?.phoneNo || booking.primaryEmployee?.phoneNo || booking.primaryEmployee?.phoneno || booking.externalTechnicianPhone || undefined,
    eta: booking.eta || booking.location?.eta || undefined,
    cartItems: booking.cartItems || [],

    extraServices: booking.extraServices || [],

    isScheduled: booking.isScheduled,
    scheduleDateTime: booking.scheduledAt ?? booking.scheduleDateTime,
    durationInMinutes: booking.durationInMinutes,
    paymentStatus: booking.paymentStatus,
    assignmentStatus: booking.assignmentStatus ? String(booking.assignmentStatus).toUpperCase() : undefined,
    paymentType: booking.paymentType,
    advanceAmount: booking.advanceAmount,
    remainingAmount: booking.remainingAmount,
    rawStatus: booking.status,
    isManuallyAssigned: booking.isManuallyAssigned,
    domainService: typeof booking.domainService === "object" ? booking.domainService?._id : booking.domainService,
  };
}
