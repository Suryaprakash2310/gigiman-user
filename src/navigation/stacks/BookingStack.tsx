import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BookingScreen from "@/src/screens/BookingScreen";
import BookingSearchScreen from "@/src/screens/BookingSearchScreen";
import BookingOtp from "@/src/screens/BookingOtp";

export type BookingParamList = {
  BookingsMain: undefined;
  Searching: { bookingId: string };
  BookingDetails: { bookingId: string };
};

const Stack = createNativeStackNavigator<BookingParamList>();

export default function BookingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsMain" component={BookingScreen} />
      <Stack.Screen name="Searching" component={BookingSearchScreen} />
      <Stack.Screen name="BookingDetails" component={BookingOtp} />
    </Stack.Navigator>
  );
}
