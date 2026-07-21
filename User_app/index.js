import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import App from './App';

// Background push notification listener
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background Push Notification Received:', remoteMessage);
});

registerRootComponent(App);

