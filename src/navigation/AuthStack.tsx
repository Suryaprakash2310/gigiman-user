// src/navigation/AuthStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';


const Stack = createNativeStackNavigator();

// Temporary screen placeholders
const PhoneLogin = () => null;
const OTPVerify = () => null;
const Register = () => null;
const Onboarding = () => null;
const SetupProfile = () => null;

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneLogin" component={LoginScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerify} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="SetupProfile" component={SetupProfile} />
    </Stack.Navigator>
  );
}
