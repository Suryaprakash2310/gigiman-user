import CartScreen from '@/src/screens/CartScreen';
import ScheduleBooking from '@/src/screens/ScheduleBooking';
import ServiceCategory from '@/src/screens/service/ServiceCategory';
import ServicesScreen from '@/src/screens/service/ServiceScreen';
import ServiceBookingScreen from '@/src/screens/ServiceBooking';
import SavedAddressesScreen from '@/src/screens/profile/SavedAddressesScreen';
import AddEditAddressScreen from '@/src/screens/profile/AddEditAddressScreen';
import MapPinLocationScreen from '@/src/screens/profile/MapPinLocationScreen';
import RecurringBooking from '@/src/screens/recurring/RecurringBooking';
import RecurringHome from '@/src/screens/recurring/RecurringHome';
import PlanDetails from '@/src/screens/recurring/PlanDetails';
import Success from '@/src/screens/recurring/Success';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

const Stack = createNativeStackNavigator<any>();

export type ServiceParamList = {
  MainServiceScreen: undefined;
  ServiceCategory: {serviceName: string; domainId?: string;}
  Booking: {
    serviceCategoryId: string;
    selectedAddress?: any;
    serviceData?: any;
    fromMain?: boolean;
    domainServiceId?: string;
  };
  ScheduleBooking: {
    serviceName: string;
  };
  CartScreen: undefined;
  SavedAddressesScreen: any;
  AddEditAddress: any;
  MapPinLocation: any;
  RecurringBooking: any;
  RecurringHome: any;
  PlanDetails: any;
  Success: any;
};


export default function ServiceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainServiceScreen" component={ServicesScreen} />
      <Stack.Screen name="ServiceCategory" component={ServiceCategory} />
      <Stack.Screen name="Booking" component={ServiceBookingScreen} />
      <Stack.Screen name="ScheduleBooking" component={ScheduleBooking} />
      <Stack.Screen name="CartScreen" component={CartScreen} />
      <Stack.Screen name="SavedAddressesScreen" component={SavedAddressesScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="Addresses" component={SavedAddressesScreen} />
      <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
      <Stack.Screen name="MapPinLocation" component={MapPinLocationScreen} />
      <Stack.Screen name="RecurringBooking" component={RecurringBooking} />
      <Stack.Screen name="RecurringHome" component={RecurringHome} />
      <Stack.Screen name="PlanDetails" component={PlanDetails} />
      <Stack.Screen name="Success" component={Success} />
    </Stack.Navigator>
  );
}
