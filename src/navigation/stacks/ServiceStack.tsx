// src/navigation/stacks/WalletStack.tsx
import ScheduleBooking from '@/src/screens/ScheduleBooking';
import ServiceCategory from '@/src/screens/service/ServiceCategory';
import ServicesScreen from '@/src/screens/service/ServiceScreen';
import ServiceBookingScreen from '@/src/screens/ServiceBooking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Placeholder
const WalletScreen = () => null;
const AddMoney = () => null;
const TransactionDetail = () => null;

const Stack = createNativeStackNavigator<ServiceParamList>();

export type ServiceParamList = {
  MainServiceScreen: undefined;
  ServiceCategory: {serviceName: string;}
  Booking: {
    serviceCategoryId: string;
    selectedAddress?: any;
  };
  ScheduleBooking: {
    serviceName: string;
  };
};


export default function ServiceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainServiceScreen" component={ServicesScreen} />
      <Stack.Screen name="ServiceCategory" component={ServiceCategory} />
      <Stack.Screen name="Booking" component={ServiceBookingScreen} />
      <Stack.Screen name="ScheduleBooking" component={ScheduleBooking} />
    </Stack.Navigator>
  );
}
