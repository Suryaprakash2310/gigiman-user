// src/components/recurring/FrequencyCard.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import SelectionCard from './SelectionCard';

interface FrequencyCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export default function FrequencyCard({
  title,
  subtitle,
  icon,
  badge,
  selected,
  onPress,
  style,
}: FrequencyCardProps) {
  return (
    <SelectionCard selected={selected} onPress={onPress} style={style}>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: selected ? '#D1FAE5' : '#F3F4F6' }]}>
          <Ionicons name={icon} size={24} color={selected ? '#0F6A4B' : '#4B5563'} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <AppText weight="bold" style={styles.title}>
              {title}
            </AppText>
            {badge && (
              <View style={styles.badge}>
                <AppText weight="semibold" style={styles.badgeText}>
                  {badge}
                </AppText>
              </View>
            )}
          </View>
          <AppText style={styles.subtitle}>
            {subtitle}
          </AppText>
        </View>
      </View>
    </SelectionCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#0F6A4B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
});
