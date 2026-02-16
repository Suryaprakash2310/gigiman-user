import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface BookingModeOption {
  id: 'now' | 'schedule';
  label: string;
  icon: string;
  description?: string;
}

interface BookingModeSelectorProps {
  selectedMode: 'now' | 'schedule';
  onModeChange: (mode: 'now' | 'schedule') => void;
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
];

const BookingModeSelector: React.FC<BookingModeSelectorProps> = ({
  selectedMode,
  onModeChange,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <AppText
        weight="bold"
        size="body"
        style={[styles.title, { color: theme.colors.text }]}
      >
        When do you need it?
      </AppText>

      <View style={styles.modesContainer}>
        {BOOKING_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            onPress={() => onModeChange(mode.id)}
            style={styles.modeWrapper}
            activeOpacity={0.8}
          >
            {selectedMode === mode.id ? (
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeButton}
              >
                <Ionicons name={mode.icon as keyof typeof Ionicons.glyphMap} size={20} color="#fff" weight="bold" />
                <View style={styles.modeTextWrapper}>
                  <AppText weight="bold" size="body" style={{ color: '#fff' }}>
                    {mode.label}
                  </AppText>
                  {mode.description && (
                    <AppText size="caption" style={{ color: '#fff', opacity: 0.8 }}>
                      {mode.description}
                    </AppText>
                  )}
                </View>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.dark ? theme.colors.border : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={mode.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={theme.colors.textMuted}
                  weight="bold"
                />
                <View style={styles.modeTextWrapper}>
                  <AppText
                    weight="bold"
                    size="body"
                    style={{ color: theme.colors.text }}
                  >
                    {mode.label}
                  </AppText>
                  {mode.description && (
                    <AppText
                      size="caption"
                      color="textMuted"
                    >
                      {mode.description}
                    </AppText>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
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
    modesContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    modeWrapper: {
      flex: 1,
    },
    modeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      gap: theme.spacing.sm,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    modeTextWrapper: {
      flex: 1,
    },
  });

export default BookingModeSelector;
