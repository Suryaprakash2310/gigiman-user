import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useBooking } from "@/src/context/BookingContext";
import AppText from "@/src/components/ui/AppText";

export default function ResumeBar() {
  const navigation = useNavigation<any>();
  const { activeBookings, getLatestActiveBooking } = useBooking();

  if (activeBookings.length === 0) return null;

  const latest = getLatestActiveBooking();
  if (!latest) return null;

  const handlePress = () => {
    if (latest.status === "searching") {
      navigation.navigate("BookingTab", { screen: "Searching", params: { bookingId: latest._id } });
    }
    else if (latest.status === "otp" || latest.status === "in_progress") {
      navigation.navigate("BookingTab", { screen: "BookingDetails", params: { bookingId: latest._id } });
    }
    else {
      navigation.navigate("BookingTab", {
        screen: "MyBookings",
        params: { tab: "ongoing" }
      });
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <AppText weight="bold">
        {activeBookings.length} Active Booking{activeBookings.length > 1 ? "s" : ""}
      </AppText>
      <AppText size="small">Tap to Resume</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#16A34A",
    elevation: 8,
  },
});