// src/navigation/stacks/ProfileStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/src/screens/profile/ProfilePage';
import PaymentHistoryPage from '@/src/screens/PaymentHistoryPage';
import PersonalDetailsPage from '@/src/screens/PersonalDetailsPages';
import HelpCenterPage from '@/src/screens/HelpCenterPage';
import SavedAddressesScreen from '@/src/screens/profile/SavedAddressesScreen';
import MyBookingsScreen from '@/src/screens/profile/MyBookingScreen';
import AboutPage from '@/src/screens/AboutPage';
import TermsAndConditionsPage from '@/src/screens/TermsAndConditionsPage';
import AddEditAddressScreen from '@/src/screens/profile/AddEditAddressScreen';
import MapPinLocationScreen from '@/src/screens/profile/MapPinLocationScreen';
import CreateTicketScreen from '@/src/screens/CreateTicketScreen';
import SupportTicketsScreen from '@/src/screens/SupportTicketsScreen';
import TicketDetailScreen from '@/src/screens/TicketDetailScreen';
import InviteReferralScreen from '@/src/screens/profile/InviteReferralScreen';

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
       <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="AboutPage" component={AboutPage} />
      <Stack.Screen name="TermsAndConditionsPage" component={TermsAndConditionsPage} />
      <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
      <Stack.Screen name="MapPinLocation" component={MapPinLocationScreen} />
      <Stack.Screen name="CreateTicketScreen" component={CreateTicketScreen} />
      <Stack.Screen name="SupportTicketsScreen" component={SupportTicketsScreen} />
      <Stack.Screen name="TicketDetailScreen" component={TicketDetailScreen} />
      <Stack.Screen name="InviteReferralScreen" component={InviteReferralScreen} />
    </Stack.Navigator>
  );
}
