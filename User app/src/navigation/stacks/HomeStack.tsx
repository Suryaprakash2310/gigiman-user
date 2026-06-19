// src/navigation/stacks/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import MainScreen from '@/src/screens/MainScreen';
import NotificationScreen from '@/src/screens/NotificationScreen';
import ResumeBar from '@/src/components/ResumeBar';



const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={MainScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
      </Stack.Navigator>
      <ResumeBar />
    </>
  );
}
