// src/navigation/stacks/ProfileStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/src/screens/ProfilePage';
import PaymentHistoryPage from '@/src/screens/PaymentHistoryPage';
import PersonalDetailsPage from '@/src/screens/PersonalDetailsPages';
import HelpCenterPage from '@/src/screens/HelpCenterPage';
import SavedAddressesScreen from '@/src/screens/profile/SavedAddressesScreen';

// Placeholder


const Settings = () => null;
const Addresses = () => null;

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="PersonalDetailsPage" component={PersonalDetailsPage} />
      <Stack.Screen name="PaymentHistoryPage" component={PaymentHistoryPage} />
      <Stack.Screen name="HelpCenterPage" component={HelpCenterPage} />
       <Stack.Screen name="SavedAddressesScreen" component={SavedAddressesScreen} />
    </Stack.Navigator>
  );
}
