import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigation from './src/navigation/RootNavigation';
import { BookingProvider } from './src/context/BookingContext';
import { CartProvider } from './src/context/CartContext';
import { SocketProvider } from './src/socket/SocketProvider';
import { NotificationProvider } from './src/context/NotificationContext';
import { AlertProvider } from './src/context/AlertContext';

export default function App() {
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // 1. Request Notification Permission
        if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          console.log('Android POST_NOTIFICATIONS status:', granted);
        } else {
          const authStatus = await messaging().requestPermission();
          console.log('FCM Notification permission status:', authStatus);
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
      }

      try {
        // 2. Request Location Permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Location permission status:', status);
        
        if (status === 'granted') {
          // Trigger the native GPS/Location Accuracy enabler popup immediately on startup
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }).catch(() => {
            // Ignore error if user taps "No, thanks"
          });
        }
      } catch (err) {
        console.error('Failed to request location permission:', err);
      }
    };

    requestPermissions();

    // Foreground notification handler
    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      console.log('Foreground Push Notification Received:', remoteMessage);
    });
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <BookingProvider>
              <SocketProvider>
                <ThemeProvider>
                  <NotificationProvider>
                    <AlertProvider>
                      <RootNavigation />
                      <StatusBar style="auto" />
                    </AlertProvider>
                  </NotificationProvider>
                </ThemeProvider>
              </SocketProvider>
            </BookingProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
