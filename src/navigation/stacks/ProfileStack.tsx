// src/navigation/stacks/ProfileStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/src/screens/ProfilePage';
import PersonalDetailsScreen from '@/src/screens/profile/PersonalDetailScreen';

// Placeholder

const EditProfile = () => null;
const Settings = () => null;
const Addresses = () => null;

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={PersonalDetailsScreen} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="Addresses" component={Addresses} />
    </Stack.Navigator>
  );
}
