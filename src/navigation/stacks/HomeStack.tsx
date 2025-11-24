// src/navigation/stacks/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Placeholder screens
const HomeScreen = () => null;
const ServiceDetail = () => null;
const BookingFlow = () => null;

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetail} />
      <Stack.Screen name="BookingFlow" component={BookingFlow} />
    </Stack.Navigator>
  );
}
