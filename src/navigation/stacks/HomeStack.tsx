// src/navigation/stacks/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/src/screens/ProfilePage';
import BookingsScreen from '@/src/screens/BookingScreen';

import MainScreen from '@/src/screens/MainScreen';



const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={MainScreen} />

    </Stack.Navigator>
  );
}
