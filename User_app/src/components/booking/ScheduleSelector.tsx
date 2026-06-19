import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface ScheduleSelectorProps {
  selectedDate: Date | null;
  selectedTime: Date | null;
  onDatePress: () => void;
  onTimePress: () => void;
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  selectedDate,
  selectedTime,
  onDatePress,
  onTimePress,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const formatDate = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <AppText
        weight="bold"
        size="body"
        style={[styles.title, { color: theme.colors.text }]}
      >
        Schedule Your Service
      </AppText>

      <View style={styles.selectorsRow}>
        {/* Date Selector */}
        <TouchableOpacity
          onPress={onDatePress}
          activeOpacity={0.7}
          style={styles.selectorWrapper}
        >
          <View
            style={[
              styles.selector,
              {
                backgroundColor: selectedDate
                  ? `${theme.colors.primary}15`
                  : theme.colors.surface,
                borderColor: selectedDate
                  ? theme.colors.primary
                  : theme.dark
                  ? theme.colors.border
                  : 'transparent',
              },
            ]}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={theme.colors.primary}
              weight="bold"
            />
            <View style={styles.selectorContent}>
              <AppText size="caption" color="textMuted">
                Date
              </AppText>
              <AppText
                weight="semibold"
                size="body"
                style={{ color: theme.colors.text }}
              >
                {selectedDate ? formatDate(selectedDate) : 'Select date'}
              </AppText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Time Selector */}
        <TouchableOpacity
          onPress={onTimePress}
          activeOpacity={0.7}
          style={styles.selectorWrapper}
        >
          <View
            style={[
              styles.selector,
              {
                backgroundColor: selectedTime
                  ? `${theme.colors.primary}15`
                  : theme.colors.surface,
                borderColor: selectedTime
                  ? theme.colors.primary
                  : theme.dark
                  ? theme.colors.border
                  : 'transparent',
              },
            ]}
          >
            <Ionicons
              name="time"
              size={20}
              color={theme.colors.primary}
              weight="bold"
            />
            <View style={styles.selectorContent}>
              <AppText size="caption" color="textMuted">
                Time
              </AppText>
              <AppText
                weight="semibold"
                size="body"
                style={{ color: theme.colors.text }}
              >
                {selectedTime ? formatTime(selectedTime) : 'Select time'}
              </AppText>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {selectedDate && selectedTime && (
        <View style={styles.confirmationBox}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={theme.colors.primary}
          />
          <AppText size="caption" color="primary" weight="medium">
            {formatDate(selectedDate)} at {formatTime(selectedTime)}
          </AppText>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      marginVertical: theme.spacing.md,
    },
    title: {
      marginBottom: theme.spacing.md,
    },
    selectorsRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    selectorWrapper: {
      flex: 1,
    },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      gap: theme.spacing.sm,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    selectorContent: {
      flex: 1,
    },
    confirmationBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: `${theme.colors.primary}10`,
      borderRadius: theme.radius.md,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
  });

export default ScheduleSelector;
