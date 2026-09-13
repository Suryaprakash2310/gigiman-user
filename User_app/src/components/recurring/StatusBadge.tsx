// src/components/recurring/StatusBadge.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import AppText from '../ui/AppText';

interface StatusBadgeProps {
  status: 'active' | 'paused' | 'cancelled';
  style?: ViewStyle;
}

export default function StatusBadge({ status, style }: StatusBadgeProps) {
  const isActive = status === 'active';
  const isPaused = status === 'paused';

  const label = isActive ? 'Active' : isPaused ? 'Paused' : 'Cancelled';
  
  const bgColor = isActive 
    ? '#D1FAE5' // light green
    : isPaused 
    ? '#FFEDD5' // light orange
    : '#FEE2E2'; // light red
    
  const textColor = isActive 
    ? '#065F46' 
    : isPaused 
    ? '#9A3412' 
    : '#991B1B';

  const borderColor = isActive
    ? '#A7F3D0'
    : isPaused
    ? '#FED7AA'
    : '#FCA5A5';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }, style]}>
      <AppText weight="bold" style={[styles.text, { color: textColor }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
