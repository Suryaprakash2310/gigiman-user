// src/navigation/BottomTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTabBar from '../components/ui/CustomTabBar';
import { useTheme } from '../theme/useTheme';
import BookingStack from './stacks/BookingStack';
import HomeStack from './stacks/HomeStack';
import ProfileStack from './stacks/ProfileStack';
import ServiceStack from './stacks/ServiceStack';

export type AppTabsParamList = {
  HomeTab: undefined;
  ServiceTab: undefined;
  BookingTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export default function AppStack() {
  const { setMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    setMode?.('light');
  }, []);
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false, tabBarStyle: {
        height: 65 + insets.bottom,
        paddingBottom: insets.bottom + 8,
        paddingTop: 12,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 0,
        elevation: 10,
      },
    }}
      tabBar={(props) => <CustomTabBar {...props} />} >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="ServiceTab" component={ServiceStack} />
      <Tab.Screen name="BookingTab" component={BookingStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}



