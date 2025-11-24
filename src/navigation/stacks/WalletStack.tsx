// src/navigation/stacks/WalletStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Placeholder
const WalletScreen = () => null;
const AddMoney = () => null;
const TransactionDetail = () => null;

const Stack = createNativeStackNavigator();

export default function WalletStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletScreen" component={WalletScreen} />
      <Stack.Screen name="AddMoney" component={AddMoney} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetail} />
    </Stack.Navigator>
  );
}
