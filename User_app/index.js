globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import App from './App';

// Register background handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);
});

registerRootComponent(App);