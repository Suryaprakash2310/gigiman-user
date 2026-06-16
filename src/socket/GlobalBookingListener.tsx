import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
import { socket } from "@/src/socket/socket";
import { useBooking } from "@/src/context/BookingContext";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";

export default function GlobalBookingListener() {
  const navigation = useNavigation<any>();
  const { upsertBooking, updateStatus, updateBookingItem } = useBooking();

  useEffect(() => {
    if (!socket) return;
    const onServicerAccepted = ({ booking, otp }: any) => {
      console.log("[SOCKET RECEIVE] 🟢 servicer-accepted payload for:", booking._id);

      const mapped = mapBookingToBookingItem(booking, otp);

      upsertBooking(mapped);

      navigation.navigate("BookingTab", {
        screen: "BookingDetails",
        params: { bookingId: booking._id },
      });
    };

    /* otp generated */
    const onOtpGenerated = ({ bookingId, otp }: any) => {
      console.log("[SOCKET RECEIVE] 🔑 otp-generated payload for:", bookingId);

      updateStatus(bookingId, "otp");

      upsertBooking({
        _id: bookingId,
        status: "otp",
        otp: String(otp),
      } as any);
    };

    /* no provider available */
    const onNoProvider = (payload: any) => {
      console.log("[SOCKET RECEIVE] ❌ no-servicer-available payload:", payload);
      const bookingId = payload?.bookingId || payload;
      if (bookingId && typeof bookingId === "string") {
        updateBookingItem(bookingId, { assignmentStatus: "FAILED" });
        navigation.navigate("BookingTab", {
          screen: "BookingDetails",
          params: { bookingId },
        });
      }
    };

    /* no team available */
    const onNoTeam = (payload: any) => {
      console.log("[SOCKET RECEIVE] ❌ no-team-available payload:", payload);
      const bookingId = payload?.bookingId || payload;
      if (bookingId && typeof bookingId === "string") {
        updateBookingItem(bookingId, { assignmentStatus: "FAILED" });
        navigation.navigate("BookingTab", {
          screen: "BookingDetails",
          params: { bookingId },
        });
      }
    };

    const onBookingCompleted = ({ bookingId }: any) => {
      console.log("[SOCKET RECEIVE] ✅ booking-completed payload for:", bookingId);

      updateStatus(bookingId, "completed");

      navigation.navigate("BookingTab", {
        screen: "Review",
        params: { bookingId },
      });
    };

    /* user cancelled */
    const onUserCancelBooking = (payload: any) => {
      console.log("📥 user-cancel-booking received:", payload);
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