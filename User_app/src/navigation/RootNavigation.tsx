// src/navigation/RootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DeviceEventEmitter } from 'react-native';
import { SplashScreen } from '../screens/SplashScreen';

import { useAuth } from '../hook/useAuth';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import GlobalBookingListener from '../socket/GlobalBookingListener';
import ServerErrorOverlay from '../components/ServerErrorOverlay';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const navigationRef = useNavigationContainerRef();
  const { user, isLoading } = useAuth();
  const [hasServerError, setServerError] = useState(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('SERVER_ERROR_500', () => {
      setServerError(true);
    });
    return () => sub.remove();
  }, []);

  // 🔄 Splash / restore
  if (isLoading) {
    return <SplashScreen />;
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
      <ServerErrorOverlay
        visible={hasServerError}
        onDismiss={() => {
          setServerError(false);
          (navigationRef.current as any)?.navigate("AppStack", { screen: "HomeTab" });
        }}
      />
    </NavigationContainer>
  );
}
