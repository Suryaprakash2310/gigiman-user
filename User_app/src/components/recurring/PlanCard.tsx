// src/components/recurring/PlanCard.tsx
import React from 'react';
import { StyleSheet, View, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import StatusBadge from './StatusBadge';
import { RecurringPlan } from '../../types/recurring';
import { useTheme } from '../../theme/useTheme';

interface PlanCardProps {
  plan: RecurringPlan;
  onPress: () => void;
  onPauseToggle: () => void;
  onSkipNext: () => void;
  onReschedule: () => void;
  onEdit: () => void;
  onCancel: () => void;
  style?: ViewStyle;
}

export default function PlanCard({
  plan,
  onPress,
  onPauseToggle,
  onSkipNext,
  onReschedule,
  onEdit,
  onCancel,
  style,
}: PlanCardProps) {
  const { theme } = useTheme();
  const { service, frequency, schedule, status, nextVisitDate } = plan;
  const primaryColor = theme.colors.primary || '#f97316';
  
  const getFrequencyLabel = () => {
    if (frequency === 'weekly') return 'Weekly';
    if (frequency === 'every-2-weeks') return 'Every 2 Weeks';
    if (frequency === 'monthly') return 'Monthly';
    return 'Custom';
  };

  const getScheduleSummary = () => {
    if (frequency === 'weekly' || frequency === 'every-2-weeks') {
      const days = schedule.weekdays?.join(', ') || '';
      return `Every ${days} • ${schedule.time}`;
    }
    if (frequency === 'monthly') {
      if (schedule.monthlyDay) {
        return `Day ${schedule.monthlyDay} of Month • ${schedule.time}`;
      }
      if (schedule.monthlyType === 'date') {
        return `Day ${schedule.dateOfMonth} of Month • ${schedule.time}`;
      }
      return `${schedule.monthlyRule} • ${schedule.time}`;
    }
    if (frequency === 'custom') {
      if (schedule.customInterval) {
        return `Every ${schedule.customInterval} ${schedule.customInterval === 1 ? schedule.customUnit?.slice(0, -1) : schedule.customUnit} • ${schedule.time}`;
      }
    }
    return `${schedule.time}`;
  };

  const isPaused = status === 'paused';
  const isCancelled = status === 'cancelled';

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, style]}>
      {/* Top Section: Header & Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBg, { backgroundColor: primaryColor + '1A' }]}>
            <Ionicons name={service.icon as any} size={22} color={primaryColor} />
          </View>
          <View style={styles.headerTitles}>
            <AppText weight="bold" style={styles.serviceName}>
              {service.name}
            </AppText>
            <AppText style={styles.frequencyLabel}>
              {getFrequencyLabel()}
            </AppText>
          </View>
        </View>
        <StatusBadge status={status} />
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" style={styles.infoIcon} />
          <AppText style={styles.infoText}>
            {getScheduleSummary()}
          </AppText>
        </View>

        {!isCancelled && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" style={styles.infoIcon} />
            <AppText style={styles.infoText}>
              Next Visit: <AppText weight="bold" style={{ color: primaryColor }}>{nextVisitDate}</AppText>
            </AppText>
          </View>
        )}
      </View>

      {/* Action Buttons Section */}
      {!isCancelled && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, isPaused && { backgroundColor: primaryColor + '20' }]} 
            onPress={onPauseToggle}
          >
            <Ionicons 
              name={isPaused ? 'play-outline' : 'pause-outline'} 
              size={16} 
              color={isPaused ? primaryColor : '#4B5563'} 
            />
            <AppText weight="semibold" style={[styles.actionText, isPaused && { color: primaryColor }]}>
              {isPaused ? 'Resume' : 'Pause'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onSkipNext}>
            <Ionicons name="arrow-forward-outline" size={16} color="#4B5563" />
            <AppText weight="semibold" style={styles.actionText}>Skip Next</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onReschedule}>
            <Ionicons name="create-outline" size={16} color="#4B5563" />
            <AppText weight="semibold" style={styles.actionText}>Reschedule</AppText>
          </TouchableOpacity>

          {/* More menu triggers Cancel/Edit */}
          <TouchableOpacity style={styles.moreBtn} onPress={onEdit}>
            <Ionicons name="options-outline" size={16} color="#4B5563" />
            <AppText weight="semibold" style={styles.actionText}>Edit</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.moreBtn} onPress={onCancel}>
            <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
            <AppText weight="semibold" style={[styles.actionText, { color: '#EF4444' }]}>Cancel</AppText>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFFDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 16,
    color: '#1F2937',
  },
  frequencyLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  infoContainer: {
    marginVertical: 14,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnActive: {
    backgroundColor: '#D1FAE5',
  },
  actionText: {
    fontSize: 11,
    color: '#4B5563',
  },
  actionTextActive: {
    color: '#0F6A4B',
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
});
