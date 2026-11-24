import { Ionicons } from '@expo/vector-icons';
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

import type { AppTheme } from '@/src/theme';
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

  const controlColor = theme.dark ? theme.colors.text : theme.colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.details}>
        <AppText weight="semibold" size="small">{label}</AppText>
        <AppText size="caption" color="textMuted">Max {maxQuantity}</AppText>
      </View>

      <View style={styles.stepper}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
          onPress={onDecrease}
          disabled={isMinned}
          activeOpacity={0.7}
          style={[styles.stepButton, isMinned && styles.stepButtonDisabled]}
        >
          <Ionicons name="remove" size={18} color={controlColor} />
        </TouchableOpacity>

        <Animated.View style={[styles.count, animatedCountStyle]}>
          <AppText weight="semibold" style={styles.countText}>
            {quantity}
          </AppText>
        </Animated.View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
          onPress={onIncrease}
          disabled={isMaxed}
          activeOpacity={0.7}
          style={[styles.stepButton, isMaxed && styles.stepButtonDisabled]}
        >
          <Ionicons name="add" size={18} color={controlColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    details: {
      flexBasis: 88,
      flexGrow: 1,
      gap: 2,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    stepButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
    },
    stepButtonDisabled: {
      opacity: 0.35,
    },
    count: {
      minWidth: 24,
      alignItems: 'center',
    },
    countText: {
      color: theme.dark ? theme.colors.text : theme.colors.primary,
      fontVariant: ['tabular-nums'],
    },
  });

export default QuantitySelector;
