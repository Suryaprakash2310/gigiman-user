// PhoneNumScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppCard from '../components/ui/AppCard';
import AppText from '../components/ui/AppText';
import { useTheme } from '../theme/useTheme';

const { width, height } = Dimensions.get('window');
const wp = (p: number) => width * (p / 100);
const hp = (p: number) => height * (p / 100);

/**
 * Small premium button component:
 * - gradient background
 * - icon + text
 * - shadow / elevation
 */
const PremiumButton: React.FC<{
  title: string;
  onPress: () => void;
  disabled?: boolean;
}> = ({ title, onPress, disabled }) => {
  const { theme } = useTheme();
  const bgColor = disabled ? '#9AA0A6' : theme.colors.primary;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.pbtnTouchable, disabled && { opacity: 0.65 }]}
    >
      <View style={[styles.pbtnGradient, { backgroundColor: bgColor }] }>
        <View style={styles.pbtnContent}>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.pbtnText}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PhoneNumScreen: React.FC = () => {
  const { theme, setMode } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setMode && setMode('light');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [phone, setPhone] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    setIsValid(digits.length === 10);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      {/* Soft background fill (gradient removed to avoid extra dependency) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
      >
        {/* Decorative circles (subtle, blurred feel via low opacity) */}
        <View style={styles.decorative} pointerEvents="none">
          <View style={[styles.circleLarge, { backgroundColor: theme.colors.primary }]} />
          <View style={[styles.circleSmall, { backgroundColor: theme.colors.accent }]} />
          <View style={[styles.circleXSmall, { backgroundColor: theme.colors.primary }]} />
        </View>

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.iconBg, { backgroundColor: theme.colors.surface }]}>
            <MaterialIcons name="phone-android" size={28} color={theme.colors.primary} />
          </View>

          <AppText weight="bold" size="h2" style={{ marginTop: hp(1.6), letterSpacing: 0.2 }}>
            Get Started
          </AppText>

          <AppText color="textMuted" style={{ lineHeight: 20, marginTop: hp(0.5), textAlign: 'center', maxWidth: wp(80) }}>
            Enter your phone number to continue
          </AppText>
        </View>

        {/* Glass-like elevated card */}
        <AppCard style={[styles.card, {
          padding: wp(4.5),
          borderRadius: 18,
          backgroundColor: theme.colors.surface + 'f0', // slight transparency
        }]}>
          <View style={styles.inputLabelRow}>
            <AppText weight="semibold" size="small" style={{ color: theme.colors.textMuted }}>
              Mobile Number
            </AppText>
            <AppText size="caption" color="textMuted"> — secure & private</AppText>
          </View>

          <View style={[styles.phoneRow, { marginTop: hp(1.2) }]}>
            <Pressable
              style={[
                styles.codeBox,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            >
              <AppText weight="semibold" style={{ color: theme.colors.text }}>
                +91
              </AppText>
            </Pressable>

            <TextInput
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              value={phone}
              onChangeText={handlePhoneChange}
              maxLength={10}
              style={[
                styles.nativeInput,
                { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            />
          </View>

          {/* subtle hint / validation text */}
          <View style={{ marginTop: hp(1) }}>
            <AppText  color={isValid ? 'textMuted' : 'danger'} style={{ opacity: 0.8 }}>
              {isValid ? 'Ready to continue' : 'Enter a 10-digit phone number'}
            </AppText>
          </View>
        </AppCard>

        {/* This spacer pushes content up so card doesn't clash with bottom button */}
        <View style={{ flex: 1 }} />

        {/* Bottom button container (above safe area) */}
        <View style={[
          styles.bottomContainer,
          { paddingBottom: insets.bottom + 18 } // keep it above safe area + a gap
        ]}>
          <PremiumButton
            title="Continue"
            onPress={() => {
              /* placeholder action */
            }}
            disabled={!isValid}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PhoneNumScreen;

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
  },

  decorative: {
    position: 'absolute',
    top: -hp(10),
    right: -wp(10),
    zIndex: 0,
  },

  circleLarge: {
    width: wp(68),
    height: wp(68),
    borderRadius: wp(34),
    opacity: 0.14,
  },

  circleSmall: {
    position: 'absolute',
    right: wp(12),
    top: hp(10),
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    opacity: 0.08,
  },

  circleXSmall: {
    position: 'absolute',
    right: wp(28),
    top: hp(6),
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    opacity: 0.06,
  },

  headerSection: {
    marginBottom: hp(2.8),
    alignItems: 'center',
    zIndex: 1,
  },

  iconBg: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(5),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 6,
  },

  card: {
    alignSelf: 'stretch',
    zIndex: 2,
    borderRadius: 18,
    // elevated glass-like shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
  },

  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  codeBox: {
    width: wp(18),
    height: hp(6.6),
    borderWidth: 1.2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },

  nativeInput: {
    flex: 1,
    height: hp(6.6),
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: wp(3),
    fontSize: hp(2.05),
  },

  bottomContainer: {
    width: '100%',
    paddingHorizontal: wp(5),
    // keep it visually above bottom edge
    // Note: bottom padding is set dynamically with safe area insets
  },

  // Premium button styles
  pbtnTouchable: {
    width: '100%',
    borderRadius: 40,
    overflow: 'hidden',
    // shadow
    shadowColor: '#0b3bff',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },

  pbtnGradient: {
    paddingVertical: hp(1.8),
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pbtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pbtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: hp(2.1),
    letterSpacing: 0.2,
  },
});







