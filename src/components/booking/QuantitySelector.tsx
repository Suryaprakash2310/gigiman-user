import React,{ useEffect, useRef }  from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  useAnimatedReaction,
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

const { width } = Dimensions.get('window');

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

  useAnimatedReaction(
  () => quantity,
  (newQuantity, oldQuantity) => {
    if (newQuantity !== oldQuantity) {
      scale.value = withSpring(1.1, { damping: 2, mass: 1 });
      scale.value = withSpring(1, { damping: 2, mass: 1 });
    }
  }
);

  const animatedCountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isMaxed = quantity >= maxQuantity;
  const isMinned = quantity <= 1;

  return (
    <View style={styles.container}>
      <AppText weight="bold" size="body" style={styles.label}>
        {label}
      </AppText>

      <View style={styles.selectorContainer}>
        <TouchableOpacity
          onPress={onDecrease}
          disabled={isMinned}
          style={[styles.button, isMinned && styles.buttonDisabled]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="remove"
            size={20}
            color={isMinned ? theme.colors.textMuted : theme.colors.primary}
            weight="bold"
          />
        </TouchableOpacity>

        <Animated.View style={[styles.countDisplay, animatedCountStyle]}>
          <AppText weight="bold" size="h3" style={{ color: theme.colors.primary }}>
            {quantity}
          </AppText>
        </Animated.View>

        <TouchableOpacity
          onPress={onIncrease}
          disabled={isMaxed}
          style={[styles.button, isMaxed && styles.buttonDisabled]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add"
            size={20}
            color={isMaxed ? theme.colors.textMuted : theme.colors.primary}
            weight="bold"
          />
        </TouchableOpacity>
      </View>

      {isMaxed && (
        <AppText size="caption" color="textMuted" style={styles.maxWarning}>
          Maximum quantity reached
        </AppText>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      marginVertical: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'transparent',
    },
    label: {
      marginBottom: theme.spacing.md,
      color: theme.colors.text,
    },
    selectorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.lg,
    },
    button: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.lg,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.background,
      shadowOpacity: 0,
      elevation: 0,
    },
    countDisplay: {
      width: 70,
      height: 48,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    maxWarning: {
      marginTop: theme.spacing.sm,
      textAlign: 'center',
      fontSize: 12,
    },
  });

export default QuantitySelector;
