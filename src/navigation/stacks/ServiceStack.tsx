// src/navigation/stacks/WalletStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ServiceCategory from '@/src/screens/service/ServiceCategory';
import ServicesScreen from '@/src/screens/service/ServiceScreen';
import ServiceBookingScreen from '@/src/screens/ServiceBooking';

// Placeholder
const WalletScreen = () => null;
const AddMoney = () => null;
const TransactionDetail = () => null;

const Stack = createNativeStackNavigator<ServiceParamList>();

export type ServiceParamList = {
  MainServiceScreen: undefined;
  SubServiceScreen: undefined;
  Booking: {
    serviceName: string;
    price: number;
    time: string;
    image: any;
    description?: string[];
    rating?: number;
    reviews?: number;
  };
};


export default function ServiceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainServiceScreen" component={ServicesScreen} />
      <Stack.Screen name="SubServiceScreen" component={ServiceCategory} />
      <Stack.Screen name="Booking" component={ServiceBookingScreen} />
    </Stack.Navigator>
  );
}
