// OtpScreen.tsx
import React, { useRef } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../theme/useTheme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from "../context/AuthContext";
import AppText from '../components/ui/AppText';
import AppButton from '../components/ui/AppButton';
import OtpInput, { OtpInputRef } from '../components/ui/OtpInput';
import AppHeader from '../components/ui/AppHeader';

type OtpRouteParams = {
  phone?: string;
};

const OtpScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { login } = useAuthContext();

  const route =
    useRoute<RouteProp<Record<string, OtpRouteParams>, string>>();

  const phone = route?.params?.phone ?? '';

  const styles = createStyles(theme);

  /** OtpInput ref (correct way) */
  const otpRef = useRef<OtpInputRef>(null);

  /** Called when OTP fully typed */
  const handleOtpComplete = async(otp: string) => {
    console.log("OTP entered:", otp);

    // TODO → Call your backend verify API here
      // 1️⃣ Mock backend response for now
  const mockResponse = {
      user: {
        id: "12345",
        phone,
        name: "",           // empty → new user
      },
      accessToken: "mock_access",
      refreshToken: "mock_refresh",
      isNewUser: false,      // backend sends this normally
      hasAddress: false,
  };

  // 2️⃣ Store user + tokens securely
  await login({
    user: mockResponse.user,
    accessToken: mockResponse.accessToken,
    refreshToken: mockResponse.refreshToken,
  });

  // 3️⃣ Continue onboarding flow
  if (mockResponse.isNewUser || !mockResponse.user.name) {
    navigation.replace("SetupProfile");
  } 
  else if (!mockResponse.hasAddress) {
    navigation.replace("AddressScreen");
  } 
  else {
    navigation.reset({ index: 0, routes: [{ name: "HomeTab" }] });
  }


    // navigation.reset({
    //   index: 0,
    //   routes: [{ name: 'SetupProfile' }],
    // });
  };

  /** Called when resend pressed */
  const handleResend = () => {
    console.log("Resend pressed");

    // TODO: Call resend API

    // Reset fields visually
    otpRef.current?.reset();
  };

  return (
    <>
    <AppHeader showBack={true}/>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      
      {/* TOP SECTION */}
      <View style={styles.content}>
        <AppText weight="bold" size="h2">Enter OTP</AppText>

        <AppText color="textMuted" style={{ marginTop: theme.spacing.xs }}>
          We have sent a 4-digit code to
        </AppText>

        <AppText weight="semibold" style={{ marginTop: theme.spacing.xs }}>
          {phone}
        </AppText>

        {/* New clean reusable OTP component */}
        <View style={{ marginTop: theme.spacing.lg }}>
          <OtpInput
            ref={otpRef}
            otpLength={4}
            resendTime={30}
            onOtpComplete={handleOtpComplete}
            onResend={handleResend}
          />
        </View>
      </View>

      {/* FIXED BOTTOM BUTTON */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + theme.spacing.xxl,
        }}
      >
        <AppButton
          title="Verify"
          onPress={() => otpRef.current?.focus()} // Focus otp if user taps verify
        />
      </View>
    </KeyboardAvoidingView>
    </>
  );
};

export default OtpScreen;

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'space-between',
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: theme.spacing.xl,
    },
  });
