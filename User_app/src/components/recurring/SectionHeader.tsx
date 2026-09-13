// src/components/recurring/SectionHeader.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import AppText from '../ui/AppText';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export default function SectionHeader({ title, subtitle, style }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <AppText weight="bold" style={styles.title}>
        {title}
      </AppText>
      {subtitle && (
        <AppText style={styles.subtitle}>
          {subtitle}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  title: {
    fontSize: 24,
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 20,
  },
});
