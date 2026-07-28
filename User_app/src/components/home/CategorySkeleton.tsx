import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";

interface CategorySkeletonProps {
  count?: number;
  columns?: number;
}

export const CategorySkeleton: React.FC<CategorySkeletonProps> = ({ count = 4, columns = 2 }) => {
  const opacityAnim = useRef(new Animated.Value(0.4)).current;
  const { width } = useWindowDimensions();
  const cardWidth = (width - 48 - (columns - 1) * 12) / columns;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={`skeleton-${index}`} style={[styles.card, { width: cardWidth }]}>
          <Animated.View style={[styles.imagePlaceholder, { opacity: opacityAnim }]} />
          <Animated.View style={[styles.textPlaceholder, { opacity: opacityAnim }]} />
          <Animated.View style={[styles.textPlaceholderSmall, { opacity: opacityAnim }]} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: "100%",
    height: 102,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    marginBottom: 12,
  },
  textPlaceholder: {
    width: "80%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E2E8F0",
    marginBottom: 6,
  },
  textPlaceholderSmall: {
    width: "45%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
});

export default CategorySkeleton;
