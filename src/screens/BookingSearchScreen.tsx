import React, { useEffect, useRef } from "react";
import { View, Alert, Animated } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { socket } from "@/src/socket/socket";
import { useBooking } from "@/src/context/BookingContext";
import AppText from "@/src/components/ui/AppText";
import { BookingParamList } from "@/src/navigation/stacks/BookingStack";
import { mapBookingToBookingItem } from "../utils/mapBooking";
import api from "../api/client";

type Route = RouteProp<BookingParamList, "Searching">;

export default function BookingSearchScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const { bookingId } = route.params;
  const { upsertBooking } = useBooking();

  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!bookingId) return;

    socket.connect();

    socket.on("connect", () => {
      console.log("🟢 USER SOCKET CONNECTED:", socket.id);

      // 🔑 REGISTER USER HERE
      // socket.emit("register-user", {
      //   userId: route.params.userId, // or from auth context
      // });
    });

    return () => {
      socket.off("connect");
    };
  }, []);



  /* 🔁 FETCH BOOKING */
  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        const res = await api.get(`/booking/${bookingId}`);
        if (res.data?.booking) {
          const mapped = mapBookingToBookingItem(res.data.booking);
          upsertBooking(mapped);
        }
      } catch {
        console.log("Waiting for booking to be assigned...");
      }
    };

    fetchBooking();
  }, [bookingId]);

  /* 🔌 SOCKET */
  useEffect(() => {
    const onAccepted = ({ booking, otp }: any) => {
      const mapped = mapBookingToBookingItem(booking, otp);
      //     upsertBooking({
      //   _id: booking._id,
      //   serviceName: booking.serviceCategoryName,
      //   amount: booking.totalPrice,
      //   dateLabel: "",
      //   timeLabel: "",
      //   address: booking.address,
      //   status: booking.status,
      //   otp, // ✅ THIS IS NOW REAL
      //   technicianName: booking.primaryEmployee?.fullname,
      //   technicianPhone: booking.primaryEmployee?.phoneno,
      //   technicianRating: booking.primaryEmployee?.rating,
      // });

      console.log("📦 ----Booking stored in context:", booking, otp);
      upsertBooking(mapped);
      //const mapped = mapBookingToBookingItem(booking);
      //console.log("🟢 ---------mapped Booking accepted:", mapped);
      //upsertBooking(mapped);
      //socket.on("servicer-accepted", onAccepted);
      navigation.replace("BookingDetails", {
        bookingId: booking._id,
      });
    };

    const onNoProvider = () => {
      Alert.alert("No technicians available");
      //navigation.goBack();
    };

    socket.on("servicer-accepted", onAccepted);
    socket.on("no-servicer-available", onNoProvider);

    return () => {
      socket.off("servicer-accepted", onAccepted);
      socket.off("no-servicer-available", onNoProvider);
    };
  }, []);

  // useEffect(() => {
  //   const onTeamAssigned = (booking: any) => {
  //     console.log("🟢 TEAM ASSIGNED TO USER:", booking);

  //     const mapped = mapBookingToBookingItem(booking);
  //     upsertBooking(mapped);

  //     navigation.replace("BookingDetails", {
  //       bookingId: booking._id,
  //     });
  //   };

  //   const onNoTeamAvailable = () => {
  //     Alert.alert("No teams available");
  //     navigation.goBack();
  //   };

  //   socket.on("team-assigned", onTeamAssigned);
  //   socket.on("no-team-available", onNoTeamAvailable);

  //   return () => {
  //     socket.off("team-assigned", onTeamAssigned);
  //     socket.off("no-team-available", onNoTeamAvailable);
  //   };
  // }, []);

 useEffect(() => {
  const onOtpGenerated = ({ bookingId, otp }: any) => {
    console.log("🟢 OTP RECEIVED FOR USER:", bookingId, otp);

    

    upsertBooking({
      _id: bookingId,
      status: "assigned",
      otp,
      serviceCategoryName: "arun",
      amount: 0,
      dateLabel: "",
      timeLabel: "",
      address: ""
    });

    navigation.replace("BookingDetails", { bookingId });
  };

  socket.on("otp-generated", onOtpGenerated);

  return () => {
    socket.off("otp-generated", onOtpGenerated);
  };
}, []);




  /* ⏳ ANIMATION */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <AppText weight="bold" size="h3">
        Finding the best technician for you…
      </AppText>
    </View>
  );
}
