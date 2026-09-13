// src/components/recurring/ScheduleCard.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { ScheduleDetails, RecurringFrequencyType } from '../../types/recurring';

import { useTheme } from '../../theme/useTheme';

interface ScheduleCardProps {
  schedule: ScheduleDetails;
  frequency: RecurringFrequencyType;
  style?: ViewStyle;
}

export default function ScheduleCard({
  schedule,
  frequency,
  style,
}: ScheduleCardProps) {
  const { theme } = useTheme();
  const primaryColor = theme.colors.primary || '#f97316';
  const isWeekly = frequency === 'weekly';
  const isMonthly = frequency === 'monthly';
  const isEvery2Weeks = frequency === 'every-2-weeks';
  const isCustom = frequency === 'custom';

  const formatWeekdays = (days?: string[]) => {
    if (!days || days.length === 0) return 'No days selected';
    return days.join(', ');
  };

  const getFrequencyText = () => {
    if (isWeekly) return 'Weekly';
    if (isEvery2Weeks) return 'Every 2 Weeks';
    if (isMonthly) return 'Monthly';
    return 'Custom Frequency';
  };

  return (
    <View style={[styles.card, style]}>
      {/* Frequency Header */}
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={20} color={primaryColor} style={styles.icon} />
        <View style={styles.content}>
          <AppText weight="bold" style={styles.title}>
            {getFrequencyText()}
          </AppText>
          
          {isWeekly && (
            <AppText style={styles.detailText}>
              Every {formatWeekdays(schedule.weekdays)}
            </AppText>
          )}

          {isEvery2Weeks && (
            <AppText style={styles.detailText}>
              Every 2 weeks on {formatWeekdays(schedule.weekdays)}
            </AppText>
          )}

          {isMonthly && (
            <AppText style={styles.detailText}>
              {schedule.monthlyDay
                ? `Every Month on Day ${schedule.monthlyDay}`
                : (schedule.monthlyType === 'date'
                  ? `Every Month on Day ${schedule.dateOfMonth}`
                  : `Every Month on the ${schedule.monthlyRule}`)}
            </AppText>
          )}

          {isCustom && (
            <AppText style={styles.detailText}>
              {schedule.customInterval
                ? `Repeating every ${schedule.customInterval} ${schedule.customInterval === 1 ? schedule.customUnit?.slice(0, -1) : schedule.customUnit}${schedule.customUnit === 'weeks' && schedule.weekdays ? ` on ${formatWeekdays(schedule.weekdays)}` : ''}${schedule.customUnit === 'months' && schedule.monthlyDay ? ` on Day ${schedule.monthlyDay}` : ''}`
                : 'Custom schedule setup'}
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Time and Date range */}
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" style={styles.gridIcon} />
          <View>
            <AppText style={styles.gridLabel}>Preferred Time</AppText>
            <AppText weight="semibold" style={styles.gridValue}>
              {schedule.time || '09:00 AM'}
            </AppText>
          </View>
        </View>

        <View style={styles.gridItem}>
          <Ionicons name="play-outline" size={16} color="#6B7280" style={styles.gridIcon} />
          <View>
            <AppText style={styles.gridLabel}>Start Date</AppText>
            <AppText weight="semibold" style={styles.gridValue}>
              {schedule.startDate || 'Immediate'}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Ionicons name="stop-outline" size={16} color="#6B7280" style={styles.gridIcon} />
          <View>
            <AppText style={styles.gridLabel}>End Date</AppText>
            <AppText weight="semibold" style={styles.gridValue}>
              {schedule.isNoEndDate ? 'Ongoing (No End Date)' : schedule.endDate || 'Ongoing'}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#1F2937',
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  gridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridIcon: {
    marginRight: 8,
  },
  gridLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  gridValue: {
    fontSize: 13,
    color: '#1F2937',
    marginTop: 2,
  },
});
