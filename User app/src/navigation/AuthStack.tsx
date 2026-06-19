// src/navigation/AuthStack.tsx
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/useTheme';
import { useAuthContext } from '../context/AuthContext';

import PhoneNumScreen from '../screens/PhoneNumScreen';
import OtpScreen from '../screens/OtpScreen';
import SetupProfileScreen from '../screens/onboarding/SetUpProfileScreen';
import AddressScreen from '../screens/onboarding/AddressScreen';
import OnboardSlider from '../screens/OnboardSlider';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const { setMode } = useTheme();
  const { user } = useAuthContext();

  useEffect(() => {
    setMode?.('light');
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* 🔐 Not logged in */}
      {!user && (
        <>
          <Stack.Screen name="OnboardingFlow" component={OnboardSlider} />
          <Stack.Screen name="PhoneLogin" component={PhoneNumScreen} />
          <Stack.Screen name="OtpScreen" component={OtpScreen} />
        </>
      )}

      {/* 🧭 Logged in but profile incomplete */}
      {user && !user.isVerified && (
        <>
          <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
          {/* <Stack.Screen name="AddressScreen" component={AddressScreen} /> */}
        </>
      )}

    </Stack.Navigator>
  );
}
