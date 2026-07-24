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
  otp?: number | string
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

  const rawPrice = booking.totalPrice ?? booking.cost ?? booking.amount;
  const totalPrice = rawPrice != null ? Number(rawPrice) : 0;

  const rawCartItems = Array.isArray(booking.cartItems)
    ? booking.cartItems.map((item: any) => {
        if (!item) return null;
        const catName =
          item.serviceCategoryName ||
          item.serviceName ||
          item.name ||
          (typeof item.serviceCategoryId === "object"
            ? item.serviceCategoryId?.serviceCategoryName || item.serviceCategoryId?.name
            : "") ||
          "Service";
        return {
          _id: item._id ? String(item._id) : undefined,
          serviceCategoryId:
            typeof item.serviceCategoryId === "object"
              ? String(item.serviceCategoryId?._id || "")
              : String(item.serviceCategoryId || ""),
          serviceCategoryName: String(catName),
          price: Number(item.price ?? item.cost ?? item.amount ?? 0),
          durationInMinutes:
            item.durationInMinutes != null ? Number(item.durationInMinutes) : undefined,
          employeeCount:
            item.employeeCount != null ? Number(item.employeeCount) : undefined,
          quantity: Number(item.quantity ?? 1),
        };
      }).filter(Boolean)
    : [];

  const rawExtraServices = Array.isArray(booking.extraServices)
    ? booking.extraServices.map((extra: any) => {
        if (!extra) return null;
        const name =
          extra.serviceName ||
          extra.serviceCategoryName ||
          extra.name ||
          (typeof extra.serviceCategoryId === "object"
            ? extra.serviceCategoryId?.serviceCategoryName || extra.serviceCategoryId?.name
            : "") ||
          "Extra Service";
        const p = extra.price ?? extra.cost ?? extra.amount ?? 0;
        return {
          _id: extra._id ? String(extra._id) : String(extra.serviceCategoryId || Math.random()),
          serviceName: String(name),
          price: Number(p),
          status: extra.status ? String(extra.status).toUpperCase() : "APPROVED",
          quantity: extra.quantity != null ? Number(extra.quantity) : 1,
        };
      }).filter(Boolean)
    : [];

  let serviceCatName = "";
  if (booking.serviceCategoryName) {
    if (Array.isArray(booking.serviceCategoryName)) {
      serviceCatName = booking.serviceCategoryName.join(", ");
    } else if (typeof booking.serviceCategoryName === "object") {
      serviceCatName =
        booking.serviceCategoryName.serviceCategoryName ||
        booking.serviceCategoryName.name ||
        "";
    } else {
      serviceCatName = String(booking.serviceCategoryName);
    }
  } else if (booking.serviceCategory) {
    if (Array.isArray(booking.serviceCategory)) {
      serviceCatName = booking.serviceCategory.join(", ");
    } else if (typeof booking.serviceCategory === "object") {
      serviceCatName =
        booking.serviceCategory.serviceCategoryName ||
        booking.serviceCategory.name ||
        "";
    } else {
      serviceCatName = String(booking.serviceCategory);
    }
  } else if (rawCartItems.length > 0) {
    serviceCatName = rawCartItems
      .map((c: any) => c.serviceCategoryName)
      .filter(Boolean)
      .join(", ");
  }
  if (!serviceCatName) {
    serviceCatName = "Home Service";
  }

  const rawOtp = otp ?? booking.StartWorkOTP ?? booking.otp;

  return {
    _id: String(booking._id),

    serviceCategoryName: serviceCatName,
    totalPrice: totalPrice,

    dateLabel: booking.scheduleDateTime
      ? new Date(booking.scheduleDateTime).toLocaleDateString()
      : booking.dateLabel || "",

    timeLabel: booking.scheduleDateTime
      ? new Date(booking.scheduleDateTime).toLocaleTimeString()
      : booking.timeLabel || "",

    address: booking.address || "",

    status: normalizeStatus(booking),

    otp: rawOtp != null ? String(rawOtp) : undefined,

    name: techName ? String(techName) : undefined,
    rating: techRating != null ? Number(techRating) : undefined,
    reviews: techReviews != null ? Number(techReviews) : 0,
    image: techImage ? String(techImage) : undefined,
    phone:
      booking.technician?.phoneNo ||
      booking.primaryEmployee?.phoneNo ||
      booking.primaryEmployee?.phoneno ||
      booking.externalTechnicianPhone ||
      undefined,
    eta: booking.eta || booking.location?.eta || undefined,
    cartItems: rawCartItems,

    extraServices: rawExtraServices,

    isScheduled: Boolean(booking.isScheduled),
    scheduleDateTime: booking.scheduledAt ?? booking.scheduleDateTime,
    durationInMinutes:
      booking.durationInMinutes != null ? Number(booking.durationInMinutes) : 0,
    paymentStatus: booking.paymentStatus ? String(booking.paymentStatus).toLowerCase() : undefined,
    assignmentStatus: booking.assignmentStatus
      ? String(booking.assignmentStatus).toUpperCase()
      : undefined,
    paymentType: booking.paymentType ? String(booking.paymentType).toUpperCase() : undefined,
    advanceAmount: booking.advanceAmount != null ? Number(booking.advanceAmount) : 0,
    remainingAmount: booking.remainingAmount != null ? Number(booking.remainingAmount) : 0,
    rawStatus: booking.status,
    isManuallyAssigned: Boolean(booking.isManuallyAssigned),
    domainService: booking.domainService
      ? typeof booking.domainService === "object"
        ? booking.domainService._id
          ? String(booking.domainService._id)
          : String(booking.domainService)
        : String(booking.domainService)
      : undefined,
  };
}
