import { BookingItem, BookingStatus } from "@/src/context/BookingContext";

function normalizeStatus(booking: any): BookingStatus {
  const status = booking.status?.toLowerCase();
  const assignment = booking.assignmentStatus?.toLowerCase();

  // 1. Check for Terminal Statuses
  if (
    status === "completed" ||
    status === "complete" ||
    status === "finished" ||
    status === "service_completed" ||
    status === "ended"
  ) {
    return "completed";
  }
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
  if (status === "otp_verified") return "otp_verified";

  // 5. Check for OTP Status
  if (status === "otp" || status === "start_service_otp") return "otp";

  // 6. Check for Arrived Status
  if (status === "arrived" || status === "provider_arrived" || status === "servicer_arrived") {
    return "provider_arrived";
  }

  // 7. Check for On The Way Status
  if (status === "on_the_way" || status === "provider_on_the_way" || status === "servicer_on_the_way") {
    return "provider_on_the_way";
  }

  // 8. Check for Started Trip Status
  if (
    status === "started_trip" ||
    status === "trip_started" ||
    status === "provider_started_trip" ||
    status === "provider_started" ||
    status === "servicer_started_trip"
  ) {
    return "provider_started_trip";
  }

  // 9. Check for Searching Status
  if (assignment === "searching" || status === "searching") return "searching";

  // 10. Check for Provider Accepted / Assigned Status
  if (
    status === "accepted" ||
    status === "assigned" ||
    assignment === "assigned"
  ) {
    if (booking.isManuallyAssigned && status === "assigned") {
      return "assigned";
    }
    return "accepted";
  }

  // Default to Searching
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

  const rawOtp =
    otp ??
    booking.StartWorkOTP ??
    booking.otp ??
    booking.startWorkOtp ??
    booking.startWorkOTP ??
    booking.startOtp ??
    booking.bookingOtp ??
    booking.serviceOtp;

  // Parse customer coordinates
  let customerCoords: { latitude: number; longitude: number } | undefined;
  if (booking.location?.coordinates && Array.isArray(booking.location.coordinates) && booking.location.coordinates.length >= 2) {
    // MongoDB GeoJSON format: [longitude, latitude]
    customerCoords = {
      longitude: Number(booking.location.coordinates[0]),
      latitude: Number(booking.location.coordinates[1]),
    };
  } else if (booking.customerCoordinates?.latitude && booking.customerCoordinates?.longitude) {
    customerCoords = {
      latitude: Number(booking.customerCoordinates.latitude),
      longitude: Number(booking.customerCoordinates.longitude),
    };
  } else if (booking.latitude != null && booking.longitude != null) {
    customerCoords = {
      latitude: Number(booking.latitude),
      longitude: Number(booking.longitude),
    };
  }

  // Parse provider coordinates
  let providerCoords: { latitude: number; longitude: number } | undefined;
  if (booking.servicerLocation?.coordinates && Array.isArray(booking.servicerLocation.coordinates) && booking.servicerLocation.coordinates.length >= 2) {
    providerCoords = {
      longitude: Number(booking.servicerLocation.coordinates[0]),
      latitude: Number(booking.servicerLocation.coordinates[1]),
    };
  } else if (booking.providerCoordinates?.latitude && booking.providerCoordinates?.longitude) {
    providerCoords = {
      latitude: Number(booking.providerCoordinates.latitude),
      longitude: Number(booking.providerCoordinates.longitude),
    };
  } else if (booking.servicerLocation?.latitude != null && booking.servicerLocation?.longitude != null) {
    providerCoords = {
      latitude: Number(booking.servicerLocation.latitude),
      longitude: Number(booking.servicerLocation.longitude),
    };
  }

  return {
    _id: String(booking._id),

    serviceCategoryName: serviceCatName,
    totalPrice: totalPrice,

    dateLabel: booking.scheduleDateTime
      ? new Date(booking.scheduleDateTime).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : booking.createdAt
        ? new Date(booking.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : booking.dateLabel || "",

    timeLabel: booking.scheduleDateTime
      ? new Date(booking.scheduleDateTime).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : booking.createdAt
        ? new Date(booking.createdAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
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
    customerCoordinates: customerCoords,
    providerCoordinates: providerCoords,
    cartItems: rawCartItems,

    extraServices: rawExtraServices,

    isScheduled: Boolean(booking.isScheduled),
    scheduleDateTime: booking.scheduledAt ?? booking.scheduleDateTime,
    createdAt: booking.createdAt,
    durationInMinutes:
      booking.durationInMinutes != null
        ? Number(booking.durationInMinutes)
        : booking.workingHours
        ? Number(booking.workingHours)
        : 0,
    serviceStartTime:
      booking.serviceStartTime ||
      booking.startedAt ||
      booking.serviceStartedAt ||
      booking.jobStartedAt ||
      booking.timer?.startTime ||
      booking.serviceTimer?.startTime ||
      booking.timerStatus?.startTime,
    serviceTimer: booking.serviceTimer || booking.timer || booking.timerStatus,
    paymentStatus: booking.paymentStatus ? String(booking.paymentStatus).toLowerCase() : undefined,
    assignmentStatus: booking.assignmentStatus
      ? String(booking.assignmentStatus).toUpperCase()
      : undefined,
    paymentType: booking.paymentType ? String(booking.paymentType).toUpperCase() : undefined,
    advanceAmount: booking.advanceAmount != null ? Number(booking.advanceAmount) : 0,
    remainingAmount: booking.remainingAmount != null ? Number(booking.remainingAmount) : 0,
    rawStatus: booking.status,
    isManuallyAssigned: Boolean(booking.isManuallyAssigned),
    domainService: booking.domainServiceId || booking.domainService
      ? typeof (booking.domainServiceId || booking.domainService) === "object"
        ? (booking.domainServiceId || booking.domainService)._id
          ? String((booking.domainServiceId || booking.domainService)._id)
          : String(booking.domainServiceId || booking.domainService)
        : String(booking.domainServiceId || booking.domainService)
      : undefined,
    cancelReason: booking.cancelReason || booking.cancellationReason || undefined,
    convenienceFee: booking.convenienceFee != null ? Number(booking.convenienceFee) : undefined,
    isReviewed: Boolean(
      booking.isReviewed ||
      booking.reviewed ||
      booking.hasReviewed ||
      booking.reviewSubmitted ||
      booking.userRating != null ||
      booking.ratingGiven != null ||
      booking.customerRating != null ||
      (booking.review && (typeof booking.review === 'object' ? booking.review.rating != null : true)) ||
      booking.reviewId
    ),
    userRating:
      booking.userRating != null
        ? Number(booking.userRating)
        : booking.ratingGiven != null
        ? Number(booking.ratingGiven)
        : typeof booking.review === 'object' && booking.review?.rating != null
        ? Number(booking.review.rating)
        : undefined,
    userReview:
      typeof booking.review === 'object'
        ? booking.review?.comment || booking.review?.review
        : typeof booking.review === 'string'
        ? booking.review
        : booking.comment || booking.userReview || undefined,
  };
}
