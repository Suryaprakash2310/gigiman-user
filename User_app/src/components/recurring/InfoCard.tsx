// src/components/recurring/InfoCard.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';

interface InfoCardProps {
  text: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: 'info' | 'success' | 'warning';
  style?: ViewStyle;
}

export default function InfoCard({
  text,
  iconName = 'information-circle-outline',
  variant = 'info',
  style,
}: InfoCardProps) {
  const isInfo = variant === 'info';
  const isSuccess = variant === 'success';

  const bgColor = isInfo 
    ? '#EFF6FF' // light blue
    : isSuccess 
    ? '#F0FDF4' // light green
    : '#FFFBEB'; // light yellow

  const iconColor = isInfo 
    ? '#1D4ED8' 
    : isSuccess 
    ? '#0F6A4B' 
    : '#B45309';

  const textColor = isInfo 
    ? '#1E40AF' 
    : isSuccess 
    ? '#065F46' 
    : '#78350F';

  return (
    <View style={[styles.card, { backgroundColor: bgColor }, style]}>
      <Ionicons name={iconName} size={22} color={iconColor} style={styles.icon} />
      <AppText style={[styles.text, { color: textColor }]}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
