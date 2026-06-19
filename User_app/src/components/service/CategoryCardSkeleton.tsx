import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const cardWidth = width - 32;

interface CategoryCardSkeletonProps {
  count?: number;
  index?: number;
}

const CategoryCardSkeleton: React.FC<CategoryCardSkeletonProps> = ({
  count = 1,
  index = 0,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const animationValue = useSharedValue(0);

  useEffect(() => {
    animationValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationValue.value,
      [0, 1],
      [0.3, 0.7],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, idx) => (
        <View key={idx} style={styles.container}>
          <View style={styles.card}>
            {/* Image Skeleton */}
            <Animated.View
              style={[styles.imageSkeleton, animatedStyle]}
            />

            {/* Content Skeleton */}
            <View style={styles.contentSkeleton}>
              {/* Title Skeleton */}
              <Animated.View
                style={[
                  styles.skeletonBar,
                  { width: '70%', height: 14, marginBottom: 8 },
                  animatedStyle,
                ]}
              />

              {/* Description Skeleton */}
              <Animated.View
                style={[
                  styles.skeletonBar,
                  { width: '50%', height: 10, marginBottom: 12 },
                  animatedStyle,
                ]}
              />

              {/* Details Skeleton */}
              <View style={styles.detailsRowSkeleton}>
                <Animated.View
                  style={[
                    styles.skeletonBar,
                    { width: 40, height: 20 },
                    animatedStyle,
                  ]}
                />
                <Animated.View
                  style={[
                    styles.skeletonBar,
                    { width: 40, height: 20 },
                    animatedStyle,
                  ]}
                />
                <Animated.View
                  style={[
                    styles.skeletonBar,
                    { width: 40, height: 20 },
                    animatedStyle,
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      ))}
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 8,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'transparent',
    },
    imageSkeleton: {
      width: 120,
      height: 120,
      borderRadius: 12,
      marginRight: 12,
      backgroundColor: theme.colors.background,
    },
    contentSkeleton: {
      flex: 1,
      justifyContent: 'center',
    },
    skeletonBar: {
      backgroundColor: theme.colors.background,
      borderRadius: 6,
    },
    detailsRowSkeleton: {
      flexDirection: 'row',
      gap: 12,
    },
  });

export default CategoryCardSkeleton;
