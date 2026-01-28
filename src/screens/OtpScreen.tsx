// OtpScreen.tsx
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { verifyOtpApi } from "../api/auth";
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import AppText from '../components/ui/AppText';
import OtpInput, { OtpInputRef } from '../components/ui/OtpInput';
import { useAuthContext } from "../context/AuthContext";
import { useTheme } from '../theme/useTheme';

type OtpRouteParams = {
  phone?: string;
};

const OtpScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { login } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const route =
    useRoute<RouteProp<Record<string, OtpRouteParams>, string>>();

  const phone = route?.params?.phone ?? '';

  const styles = createStyles(theme);

  /** OtpInput ref (correct way) */
  const otpRef = useRef<OtpInputRef>(null);

  /** Called when OTP fully typed */
  // const handleOtpComplete = async(otp: string) => {
  //   console.log("OTP entered:", otp);

  //   // TODO → Call your backend verify API here
  //     // 1️⃣ Mock backend response for now
  // const mockResponse = {
  //     user: {
  //       id: "12345",
  //       phone,
  //       name: "",           // empty → new user
  //     },
  //     accessToken: "mock_access",
  //     refreshToken: "mock_refresh",
  //     isNewUser: false,      // backend sends this normally
  //     hasAddress: false,
  // };

  // // 2️⃣ Store user + tokens securely
  // await login({
  //   user: mockResponse.user,
  //   accessToken: mockResponse.accessToken,
  //   refreshToken: mockResponse.refreshToken,
  // });

  // // 3️⃣ Continue onboarding flow
  // if (mockResponse.isNewUser || !mockResponse.user.name) {
  //   navigation.replace("SetupProfile");
  // } 
  // else if (!mockResponse.hasAddress) {
  //   navigation.replace("AddressScreen");
  // } 
  // else {
  //   navigation.reset({ index: 0, routes: [{ name: "HomeTab" }] });
  // }


  //   // navigation.reset({
  //   //   index: 0,
  //   //   routes: [{ name: 'SetupProfile' }],
  //   // });
  // };
  // const handleOtpComplete = async (otp: any) => {
  //   try {
  //     setLoading(true);
  //     setError(null);

  //     const res = await verifyOtpApi(phone, otp);
  //     console.log("verifyOtpApi response:", res);

  const handleOtpComplete = async (otp: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await verifyOtpApi(phone, otp);
      const data = res.data;

      // 🟡 NEW USER
      if (data.next === "COMPLETE_PROFILE") {
        await login({
          user: {
            _id: "temp",
            phone,
            profileCompleted: false,
          },
          accessToken: data.tempToken, // 👈 VERY IMPORTANT
        });
        return;
      }

      // 🟢 EXISTING USER
      await login({
        user: {
          ...data.user,
          profileCompleted: true,
        },
        accessToken: data.token,
      });

    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid OTP");
      otpRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };




  //const { token, user } = res.data;

  // await login({
  //   user: {
  //     id: user._id,
  //     phone: user.phoneMasked,
  //     name: user.fullName,
  //   },
  //   accessToken: token,
  //   refreshToken: token, // same for now
  // });
  // // Navigation decision
  // if (!user.fullName) {
  //   navigation.replace("SetupProfile");
  // } else if (!user.address) {
  //   navigation.replace("AddressScreen");
  // } else {
  //   navigation.reset({
  //     index: 0,
  //     routes: [{ name: "HomeTab" }],
  //   });
  // }
  //   } catch (err: any) {
  //     setError(err?.response?.data?.message || "Invalid OTP");
  //     console.error("OTP error:", err?.message, err?.response?.data);
  //     otpRef.current?.reset();
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  /** Called when resend pressed */
  const handleResend = () => {
    console.log("Resend pressed");

    // TODO: Call resend API

    // Reset fields visually
    otpRef.current?.reset();
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <AppHeader showBack={true} />
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
          {error && (
            <AppText color="danger" style={{ marginTop: 12 }}>
              {error}
            </AppText>
          )}

        </View>

        {/* FIXED BOTTOM BUTTON */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + theme.spacing.xxl,
          }}
        >
          <AppButton
            title={loading ? "Verifying..." : "Verify"}
            onPress={() => otpRef.current?.focus()}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default OtpScreen;

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'space-between',
      paddingTop: 0, // We will handle this in render
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: theme.spacing.xl, // Keep existing padding or add strict top padding? 
      // User asked for padding for status bar. 
      // But styles.content is for the middle content? 
      // No, let's look at the structure. 
      // <AppHeader> is outside content.
      // So we need padding on the ROOT container or wrap AppHeader.
    },
  });
