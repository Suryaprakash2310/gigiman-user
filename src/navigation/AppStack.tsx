// src/navigation/BottomTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeStack from './stacks/HomeStack';
import ExploreStack from './stacks/ExploreStack';
import BookingStack from './stacks/BookingStack';
import WalletStack from './stacks/WalletStack';
import ProfileStack from './stacks/ProfileStack';

const Tab = createBottomTabNavigator();

export default function AppStack() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="ExploreTab" component={ExploreStack} />
      <Tab.Screen name="BookingTab" component={BookingStack} />
      <Tab.Screen name="WalletTab" component={WalletStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}

