import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  maxQuantity?: number;
  label?: string;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  maxQuantity = 10,
  label = 'Quantity',
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const scale = useSharedValue(1);
  const countOpacity = useSharedValue(1);

  useAnimatedReaction(
    () => quantity,
    (cur, prev) => {
      if (cur !== prev) {
        scale.value = withSequence(
          withSpring(1.25, { damping: 4, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        );
        countOpacity.value = withSequence(
          withTiming(0.4, { duration: 60 }),
          withTiming(1, { duration: 100 })
        );
      }
    }
  );

  const animatedCountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: countOpacity.value,
  }));

  const isMaxed = quantity >= maxQuantity;
  const isMinned = quantity <= 1;

  // Progress bar fill: how many segments are filled
  const filled = quantity;
  const total = maxQuantity;

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <View style={styles.labelDot} />
          <AppText weight="bold" style={styles.label}>
            {label}
          </AppText>
        </View>
        <View style={styles.limitBadge}>
          <AppText style={styles.limitText}>max {maxQuantity}</AppText>
        </View>
      </View>

      {/* Stepper Pill */}
      <View style={styles.stepperPill}>
        {/* Decrease Button */}
        <TouchableOpacity
          onPress={onDecrease}
          disabled={isMinned}
          activeOpacity={0.7}
          style={[styles.stepBtn, isMinned && styles.stepBtnDisabled]}
        >
          <Ionicons
            name="remove"
            size={22}
            color={isMinned ? theme.colors.textMuted : '#ffffff'}
          />
        </TouchableOpacity>

        {/* Count Display */}
        <View style={styles.countArea}>
          <Animated.View style={animatedCountStyle}>
            <AppText weight="bold" style={styles.countText}>
              {quantity}
            </AppText>
          </Animated.View>
          <AppText style={styles.unitText}>
            {quantity === 1 ? 'unit' : 'units'}
          </AppText>
        </View>

        {/* Increase Button */}
        <TouchableOpacity
          onPress={onIncrease}
          disabled={isMaxed}
          activeOpacity={0.7}
          style={[styles.stepBtn, isMaxed && styles.stepBtnDisabled]}
        >
          <Ionicons
            name="add"
            size={22}
            color={isMaxed ? theme.colors.textMuted : '#ffffff'}
          />
        </TouchableOpacity>
      </View>

      {/* Segmented Progress Bar */}
      <View style={styles.progressRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i < filled && styles.progressSegmentFilled,
              i === 0 && styles.segmentFirst,
              i === total - 1 && styles.segmentLast,
            ]}
          />
        ))}
      </View>

      {/* Bottom Context Line */}
      <View style={styles.contextRow}>
        {isMaxed ? (
          <AppText style={styles.maxWarning}>
            🚫 Maximum quantity reached
          </AppText>
        ) : (
          <AppText style={styles.contextText}>
            {maxQuantity - quantity} more available
          </AppText>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 3,
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    labelDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    label: {
      fontSize: 16,
      color: theme.colors.text,
    },
    limitBadge: {
      backgroundColor: `${theme.colors.primary}12`,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}25`,
    },
    limitText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '600',
    },

    // Stepper pill
    stepperPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9',
      borderRadius: 16,
      padding: 6,
      marginBottom: 16,
    },
    stepBtn: {
      width: 52,
      height: 52,
      borderRadius: 13,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    stepBtnDisabled: {
      backgroundColor: theme.dark ? '#334155' : '#CBD5E1',
      shadowOpacity: 0,
      elevation: 0,
    },
    countArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: {
      fontSize: 34,
      color: theme.colors.text,
      lineHeight: 40,
    },
    unitText: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: -2,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    // Progress bar
    progressRow: {
      flexDirection: 'row',
      gap: 4,
      marginBottom: 10,
      height: 6,
    },
    progressSegment: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.dark ? '#334155' : '#E2E8F0',
    },
    progressSegmentFilled: {
      backgroundColor: theme.colors.primary,
    },
    segmentFirst: {
      borderTopLeftRadius: 99,
      borderBottomLeftRadius: 99,
    },
    segmentLast: {
      borderTopRightRadius: 99,
      borderBottomRightRadius: 99,
    },

    // Bottom context
    contextRow: {
      alignItems: 'center',
    },
    contextText: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    maxWarning: {
      fontSize: 12,
      color: '#EF4444',
      fontWeight: '600',
    },
  });

export default QuantitySelector;

