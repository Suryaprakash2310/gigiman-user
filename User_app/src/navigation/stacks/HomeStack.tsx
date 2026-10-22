// src/navigation/stacks/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import MainScreen from '@/src/screens/MainScreen';
import NotificationScreen from '@/src/screens/NotificationScreen';
import ResumeBar from '@/src/components/ResumeBar';
import SavedAddressesScreen from '@/src/screens/profile/SavedAddressesScreen';
import AddEditAddressScreen from '@/src/screens/profile/AddEditAddressScreen';
import MapPinLocationScreen from '@/src/screens/profile/MapPinLocationScreen';
import RecurringStack from './RecurringStack';


const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={MainScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="RecurringPlans" component={RecurringStack} />
        <Stack.Screen name="SavedAddressesScreen" component={SavedAddressesScreen} />
        <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
        <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
        <Stack.Screen name="MapPinLocation" component={MapPinLocationScreen} />
      </Stack.Navigator>
      <ResumeBar />
    </>
  );
}

