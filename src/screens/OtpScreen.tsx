// OtpScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendOtpApi, verifyOtpApi } from "../api/auth";
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import AppText from '../components/ui/AppText';
import OtpInput, { OtpInputRef } from '../components/ui/OtpInput';
import { useAuthContext } from "../context/AuthContext";
import { useTheme } from '../theme/useTheme';

type OtpRouteParams = {
  phone?: string;
  otp?: string;
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
  const initialOtp = route?.params?.otp ?? '';

  const styles = createStyles(theme);

  /** OtpInput ref (correct way) */
  const otpRef = useRef<OtpInputRef>(null);

  useEffect(() => {
    if (initialOtp) {
      // Slight delay to allow the component to render before setting the value
      setTimeout(() => {
        otpRef.current?.setValue(String(initialOtp));
      }, 500); 
    }
  }, [initialOtp]);

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

  /** Called when resend pressed */
  const handleResend = () => {
    setLoading(true);
    setError(null);
    sendOtpApi(phone)
      .then(() => {
        otpRef.current?.reset();
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to resend OTP");
      })
      .finally(() => {
        setLoading(false);
      });
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
