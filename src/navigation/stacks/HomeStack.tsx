// src/navigation/stacks/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/src/screens/ProfilePage';
import BookingsScreen from '@/src/screens/BookingScreen';
import BookingDetailsPage from '@/src/screens/';
import MainScreen from '@/src/screens/MainScreen';

// Placeholder screens
const HomeScreen = () => null;
const ServiceDetail = () => null;
const BookingFlow = () => null;

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={MainScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetail} />
      <Stack.Screen name="BookingFlow" component={BookingFlow} />
    </Stack.Navigator>
  );
}
