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
import { getAuth, signInWithPhoneNumber, signOut } from '@react-native-firebase/auth';
import { verifyOtpApi } from "../api/auth";
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import AppText from '../components/ui/AppText';
import OtpInput, { OtpInputRef } from '../components/ui/OtpInput';
import { useAuthContext } from "../context/AuthContext";
import { useTheme } from '../theme/useTheme';
import { getConfirmationResult, setConfirmationResult } from '../utils/authSession';

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
  const [confirmation, setConfirmation] = useState<any>(() => getConfirmationResult());

  const styles = createStyles(theme);

  /** OtpInput ref (correct way) */
  const otpRef = useRef<OtpInputRef>(null);
  const isConfirming = useRef(false);

  const handleOtpComplete = async (otp: string) => {
    if (isConfirming.current) return;
    isConfirming.current = true;
    try {
      setLoading(true);
      setError(null);

      const activeConfirmation = confirmation || getConfirmationResult();
      console.log("Confirmation:", activeConfirmation);
      console.log("OTP:", otp);

      if (!activeConfirmation) {
        throw new Error("Verification session has expired. Please tap 'Resend' to get a new code.");
      }

      console.log("Verification ID:", (activeConfirmation as any)._verificationId);
      console.log("Current User:", getAuth().currentUser);
      const userCredential = await activeConfirmation.confirm(otp);
      console.log("UID:", userCredential.user.uid);

      const firebaseToken = await userCredential.user.getIdToken();
      if (!firebaseToken) {
        throw new Error("Failed to get Firebase token.");
      }

      // 3. Call backend /verify-otp with firebaseToken
      const res = await verifyOtpApi(phone, firebaseToken);
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
          isVerified: true,
        },
        accessToken: data.token,
      });

    } catch (err: any) {
      console.log("OTP Verification error:", err);
      let friendlyMessage = "Invalid OTP. Please check and try again.";
      if (err.code === 'auth/session-expired' || err.code === 'auth/code-expired') {
        friendlyMessage = "The verification code has expired. Please tap 'Resend' to get a new code.";
      } else if (err.code === 'auth/invalid-verification-code') {
        friendlyMessage = "The code you entered is incorrect. Please try again.";
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = "Too many attempts. Please try again later.";
      } else if (err.message) {
        friendlyMessage = err.message.replace(/\[auth\/.*?\]\s*/g, '');
      }
      setError(friendlyMessage);
      if (err.code === 'auth/session-expired' || err.code === 'auth/code-expired' || err.code === 'auth/invalid-verification-code') {
        otpRef.current?.reset();
      }
    } finally {
      setLoading(false);
      isConfirming.current = false;
    }
  };

  /** Called when resend pressed */
  const handleResend = async () => {
    if (loading || isConfirming.current) return;
    setLoading(true);
    setError(null);
    try {
      const authInstance = getAuth();
      await signOut(authInstance);
      const newConfirmation = await signInWithPhoneNumber(authInstance, `+91${phone}`);
      setConfirmation(newConfirmation);
      setConfirmationResult(newConfirmation);
      otpRef.current?.reset();
    } catch (err: any) {
      console.log("OTP Resend error:", err);
      let friendlyMessage = "Failed to resend OTP. Please try again.";
      if (err.code === 'auth/too-many-requests') {
        friendlyMessage = "Too many attempts. Please try again later.";
      } else if (err.message) {
        friendlyMessage = err.message.replace(/\[auth\/.*?\]\s*/g, '');
      }
      setError(friendlyMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPress = () => {
    if (loading || isConfirming.current) return;
    const enteredOtp = otpRef.current?.getValue() || '';
    if (enteredOtp.length === 6) {
      handleOtpComplete(enteredOtp);
    } else {
      setError("Please enter the complete 6-digit code.");
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <AppHeader showBack={true} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={getAuth().app.options}
        /> */}

        {/* TOP SECTION */}
        <View style={styles.content}>
          <AppText weight="bold" size="h2">Enter OTP</AppText>

          <AppText color="textMuted" style={{ marginTop: theme.spacing.xs }}>
            We have sent a 6-digit code to
          </AppText>

          <AppText weight="semibold" style={{ marginTop: theme.spacing.xs }}>
            {phone}
          </AppText>

          {/* New clean reusable OTP component */}
          <View style={{ marginTop: theme.spacing.lg }}>
            <OtpInput
              ref={otpRef}
              otpLength={6}
              resendTime={60}
              onResend={handleResend}
              onOtpChange={() => {
                if (error) setError(null);
              }}
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
            onPress={handleVerifyPress}
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
