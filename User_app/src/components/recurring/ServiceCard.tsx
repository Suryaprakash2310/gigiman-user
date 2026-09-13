// src/components/recurring/ServiceCard.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import SelectionCard from './SelectionCard';

interface ServiceCardProps {
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  pricePerVisit: number;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export default function ServiceCard({
  name,
  description,
  icon,
  pricePerVisit,
  selected,
  onPress,
  style,
}: ServiceCardProps) {
  return (
    <SelectionCard selected={selected} onPress={onPress} style={style}>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: selected ? '#D1FAE5' : '#F3F4F6' }]}>
          <Ionicons name={icon} size={26} color={selected ? '#0F6A4B' : '#374151'} />
        </View>
        <View style={styles.textContainer}>
          <AppText weight="bold" style={styles.name}>
            {name}
          </AppText>
          <AppText style={styles.description} numberOfLines={2}>
            {description}
          </AppText>
          <View style={styles.priceRow}>
            <AppText style={styles.priceLabel}>Price per visit: </AppText>
            <AppText weight="bold" style={styles.priceValue}>
              ₹{pricePerVisit}
            </AppText>
          </View>
        </View>
      </View>
    </SelectionCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: '#1F2937',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    color: '#0F6A4B',
  },
});
