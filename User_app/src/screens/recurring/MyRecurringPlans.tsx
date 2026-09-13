// src/screens/recurring/MyRecurringPlans.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import RecurringHome from './RecurringHome';

// Aliasing MyRecurringPlans to RecurringHome since they perform the same function 
// of showcasing all active, paused, and upcoming recurring schedules.
export default function MyRecurringPlans() {
  return <RecurringHome />;
}
