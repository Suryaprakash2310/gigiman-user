// PhoneNumScreen.tsx
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { auth } from "../../firebase_integration";
import { signInWithPhoneNumber } from "firebase/auth";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sendOtpApi } from "../api/auth";
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppText from '../components/ui/AppText';
import { useTheme } from '../theme/useTheme';

const PhoneNumScreen: React.FC = () => {
  const { theme, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const styles = createStyles(theme);
  const [phone, setPhone] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifier = useRef(null);



  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    setIsValid(digits.length === 10);
  };

  const handleContinue = async () => {
    // if (!isValid || loading) return;

    try {
      setLoading(true);
      setError(null);
      await sendOtpApi(phone); // optional init/logging
      
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        recaptchaVerifier.current
      );
      
      navigation.navigate("OtpScreen", { phone, confirmation });
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: theme.colors.surface }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={auth.app.options}
        />
        {/* HEADER */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <MaterialIcons
              name="phone-android"
              size={28}
              color={theme.colors.primary}
            />
          </View>

          <AppText
            weight="bold"
            size="h2"
            style={{
              paddingTop: theme.spacing.sm,

              color: theme.colors.primary
            }}
          >
            Get Started
          </AppText>

          <AppText
            color="textMuted"
            size='h3'
            style={{
              paddingTop: theme.spacing.xs,

              color: theme.colors.text
              //textAlign: 'center',
              // marginHorizontal: theme.spacing.lg,
            }}
          >
            Enter your mobile number to continue with GigiMan.
          </AppText>
        </View>

        {/* FORM CARD */}
        <AppCard
          style={{
            //padding: theme.spacing.lg,
            //marginHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.lg,
            //alignItems:'flex-start'
          }}
        >
          <AppText
            weight="semibold"
            size="small"
            style={{ color: theme.colors.textMuted }}
          >
            Mobile Number
          </AppText>

          <View style={styles.phoneRow}>
            {/* Country code – later can become dropdown */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.codeBox,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <AppText weight="semibold">+91</AppText>
            </TouchableOpacity>

            {/* Phone input */}
            <TextInput
              placeholder="10-digit mobile number"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              value={phone}
              onChangeText={handlePhoneChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={10}
              style={[
                styles.phoneInput,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: isFocused
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            />
          </View>

          <AppText
            color={isValid ? 'textMuted' : 'danger'}
            style={{ marginTop: theme.spacing.sm }}
          >
            {isValid
              ? 'Looks good. We’ll send an OTP to this number.'
              : 'Enter a valid 10-digit mobile number.'}
          </AppText>
          {error && (
            <AppText color="danger" style={{ marginTop: theme.spacing.sm }}>
              {error}
            </AppText>
          )}

        </AppCard>

        <View style={{ flex: 1 }} />

        {/* BOTTOM ACTION */}
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: insets.bottom + theme.spacing.lg,
          }}
        >
          <AppButton
            title={loading ? "Sending OTP..." : "Continue"}
            onPress={handleContinue}
            disabled={!isValid || loading}
          />
        </View>
      </KeyboardAvoidingView>
    </View >
  );
};

export default PhoneNumScreen;

const createStyles = (theme: any) => StyleSheet.create({
  safe: {
    //flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 16

  },
  header: {
    alignItems: 'flex-start',
    paddingTop: 32,
    paddingBottom: 24,
    gap: 4
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  codeBox: {
    width: 72,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});
