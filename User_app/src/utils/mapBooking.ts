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
  if (
    status === "in_progress" ||
    status === "inprogress" ||
    status === "in-progress" ||
    status === "service_started" ||
    status === "service-started" ||
    status === "started" ||
    status === "service_in_progress" ||
    status === "service-in-progress" ||
    status === "work_in_progress" ||
    status === "ongoing" ||
    status === "working"
  ) {
    return "in_progress";
  }

  if (
    status === "otp_verified" ||
    status === "otp-verified" ||
    status === "otpverified"
  ) {
    return "otp_verified";
  }

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
          originalPrice: item.originalPrice != null ? Number(item.originalPrice) : undefined,
          offerPrice: item.offerPrice != null ? Number(item.offerPrice) : undefined,
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
  const parsePair = (c1: any, c2: any) => {
    const n1 = Number(c1);
    const n2 = Number(c2);
    if (!Number.isFinite(n1) || !Number.isFinite(n2) || (n1 === 0 && n2 === 0)) return undefined;
    if (Math.abs(n1) > 90 && Math.abs(n2) <= 90) {
      return { longitude: n1, latitude: n2 };
    } else if (Math.abs(n2) > 90 && Math.abs(n1) <= 90) {
      return { latitude: n1, longitude: n2 };
    }
    // Default GeoJSON convention: [longitude, latitude]
    return { longitude: n1, latitude: n2 };
  };

  if (booking.location?.coordinates && Array.isArray(booking.location.coordinates) && booking.location.coordinates.length >= 2) {
    customerCoords = parsePair(booking.location.coordinates[0], booking.location.coordinates[1]);
  } else if (booking.coordinates && Array.isArray(booking.coordinates) && booking.coordinates.length >= 2) {
    customerCoords = parsePair(booking.coordinates[0], booking.coordinates.length > 1 ? booking.coordinates[1] : undefined);
  } else if (booking.addressDetails?.coordinates && Array.isArray(booking.addressDetails.coordinates) && booking.addressDetails.coordinates.length >= 2) {
    customerCoords = parsePair(booking.addressDetails.coordinates[0], booking.addressDetails.coordinates[1]);
  } else if (booking.addressId?.location?.coordinates && Array.isArray(booking.addressId.location.coordinates) && booking.addressId.location.coordinates.length >= 2) {
    customerCoords = parsePair(booking.addressId.location.coordinates[0], booking.addressId.location.coordinates[1]);
  } else if (booking.addressId?.coordinates && Array.isArray(booking.addressId.coordinates) && booking.addressId.coordinates.length >= 2) {
    customerCoords = parsePair(booking.addressId.coordinates[0], booking.addressId.coordinates[1]);
  } else if (booking.userLocation?.coordinates && Array.isArray(booking.userLocation.coordinates) && booking.userLocation.coordinates.length >= 2) {
    customerCoords = parsePair(booking.userLocation.coordinates[0], booking.userLocation.coordinates[1]);
  } else if (booking.customerCoordinates?.latitude != null && booking.customerCoordinates?.longitude != null) {
    customerCoords = {
      latitude: Number(booking.customerCoordinates.latitude),
      longitude: Number(booking.customerCoordinates.longitude),
    };
  } else if (booking.latitude != null && booking.longitude != null) {
    customerCoords = {
      latitude: Number(booking.latitude),
      longitude: Number(booking.longitude),
    };
  } else if (booking.lat != null && booking.lng != null) {
    customerCoords = {
      latitude: Number(booking.lat),
      longitude: Number(booking.lng),
    };
  } else if (booking.addressDetails?.latitude != null && booking.addressDetails?.longitude != null) {
    customerCoords = {
      latitude: Number(booking.addressDetails.latitude),
      longitude: Number(booking.addressDetails.longitude),
    };
  } else if (booking.address?.latitude != null && booking.address?.longitude != null) {
    customerCoords = {
      latitude: Number(booking.address.latitude),
      longitude: Number(booking.address.longitude),
    };
  }

  // Parse provider coordinates
  let providerCoords: { latitude: number; longitude: number } | undefined;
  if (booking.servicerLocation?.coordinates && Array.isArray(booking.servicerLocation.coordinates) && booking.servicerLocation.coordinates.length >= 2) {
    providerCoords = parsePair(booking.servicerLocation.coordinates[0], booking.servicerLocation.coordinates[1]);
  } else if (booking.servicerCoordinates && Array.isArray(booking.servicerCoordinates) && booking.servicerCoordinates.length >= 2) {
    providerCoords = parsePair(booking.servicerCoordinates[0], booking.servicerCoordinates[1]);
  } else if (booking.providerCoordinates?.latitude != null && booking.providerCoordinates?.longitude != null) {
    providerCoords = {
      latitude: Number(booking.providerCoordinates.latitude),
      longitude: Number(booking.providerCoordinates.longitude),
    };
  } else if (booking.servicerLocation?.latitude != null && booking.servicerLocation?.longitude != null) {
    providerCoords = {
      latitude: Number(booking.servicerLocation.latitude),
      longitude: Number(booking.servicerLocation.longitude),
    };
  } else if (booking.technician?.location?.coordinates && Array.isArray(booking.technician.location.coordinates) && booking.technician.location.coordinates.length >= 2) {
    providerCoords = parsePair(booking.technician.location.coordinates[0], booking.technician.location.coordinates[1]);
  } else if (booking.primaryEmployee?.location?.coordinates && Array.isArray(booking.primaryEmployee.location.coordinates) && booking.primaryEmployee.location.coordinates.length >= 2) {
    providerCoords = parsePair(booking.primaryEmployee.location.coordinates[0], booking.primaryEmployee.location.coordinates[1]);
  }

  return {
    _id: String(booking._id),
    bookingCode: booking.bookingCode || booking.bookingReference || (booking.bookingId && !/^[0-9a-fA-F]{24}$/.test(String(booking.bookingId)) ? String(booking.bookingId) : (String(booking._id).startsWith('GGM-') ? String(booking._id) : undefined)),

    serviceCategoryName: serviceCatName,
    totalPrice: totalPrice,
    originalPrice: booking.originalPrice != null ? Number(booking.originalPrice) : undefined,
    offerPrice: booking.offerPrice != null ? Number(booking.offerPrice) : undefined,
    serviceId: booking.serviceId || booking.serviceCategoryId || undefined,

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
      booking.technicianPhone ||
      booking.phone ||
      undefined,
    receiverPhone:
      booking.receiverPhone ||
      booking.addressDetails?.receiverPhone ||
      booking.addressId?.receiverPhone ||
      booking.contactPhone ||
      booking.userPhone ||
      booking.user?.phoneNo ||
      booking.user?.phone ||
      booking.phoneNo ||
      booking.phoneNumber ||
      undefined,
    userPhone:
      booking.userPhone ||
      booking.user?.phoneNo ||
      booking.user?.phone ||
      booking.phoneNo ||
      booking.phoneNumber ||
      undefined,
    eta: booking.eta || booking.location?.eta || undefined,
    customerCoordinates: customerCoords,
    providerCoordinates: providerCoords,
    cartItems: rawCartItems,

    extraServices: rawExtraServices,

    isScheduled: Boolean(booking.isScheduled),
    scheduleDateTime: booking.scheduledAt ?? booking.scheduleDateTime,
    createdAt: booking.createdAt,
    durationInMinutes: (() => {
      if (booking.durationInMinutes != null && Number(booking.durationInMinutes) > 0) {
        return Number(booking.durationInMinutes);
      }
      if (booking.workingHours != null && Number(booking.workingHours) > 0) {
        const wh = Number(booking.workingHours);
        return wh > 12 ? wh : wh * 60;
      }
      const cartDuration = rawCartItems.reduce(
        (acc: number, it: any) => acc + (Number(it.durationInMinutes || 0) * Number(it.quantity || 1)),
        0
      );
      if (cartDuration > 0) return cartDuration;
      return 60;
    })(),
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
