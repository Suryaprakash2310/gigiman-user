import React, { useRef, useState, useEffect } from 'react';
import { SafeAreaView, View, StyleSheet, TextInput, Keyboard } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppCard from '../components/ui/AppCard';
import AppText from '../components/ui/AppText';
import AppButton from '../components/ui/AppButton';

const OtpScreen: React.FC = () => {
  const { theme, setMode } = useTheme();
  setMode && setMode('light');

  const navigation = useNavigation();
  const route = useRoute();
  // @ts-ignore
  const phone = route?.params?.phone || '';

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);
  const [resendTimer, setResendTimer] = useState<number>(0);

  const handleChange = (text: string, idx: number) => {
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[idx] = '';
      setDigits(next);
      return;
    }
    const char = cleaned.charAt(cleaned.length - 1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (idx < 3) inputs.current[idx + 1]?.focus();
    if (next.join('').length === 4) {
      Keyboard.dismiss();
    }
  };

  // Auto-focus first input on mount
  useEffect(() => {
    const t = setTimeout(() => {
      inputs.current[0]?.focus();
    }, 250);
    return () => clearTimeout(t);
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleResend = () => {
    if (resendTimer > 0) return;
    // placeholder: trigger resend API here
    setResendTimer(30);
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = digits.join('');
    if (code.length === 4) {
      // placeholder navigation
      // @ts-ignore
      navigation.navigate?.('Home');
    }
  };

  return (
    
      <View style={styles.wrapper}>
        {/* <AppCard style={[styles.card, { paddingVertical: 28, paddingHorizontal: 22, borderRadius: 16 }] }> */}
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
            {/* <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm }} /> */}

            <AppText weight="bold" size="h2" style={{ marginBottom: theme.spacing.xs }}>
              Enter OTP
            </AppText>
            <AppText color="textMuted" style={{ textAlign: 'center', marginBottom: theme.spacing.sm }}>
              We sent a 4 digit code to
            </AppText>
            <AppText weight="semibold" style={{ marginBottom: theme.spacing.md }}>{phone || 'your phone'}</AppText>
          </View>

          <View style={styles.otpRow}>
            {digits.map((d, i) => {
              const isFocused = focusedIdx === i;
              return (
                <TextInput
                  key={i}
                  ref={ref => { inputs.current[i] = ref; }}
                  value={d}
                  onFocus={() => setFocusedIdx(i)}
                  onBlur={() => setFocusedIdx(-1)}
                  onChangeText={t => handleChange(t, i)}
                  onKeyPress={e => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectionColor={theme.colors.primary}
                  style={[
                    styles.otpInput,
                    { backgroundColor: theme.colors.surface, borderColor: isFocused ? theme.colors.primary : theme.colors.border, color: theme.colors.text },
                    i !== digits.length - 1 ? { marginRight: 12 } : null,
                  ]}
                />
              );
            })}
          </View>

          <AppButton
            title="Verify"
            onPress={handleVerify}
            disabled={digits.join('').length !== 4}
            style={{ marginTop: theme.spacing.md, alignSelf: 'stretch', paddingVertical: 14, borderRadius: 12, opacity: digits.join('').length === 4 ? 1 : 0.6 }}
          />

          <View style={{ marginTop: theme.spacing.sm, alignItems: 'center' }}>
            <AppText color="textMuted">Didn't receive the code?</AppText>
            <AppText weight="semibold" color={resendTimer === 0 ? 'primary' : 'textMuted'} style={{ marginTop: 6 }} onPress={handleResend}>
              {resendTimer === 0 ? 'Resend Code' : `Resend in ${resendTimer}s`}
            </AppText>
          </View>
        {/* </AppCard> */}
      </View>
    
  );
};

export default OtpScreen;

const styles = StyleSheet.create({

  wrapper: { flex: 1, padding: 20, justifyContent: 'space-evenly', alignItems: 'center' },
  card: { width: '100%', maxWidth: 540, paddingVertical: 28 },
  otpRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  otpInput: { width: 64, height: 64, borderWidth: 1.6, borderRadius: 14, textAlign: 'center', fontSize: 22 },
});

