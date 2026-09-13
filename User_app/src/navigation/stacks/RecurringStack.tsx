// src/navigation/stacks/RecurringStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RecurringHome from '../../screens/recurring/RecurringHome';
import ChooseService from '../../screens/recurring/ChooseService';
import ChooseFrequency from '../../screens/recurring/ChooseFrequency';
import SetupSchedule from '../../screens/recurring/SetupSchedule';
import CleanerPreference from '../../screens/recurring/CleanerPreference';
import Payment from '../../screens/recurring/Payment';
import Review from '../../screens/recurring/Review';
import Success from '../../screens/recurring/Success';
import MyRecurringPlans from '../../screens/recurring/MyRecurringPlans';
import PlanDetails from '../../screens/recurring/PlanDetails';
import RecurringBooking from '../../screens/recurring/RecurringBooking';

export type RecurringStackParamList = {
  RecurringHome: undefined;
  ChooseService: { editPlanId?: string } | undefined;
  ChooseFrequency: { editPlanId?: string } | undefined;
  SetupSchedule: { editPlanId?: string } | undefined;
  CleanerPreference: { editPlanId?: string } | undefined;
  Payment: { editPlanId?: string } | undefined;
  Review: { editPlanId?: string } | undefined;
  Success: { isEdit: boolean } | undefined;
  MyRecurringPlans: undefined;
  PlanDetails: { planId: string };
  RecurringBooking: { editPlanId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RecurringStackParamList>();

export default function RecurringStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecurringHome" component={RecurringHome} />
      <Stack.Screen name="ChooseService" component={ChooseService} />
      <Stack.Screen name="ChooseFrequency" component={ChooseFrequency} />
      <Stack.Screen name="SetupSchedule" component={SetupSchedule} />
      <Stack.Screen name="CleanerPreference" component={CleanerPreference} />
      <Stack.Screen name="Payment" component={Payment} />
      <Stack.Screen name="Review" component={Review} />
      <Stack.Screen name="Success" component={Success} />
      <Stack.Screen name="MyRecurringPlans" component={MyRecurringPlans} />
      <Stack.Screen name="PlanDetails" component={PlanDetails} />
      <Stack.Screen name="RecurringBooking" component={RecurringBooking} />
    </Stack.Navigator>
  );
}
