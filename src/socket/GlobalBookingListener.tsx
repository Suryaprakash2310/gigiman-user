import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { socket } from "@/src/socket/socket";
import { useBooking } from "@/src/context/BookingContext";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";

export default function GlobalBookingListener() {
  const navigation = useNavigation<any>();
  const { upsertBooking, updateStatus } = useBooking();

  useEffect(() => {
    const onServicerAccepted = ({ booking, otp }: any) => {
      console.log("🟢 SERVICER ACCEPTED:", booking._id);

      const mapped = mapBookingToBookingItem(booking, otp);

      upsertBooking(mapped);

      navigation.navigate("BookingTab", {
        screen: "BookingDetails",
        params: { bookingId: booking._id },
      });
    };

    const onBookingCompleted = ({ bookingId }: any) => {
      console.log("✅ BOOKING COMPLETED:", bookingId);

      updateStatus(bookingId, "completed");

      navigation.navigate("BookingTab", {
        screen: "Review",
        params: { bookingId },
      });
    };

    socket.on("servicer-accepted", onServicerAccepted);
    socket.on("booking-completed", onBookingCompleted);

    return () => {
      socket.off("servicer-accepted", onServicerAccepted);
      socket.off("booking-completed", onBookingCompleted);
    };
  }, []);

  return null;
}