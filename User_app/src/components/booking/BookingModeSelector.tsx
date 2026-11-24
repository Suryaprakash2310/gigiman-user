import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppTheme } from '@/src/theme';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface BookingModeOption {
  id: 'now' | 'schedule' | 'recurring';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
}

interface BookingModeSelectorProps {
  selectedMode: 'now' | 'schedule' | 'recurring';
  onModeChange: (mode: 'now' | 'schedule' | 'recurring') => void;
}

const BOOKING_MODES: BookingModeOption[] = [
  {
    id: 'now',
    label: 'Book Now',
    icon: 'flash',
    description: 'Instant booking',
  },
  {
    id: 'schedule',
    label: 'Schedule Later',
    icon: 'calendar',
    description: 'Choose date & time',
  },
  {
    id: 'recurring',
    label: 'Recurring',
    icon: 'repeat',
    description: 'Book once, clean automatically',
  },
];

const BookingModeSelector: React.FC<BookingModeSelectorProps> = ({
  selectedMode,
  onModeChange,
}) => {
  const { theme } = useTheme();
  const selectedColor = theme.dark ? theme.colors.primaryDark : theme.colors.primary;
  const styles = createStyles(theme, selectedColor);

  return (
    <View style={styles.container}>
      <AppText weight="bold" size="body" style={styles.title}>
        When do you need it?
      </AppText>

      <View style={styles.modesContainer}>
        {BOOKING_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;

          return (
            <TouchableOpacity
              key={mode.id}
              onPress={() => onModeChange(mode.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[styles.modeCard, isSelected && styles.modeCardSelected]}
              activeOpacity={0.8}
            >
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={selectedColor}
                  style={styles.checkmark}
                />
              )}
              <View style={[styles.iconBackground, isSelected && styles.iconBackgroundSelected]}>
                <Ionicons
                  name={mode.icon}
                  size={16}
                  color={isSelected ? selectedColor : theme.colors.textMuted}
                />
              </View>
              <AppText weight="semibold" size="small" style={styles.centeredText}>
                {mode.label}
              </AppText>
              {mode.description && (
                <AppText size="caption" color="textMuted" style={styles.centeredText}>
                  {mode.description}
                </AppText>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme, selectedColor: string) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: theme.spacing.md,
    },
    title: {
      marginBottom: theme.spacing.sm,
    },
    modesContainer: {
      flexDirection: 'row',
      gap: 6,
    },
    modeCard: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: theme.spacing.sm,
      gap: 4,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modeCardSelected: {
      backgroundColor: `${selectedColor}12`,
      borderColor: selectedColor,
    },
    iconBackground: {
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBackgroundSelected: {
      backgroundColor: `${selectedColor}1A`,
    },
    checkmark: {
      position: 'absolute',
      top: 4,
      right: 4,
    },
    centeredText: {
      textAlign: 'center',
      alignSelf: 'stretch',
    },
  });

export default BookingModeSelector;
