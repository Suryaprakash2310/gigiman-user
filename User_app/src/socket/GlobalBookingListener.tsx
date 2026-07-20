import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
import { socket } from "@/src/socket/socket";
import { useBooking } from "@/src/context/BookingContext";
import { useNotifications } from "@/src/context/NotificationContext";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";

export default function GlobalBookingListener() {
  const navigation = useNavigation<any>();
  const { bookings, upsertBooking, updateStatus, updateBookingItem } = useBooking();
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
      updateStatus(bookingId, "otp");

      upsertBooking({
        _id: bookingId,
        status: "otp",
        otp: String(otp),
      } as any);
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

    const onBookingCompleted = ({ bookingId }: any) => {
  
      updateStatus(bookingId, "completed");

      navigation.navigate("BookingTab", {
        screen: "Review",
        params: { bookingId },
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

    // socket.on("servicer-accepted", onServicerAccepted);
    socket.on("servicer-accepted", onServicerAccepted);
    socket.on("otp-generated", onOtpGenerated);
    socket.on("no-servicer-available", onNoProvider);
    socket.on("no-team-available", onNoTeam);
    socket.on("booking-completed", onBookingCompleted);
    socket.on("user-cancel-booking", onUserCancelBooking);

    return () => {
      // socket.off("servicer-accepted", onServicerAccepted);
      socket.off("servicer-accepted", onServicerAccepted);
      socket.off("otp-generated", onOtpGenerated);
      socket.off("no-servicer-available", onNoProvider);
      socket.off("no-team-available", onNoTeam);
      socket.off("booking-completed", onBookingCompleted);
      socket.off("user-cancel-booking", onUserCancelBooking);
    };
  }, [socket]);

  return null;
}