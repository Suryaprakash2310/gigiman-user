// OtpScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppText from '../components/ui/AppText';
import AppButton from '../components/ui/AppButton';

type OtpRouteParams = {
  phone?: string;
};

const OtpScreen: React.FC = () => {
  const { theme, setMode } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const route =
    useRoute<RouteProp<Record<string, OtpRouteParams>, string>>();
  const phone = route?.params?.phone ?? '';

  const styles = createStyles(theme);

  const [digits, setDigits] = useState(['', '', '', '']);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<Array<TextInput | null>>([]);

  // Lock to light mode for Auth
  useEffect(() => {
    setMode?.('light');
  }, []);

  // Focus first input on mount
  useEffect(() => {
    const t = setTimeout(() => {
      inputs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(t);
  }, []);

  // Countdown for "resend"
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  /** Handle number typing */
  const handleChange = (txt: string, idx: number) => {
    const cleaned = txt.replace(/\D/g, '');

    if (!cleaned) {
      const next = [...digits];
      next[idx] = '';
      setDigits(next);
      return;
    }

    const char = cleaned[cleaned.length - 1];
    const next = [...digits];
    next[idx] = char;
    setDigits(next);

    if (idx < 3) {
      inputs.current[idx + 1]?.focus();
      setFocusedIdx(idx + 1);
    } else {
      setFocusedIdx(idx);
      Keyboard.dismiss();
    }
  };

  /** Handle backspace between boxes */
  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
      setFocusedIdx(idx - 1);
    }
  };

  /** Verification logic */
  const handleVerify = () => {
    const code = digits.join('');
    if (code.length !== 4) return;

    // TODO: Call backend verify OTP API

    navigation.reset({
      index: 0,
      routes: [{ name: 'SetupProfile' }],
    });
  };

  /** Resend OTP */
  const handleResend = () => {
    if (resendTimer > 0) return;

    // TODO: Call resend OTP API
    setResendTimer(30);
  };

  const codeComplete = digits.join('').length === 4;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      {/* TOP CONTENT */}
      <View style={styles.content}>
        <View style={{ marginBottom: theme.spacing.lg }}>
          <AppText weight="bold" size="h2">
            Enter OTP
          </AppText>

          <AppText
            color="textMuted"
            style={{ marginTop: theme.spacing.xs }}
          >
            We have sent a 4-digit code to
          </AppText>

          <AppText
            weight="semibold"
            style={{ marginTop: theme.spacing.xs }}
          >
            {phone}
          </AppText>
        </View>

        {/* OTP INPUTS */}
        <View style={styles.otpRow}>
          {digits.map((d, i) => {
            const isFocused = focusedIdx === i;

            return (
              <TextInput
                key={i}
                //ref={(ref) => (inputs.current[i] = ref)}
                value={d}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(t) => handleChange(t, i)}
                onFocus={() => setFocusedIdx(i)}
                onBlur={() => setFocusedIdx(-1)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                selectionColor={theme.colors.primary}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isFocused
                      ? theme.colors.primary
                      : theme.colors.border,
                    color: theme.colors.text,
                  },
                  i < 3 ? { marginRight: 12 } : null,
                ]}
              />
            );
          })}
          
        </View>
        <View style={{ marginTop: theme.spacing.md ,flexDirection: 'row'}}>
          <AppText color="textMuted">Didn't receive the code?</AppText>

          <AppText
            weight="semibold"
            color={resendTimer === 0 ? 'primary' : 'textMuted'}
            //style={{ marginTop: theme.spacing.xs }}
            onPress={handleResend}
          >
            {resendTimer === 0
              ? ' Resend Code'
              : ` Resend in ${resendTimer}s`}
          </AppText>
        </View>
      </View>

      {/* FIXED BOTTOM SECTION */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + theme.spacing.xxl,
        }}
      >
        <AppButton
          title="Verify"
          onPress={handleVerify}
          disabled={!codeComplete}
          style={{ marginTop: theme.spacing.lg }}
        />

        {/* <View style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
          <AppText color="textMuted">Didn't receive the code?</AppText>

          <AppText
            weight="semibold"
            color={resendTimer === 0 ? 'primary' : 'textMuted'}
            style={{ marginTop: theme.spacing.xs }}
            onPress={handleResend}
          >
            {resendTimer === 0
              ? 'Resend Code'
              : `Resend in ${resendTimer}s`}
          </AppText>
        </View> */}
      </View>
    </KeyboardAvoidingView>
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
    otpRow: {
      flexDirection: 'row',
      marginTop: theme.spacing.md,
    },
    otpInput: {
      width: 56,
      height: 56,
      borderWidth: 1.5,
      borderRadius: 14,
      textAlign: 'center',
      fontSize: 22,
    },
  });
