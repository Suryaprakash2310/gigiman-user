import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import BookingOtp from "@/src/screens/BookingOtp";
import BookingScreen from "@/src/screens/BookingScreen";
import BookingSearchScreen from "@/src/screens/BookingSearchScreen";
import ReviewScreen from "@/src/screens/ReviewScreen";
import SavedAddressesScreen from "@/src/screens/profile/SavedAddressesScreen";
import AddEditAddressScreen from "@/src/screens/profile/AddEditAddressScreen";
import MapPinLocationScreen from "@/src/screens/profile/MapPinLocationScreen";

export type BookingParamList = {
  BookingsMain: { activeTab?: string };
  Searching: { bookingId: string };
  BookingDetails: { bookingId: string; activeTab?: string };
  Review: { bookingId: string };
  SavedAddressesScreen: any;
  SavedAddresses: any;
  AddEditAddress: any;
  MapPinLocation: any;
};

const Stack = createNativeStackNavigator<any>();

export default function BookingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsMain" component={BookingScreen} />
      <Stack.Screen name="Searching" component={BookingSearchScreen} />
      <Stack.Screen name="BookingDetails" component={BookingOtp} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="SavedAddressesScreen" component={SavedAddressesScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
      <Stack.Screen name="MapPinLocation" component={MapPinLocationScreen} />
    </Stack.Navigator>
  );
}
