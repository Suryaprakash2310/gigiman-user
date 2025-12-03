// src/navigation/AuthStack.tsx
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/useTheme';
import PhoneNumScreen from '../screens/PhoneNumScreen';
import SetupProfileScreen from '../screens/onboarding/SetUpProfileScreen';
import AddressScreen from '../screens/onboarding/AddressScreen';
import OtpScreen from '../screens/OtpScreen';



const Stack = createNativeStackNavigator();




export default function AuthStack() {
  const { setMode } = useTheme();
   useEffect(() => {
      setMode?.('light');
    }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneLogin" component={PhoneNumScreen} />
      <Stack.Screen name="OtpScreen" component={OtpScreen} />
      <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
      <Stack.Screen name="AddressScreen" component={AddressScreen} />
      {/* <Stack.Screen name="SetupProfile" component={SetupProfile} /> */}
    </Stack.Navigator>
  );
}
