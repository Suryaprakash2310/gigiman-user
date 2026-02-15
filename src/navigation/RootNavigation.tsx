// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../hook/useAuth';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import GlobalBookingListener from '../socket/GlobalBookingListener';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const navigationRef = useNavigationContainerRef();
  const { user, isLoading } = useAuth();

  // 🔄 Splash / restore
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /**
   * AUTH RULES (FINAL)
   * 1. No user           → AuthStack
   * 2. User + profile ❌ → AuthStack (CompleteProfile)
   * 3. User + profile ✅ → AppStack
   */

  const isProfileCompleted = user?.isVerified === true;

  return (
    <NavigationContainer ref={navigationRef}>
      <GlobalBookingListener />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isProfileCompleted ? (
          <Stack.Screen name="AppStack" component={AppStack} />
        ) : (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        )}
      </Stack.Navigator>
      
    </NavigationContainer>
  );
}
