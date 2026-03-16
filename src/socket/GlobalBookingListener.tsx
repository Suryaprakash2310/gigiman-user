import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { socket } from "@/src/socket/socket";
import { useBooking } from "@/src/context/BookingContext";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";

export default function GlobalBookingListener() {
  const navigation = useNavigation<any>();
  const { upsertBooking, updateStatus } = useBooking();

  useEffect(() => {
    if (!socket) return;
    const onServicerAccepted = ({ booking, otp }: any) => {
      console.log("🟢 SERVICER ACCEPTED:", booking._id);

      const mapped = mapBookingToBookingItem(booking, otp);

      upsertBooking(mapped);

      navigation.navigate("BookingTab", {
        screen: "BookingDetails",
        params: { bookingId: booking._id },
      });
    };

    /* otp generated */
    const onOtpGenerated = ({ bookingId, otp }: any) => {
      console.log("🔑 OTP generated:", bookingId);

      updateStatus(bookingId, "otp");

      upsertBooking({
        _id: bookingId,
        status: "otp",
        otp: String(otp),
      } as any);
    };

    /* no provider available */
    const onNoProvider = () => {
      console.log("❌ No technician available");
    };

    const onBookingCompleted = ({ bookingId }: any) => {
      console.log("✅ BOOKING COMPLETED:", bookingId);

      updateStatus(bookingId, "completed");

      navigation.navigate("BookingTab", {
        screen: "Review",
        params: { bookingId },
      });
    };

   // socket.on("servicer-accepted", onServicerAccepted);
   socket.on("servicer-accepted", onServicerAccepted);
    socket.on("otp-generated", onOtpGenerated);
    socket.on("no-servicer-available", onNoProvider);
    socket.on("booking-completed", onBookingCompleted);

    return () => {
      // socket.off("servicer-accepted", onServicerAccepted);
      socket.off("servicer-accepted", onServicerAccepted);
      socket.off("otp-generated", onOtpGenerated);
      socket.off("no-servicer-available", onNoProvider);
      socket.off("booking-completed", onBookingCompleted);
    };
  }, [socket]);

  return null;
}