import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { sendEmailOtpAPI, verifyEmailOtpAPI } from '@/src/api/email.api';
import { useTheme } from '@/src/theme/useTheme';
import AppButton from './AppButton';
import AppText from './AppText';
import OtpInput, { OtpInputRef } from './OtpInput';

interface Props {
  visible: boolean;
  email: string;
  /** Called after the OTP is successfully verified */
  onVerified: () => void;
  /** Called when the user dismisses the modal without verifying */
  onDismiss: () => void;
}

export default function EmailOtpModal({ visible, email, onVerified, onDismiss }: Props) {
  const { theme } = useTheme();
  const otpRef = useRef<OtpInputRef>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Verify ───────────────────────────────────────────────────────────────
  // Accepts an optional otp string (from onOtpComplete) or reads from ref (button tap)
  const handleVerify = useCallback(async (otpValue?: string) => {
    const otp = otpValue ?? otpRef.current?.getValue() ?? '';
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyEmailOtpAPI(email, otp);
      onVerified();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid or expired OTP. Please try again.';
      setError(msg);
      otpRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }, [email, onVerified]);

  // ─── Resend ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendLoading) return;
    setError(null);
    setResendLoading(true);
    try {
      await sendEmailOtpAPI(email);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to resend OTP. Please try again.';
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  // ─── Dismiss ──────────────────────────────────────────────────────────────
  const handleDismiss = () => {
    otpRef.current?.reset();
    setError(null);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      {/* Full-screen container */}
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Tap outside to dismiss keyboard & modal */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            handleDismiss();
          }}
        />

        {/* Bottom sheet */}
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: theme.colors.border }]} />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <AppText style={{ color: theme.colors.textMuted, fontSize: 22 }}>✕</AppText>
          </TouchableOpacity>

          {/* Header */}
          <AppText size="h3" weight="bold" style={[styles.title, { color: theme.colors.text }]}>
            Verify your email
          </AppText>

          <AppText size="body" style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            We've sent a 6-digit code to{' '}
            <AppText size="body" weight="semibold" style={{ color: theme.colors.primary }}>
              {email}
            </AppText>
          </AppText>

          {/* OTP Input — auto-verifies when all 6 digits are entered */}
          <View style={styles.otpWrapper}>
            <OtpInput
              ref={otpRef}
              otpLength={6}
              resendTime={60}
              onResend={handleResend}
              onOtpComplete={(otp) => handleVerify(otp)}
              onOtpChange={() => {
                if (error) setError(null);
              }}
            />
          </View>

          {/* Error message */}
          {error && (
            <AppText
              size="body"
              style={[styles.errorText, { color: theme.colors.danger ?? '#E53E3E' }]}
            >
              {error}
            </AppText>
          )}

          {/* Verify button */}
          <View style={styles.btnWrapper}>
            {loading ? (
              <ActivityIndicator color={theme.colors.primary} size="large" />
            ) : (
              <AppButton
                title="Verify & Save"
                onPress={handleVerify}
                style={{ backgroundColor: theme.colors.primary, width: '100%' }}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  title: {
    marginBottom: 8,
    marginTop: 4,
  },
  subtitle: {
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  otpWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  btnWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
});
