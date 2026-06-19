import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import BookingOtp from "@/src/screens/BookingOtp";
import BookingScreen from "@/src/screens/BookingScreen";
import BookingSearchScreen from "@/src/screens/BookingSearchScreen";
//import LiveTrackingScreen from "@/src/screens/LiveTrackingScreen";
import ReviewScreen from "@/src/screens/ReviewScreen";

export type BookingParamList = {
  BookingsMain: { activeTab?: string };
  Searching: { bookingId: string };
  BookingDetails: { bookingId: string };
  Review: { bookingId: string };
  //LiveTracking: { bookingId: string };
};

const Stack = createNativeStackNavigator<BookingParamList>();

export default function BookingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsMain" component={BookingScreen} />
      <Stack.Screen name="Searching" component={BookingSearchScreen} />
      <Stack.Screen name="BookingDetails" component={BookingOtp} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      {/* <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} /> */}
    </Stack.Navigator>
  );
}
