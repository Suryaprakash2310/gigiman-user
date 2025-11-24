// src/navigation/stacks/BookingStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Placeholder
const BookingScreen = () => null;
const BookingDetail = () => null;

const Stack = createNativeStackNavigator();

export default function BookingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingScreen" component={BookingScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetail} />
    </Stack.Navigator>
  );
}
