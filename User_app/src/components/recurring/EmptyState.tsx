// src/components/recurring/EmptyState.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import PrimaryButton from './PrimaryButton';

interface EmptyStateProps {
  onActionPress: () => void;
  actionTitle?: string;
  style?: ViewStyle;
}

export default function EmptyState({
  onActionPress,
  actionTitle = 'Create New Plan',
  style,
}: EmptyStateProps) {
  const benefits = [
    { icon: 'time-outline', title: 'Save Time', desc: 'No need to book cleaning every single week.' },
    { icon: 'people-outline', title: 'Same Cleaner', desc: 'Get matched with your favorite cleaner every time.' },
    { icon: 'card-outline', title: 'AutoPay Enabled', desc: 'Secure automatic payment after each visit completes.' },
    { icon: 'calendar-outline', title: 'Flexible Schedule', desc: 'Pause, reschedule, or skip visits anytime with one tap.' },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Premium Minimal Graphic */}
      <View style={styles.graphicContainer}>
        <View style={styles.circleBg}>
          <View style={styles.circleInner}>
            <Ionicons name="repeat" size={48} color="#0F6A4B" />
          </View>
          <View style={[styles.bubble, styles.bubble1]}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </View>
          <View style={[styles.bubble, styles.bubble2]}>
            <Ionicons name="calendar" size={14} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <AppText weight="bold" style={styles.title}>
        No recurring plans yet
      </AppText>
      <AppText style={styles.subtitle}>
        Automate your home cleaning schedule. Book once, clean automatically.
      </AppText>

      <PrimaryButton
        title={actionTitle}
        onPress={onActionPress}
        iconName="add"
        style={styles.button}
      />

      {/* Benefits Section */}
      <View style={styles.benefitsContainer}>
        <AppText weight="bold" style={styles.benefitsTitle}>
          Why Choose Recurring Plans?
        </AppText>
        
        <View style={styles.benefitsGrid}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={styles.benefitIconBg}>
                <Ionicons name={b.icon as any} size={20} color="#0F6A4B" />
              </View>
              <View style={styles.benefitTextWrap}>
                <AppText weight="bold" style={styles.benefitLabel}>
                  {b.title}
                </AppText>
                <AppText style={styles.benefitDesc}>
                  {b.desc}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '100%',
  },
  graphicContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFFDF4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bubble1: {
    width: 32,
    height: 32,
    backgroundColor: '#0F6A4B',
    bottom: 5,
    right: 5,
  },
  bubble2: {
    width: 28,
    height: 28,
    backgroundColor: '#F59E0B',
    top: 5,
    left: 5,
  },
  title: {
    fontSize: 20,
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 24,
    marginBottom: 36,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  benefitsTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    textAlign: 'left',
  },
  benefitsGrid: {
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitLabel: {
    fontSize: 14,
    color: '#1F2937',
  },
  benefitDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
});
