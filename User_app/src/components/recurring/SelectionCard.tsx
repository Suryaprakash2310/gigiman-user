// src/components/recurring/SelectionCard.tsx
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface SelectionCardProps {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function SelectionCard({
  selected,
  onPress,
  children,
  style,
}: SelectionCardProps) {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    borderOpacity.value = withSpring(selected ? 1 : 0, { damping: 15 });
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: selected ? '#0F6A4B' : '#E5E7EB',
      backgroundColor: selected ? '#F0FDF4' : '#FFFFFF',
      transform: [{ scale: scale.value }],
    };
  });

  const checkStyle = useAnimatedStyle(() => {
    return {
      opacity: borderOpacity.value,
      transform: [{ scale: borderOpacity.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: '100%' }}
    >
      <Animated.View style={[styles.card, animatedStyle, style]}>
        <View style={styles.content}>
          {children}
        </View>
        <Animated.View style={[styles.checkContainer, checkStyle]}>
          <View style={styles.checkInner}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  checkContainer: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  checkInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F6A4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
