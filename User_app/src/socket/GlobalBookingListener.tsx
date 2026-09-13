import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
import { socket } from "@/src/socket/socket";
import { useBooking } from "@/src/context/BookingContext";
import { useNotifications } from "@/src/context/NotificationContext";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";

export default function GlobalBookingListener() {
  const navigation = useNavigation<any>();
  const { bookings, upsertBooking, updateStatus, updateBookingItem, refreshBookings } = useBooking();
  const { addLocalNotification, fetchNotifications } = useNotifications();

  const bookingsRef = useRef(bookings);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  useEffect(() => {
    if (!socket) return;
    const onServicerAccepted = ({ booking, otp }: any) => {
    

      const mapped = mapBookingToBookingItem(booking, otp);

      upsertBooking(mapped);

      // Avoid double navigation if the user is already on the Searching screen.
      // The Searching screen itself (BookingSearchScreen) handles replacing itself
      // with BookingDetails when the booking status updates.
      const currentRoute = navigation.getCurrentRoute?.()?.name;
      if (currentRoute === "Searching") {
        return;
      }

      if (mapped.assignmentStatus === "FAILED") {
        navigation.navigate("BookingTab", {
          screen: "BookingsMain",
          params: { activeTab: "manualAssignment" },
        });
      } else {
        navigation.navigate("BookingTab", {
          screen: "BookingDetails",
          params: { bookingId: booking._id },
        });
      }
    };

    /* otp generated */
    const onOtpGenerated = ({ bookingId, otp }: any) => {
      updateBookingItem(bookingId, {
        status: "otp",
        otp: String(otp),
      });
    };

    /* provider started trip */
    const onTripStarted = (data: any) => {
      const id = String(data?.bookingId || data?.id || data?._id || (typeof data === "string" ? data : ""));
      if (!id) return;
      updateBookingItem(id, {
        status: "provider_started_trip",
        providerCoordinates:
          data?.latitude && data?.longitude
            ? { latitude: Number(data.latitude), longitude: Number(data.longitude) }
            : undefined,
        eta: data?.eta,
        ...(data?.otp ? { otp: String(data.otp) } : {}),
      });
      refreshBookings?.();
    };

    /* provider on the way */
    const onProviderOnTheWay = (data: any) => {
      const id = String(data?.bookingId || data?.id || data?._id || (typeof data === "string" ? data : ""));
      if (!id) return;
      updateBookingItem(id, {
        status: "provider_on_the_way",
        providerCoordinates:
          data?.latitude && data?.longitude
            ? { latitude: Number(data.latitude), longitude: Number(data.longitude) }
            : undefined,
        eta: data?.eta,
        ...(data?.otp ? { otp: String(data.otp) } : {}),
      });
      refreshBookings?.();
    };

    /* provider location update */
    const onServicerLocation = (data: any) => {
      const id = String(data?.bookingId || data?.id || data?._id || "");
      if (!id) return;
      if (data?.latitude != null && data?.longitude != null) {
        updateBookingItem(id, {
          providerCoordinates: { latitude: Number(data.latitude), longitude: Number(data.longitude) },
          eta: data?.eta,
        });
      }
    };

    /* provider arrived */
    const onProviderArrived = (data: any) => {
      const id = String(data?.bookingId || data?.id || data?._id || (typeof data === "string" ? data : ""));
      if (!id) return;
      updateBookingItem(id, {
        status: "provider_arrived",
        ...(data?.otp ? { otp: String(data.otp) } : {}),
      });
      refreshBookings?.();
    };

    /* otp verified */
    const onOtpVerified = (data: any) => {
      const id = String(data?.bookingId || data?.id || data?._id || (typeof data === "string" ? data : ""));
      if (!id) return;
      const nowIso = new Date().toISOString();
      updateBookingItem(id, {
        status: "otp_verified",
        serviceStartTime: data?.startTime || data?.startedAt || data?.serviceStartedAt || nowIso,
      });
      refreshBookings?.();
      setTimeout(() => {
        updateBookingItem(id, { status: "in_progress" });
        refreshBookings?.();
      }, 1500);
    };

    /* service started */
    const onServiceStarted = (data: any) => {
      const id = String(data?.bookingId || data?.id || data?._id || (typeof data === "string" ? data : ""));
      if (!id) return;
      const nowIso = new Date().toISOString();
      updateBookingItem(id, {
        status: "in_progress",
        serviceStartTime: data?.startTime || data?.startedAt || data?.serviceStartedAt || nowIso,
        ...(data?.serviceTimer || data?.timerStatus ? { serviceTimer: data.serviceTimer || data.timerStatus } : {}),
      });
      refreshBookings?.();
    };

    /* timer status / tick */
    const onGlobalTimerStatus = (data: any) => {
      const id = String(data?.bookingId || data?.id || data?._id || "");
      if (!id) return;
      updateBookingItem(id, {
        serviceTimer: data,
        ...(data?.startTime || data?.startedAt ? { serviceStartTime: data.startTime || data.startedAt } : {}),
      });
    };

    const handleAssignmentFailure = (bookingId: string) => {
      updateBookingItem(bookingId, { status: "manual_assign", assignmentStatus: "FAILED" });
      
      const booking = bookingsRef.current.find(b => String(b._id) === String(bookingId));
      
      const localNotification = {
        _id: `failed_${bookingId}_${Date.now()}`,
        userId: null,
        title: "Service Provider Assignment in Progress",
        message: "Your booking has been confirmed. We're finding the best service provider for your request. A technician will be assigned within 10–15 minutes. Thank you for your patience.",
        description: "Booking advance payment is completed and admin will assign a service provider manually.",
        isRead: false,
        type: "FAILED_BOOKING" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bookingId: bookingId,
        serviceName: booking?.serviceCategoryName || "Home Service",
        serviceDetails: booking?.serviceCategoryName ? `${booking.serviceCategoryName} (x1)` : undefined,
        metadata: {
          bookingReference: bookingId,
        }
      };

      addLocalNotification(localNotification);
      fetchNotifications?.(true);

      // Avoid double navigation if the user is already on the Searching screen.
      const currentRoute = navigation.getCurrentRoute?.()?.name;
      if (currentRoute === "Searching") {
        return;
      }

      navigation.navigate("BookingTab", {
        screen: "BookingsMain",
        params: { activeTab: "manualAssignment" },
      });
    };

    /* no provider available */
    const onNoProvider = (payload: any) => {
      const bookingId = payload?.bookingId || payload;
      if (bookingId && typeof bookingId === "string") {
        handleAssignmentFailure(bookingId);
      }
    };

    /* no team available */
    const onNoTeam = (payload: any) => {

      const bookingId = payload?.bookingId || payload;
      if (bookingId && typeof bookingId === "string") {
        handleAssignmentFailure(bookingId);
      }
    };

    const onBookingCompleted = (payload: any) => {
      const id = String(
        payload?.bookingId ||
        payload?.id ||
        payload?._id ||
        payload?.booking?._id ||
        payload?.booking?.id ||
        payload?.data?.bookingId ||
        (typeof payload === "string" ? payload : "")
      );
      if (!id) return;

      updateStatus(id, "completed");
      refreshBookings?.();
      fetchNotifications?.(true);

      navigation.navigate("BookingTab", {
        screen: "Review",
        params: { bookingId: id },
      });
    };

    /* user cancelled */
    const onUserCancelBooking = (payload: any) => {
      const id = payload?.bookingId || payload;
      if (id) {
        updateStatus(id, "cancelled");
        Alert.alert("Booking Cancelled", "The user cancelled the booking");
        navigation.replace?.("BookingsMain") || navigation.navigate("BookingsMain");
      }
    };

    socket.on("servicer-accepted", onServicerAccepted);
    socket.on("provider-accepted", onServicerAccepted);
    socket.on("technician-accepted", onServicerAccepted);
    socket.on("booking-accepted", onServicerAccepted);
    socket.on("provider-started-trip", onTripStarted);
    socket.on("trip-started", onTripStarted);
    socket.on("servicer-started-trip", onTripStarted);
    socket.on("technician-started-trip", onTripStarted);
    socket.on("start-trip", onTripStarted);
    socket.on("provider-on-the-way", onProviderOnTheWay);
    socket.on("servicer-on-the-way", onProviderOnTheWay);
    socket.on("technician-on-the-way", onProviderOnTheWay);
    socket.on("on-the-way", onProviderOnTheWay);
    socket.on("servicer-location-update", onServicerLocation);
    socket.on("provider-location-update", onServicerLocation);
    socket.on("technician-location-update", onServicerLocation);
    socket.on("location-update", onServicerLocation);
    socket.on("provider-arrived", onProviderArrived);
    socket.on("servicer-arrived", onProviderArrived);
    socket.on("technician-arrived", onProviderArrived);
    socket.on("arrived", onProviderArrived);
    socket.on("otp-generated", onOtpGenerated);
    socket.on("start-service-otp", onOtpGenerated);
    socket.on("booking-otp", onOtpGenerated);
    socket.on("otp-verified", onOtpVerified);
    socket.on("service-started", onServiceStarted);
    socket.on("in-progress", onServiceStarted);
    socket.on("service-in-progress", onServiceStarted);
    socket.on("service-timer-started", onGlobalTimerStatus);
    socket.on("booking-timer-status", onGlobalTimerStatus);
    socket.on("timer-status", onGlobalTimerStatus);
    socket.on("timer-update", onGlobalTimerStatus);
    socket.on("timer-tick", onGlobalTimerStatus);
    socket.on("service-timer", onGlobalTimerStatus);
    socket.on("service-timer-update", onGlobalTimerStatus);
    socket.on("service-timer-sync", onGlobalTimerStatus);
    socket.on("job-timer-update", onGlobalTimerStatus);
    socket.on("job-timer-status", onGlobalTimerStatus);
    socket.on("no-servicer-available", onNoProvider);
    socket.on("no-team-available", onNoTeam);
    socket.on("booking-completed", onBookingCompleted);
    socket.on("service-completed", onBookingCompleted);
    socket.on("booking-complete", onBookingCompleted);
    socket.on("service-complete", onBookingCompleted);
    socket.on("service-finished", onBookingCompleted);
    socket.on("user-cancel-booking", onUserCancelBooking);

    return () => {
      socket.off("servicer-accepted", onServicerAccepted);
      socket.off("provider-accepted", onServicerAccepted);
      socket.off("technician-accepted", onServicerAccepted);
      socket.off("booking-accepted", onServicerAccepted);
      socket.off("provider-started-trip", onTripStarted);
      socket.off("trip-started", onTripStarted);
      socket.off("servicer-started-trip", onTripStarted);
      socket.off("technician-started-trip", onTripStarted);
      socket.off("start-trip", onTripStarted);
      socket.off("provider-on-the-way", onProviderOnTheWay);
      socket.off("servicer-on-the-way", onProviderOnTheWay);
      socket.off("technician-on-the-way", onProviderOnTheWay);
      socket.off("on-the-way", onProviderOnTheWay);
      socket.off("servicer-location-update", onServicerLocation);
      socket.off("provider-location-update", onServicerLocation);
      socket.off("technician-location-update", onServicerLocation);
      socket.off("location-update", onServicerLocation);
      socket.off("provider-arrived", onProviderArrived);
      socket.off("servicer-arrived", onProviderArrived);
      socket.off("technician-arrived", onProviderArrived);
      socket.off("arrived", onProviderArrived);
      socket.off("otp-generated", onOtpGenerated);
      socket.off("start-service-otp", onOtpGenerated);
      socket.off("booking-otp", onOtpGenerated);
      socket.off("otp-verified", onOtpVerified);
      socket.off("service-started", onServiceStarted);
      socket.off("in-progress", onServiceStarted);
      socket.off("service-in-progress", onServiceStarted);
      socket.off("service-timer-started", onGlobalTimerStatus);
      socket.off("booking-timer-status", onGlobalTimerStatus);
      socket.off("timer-status", onGlobalTimerStatus);
      socket.off("timer-update", onGlobalTimerStatus);
      socket.off("timer-tick", onGlobalTimerStatus);
      socket.off("service-timer", onGlobalTimerStatus);
      socket.off("service-timer-update", onGlobalTimerStatus);
      socket.off("service-timer-sync", onGlobalTimerStatus);
      socket.off("job-timer-update", onGlobalTimerStatus);
      socket.off("job-timer-status", onGlobalTimerStatus);
      socket.off("no-servicer-available", onNoProvider);
      socket.off("no-team-available", onNoTeam);
      socket.off("booking-completed", onBookingCompleted);
      socket.off("service-completed", onBookingCompleted);
      socket.off("booking-complete", onBookingCompleted);
      socket.off("service-complete", onBookingCompleted);
      socket.off("service-finished", onBookingCompleted);
      socket.off("user-cancel-booking", onUserCancelBooking);
    };
  }, [socket]);

  return null;
}