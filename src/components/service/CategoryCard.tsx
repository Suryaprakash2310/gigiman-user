import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/useTheme';
import AppText from '@/src/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = width - 32; // 16px margin on each side

interface CategoryCardProps {
  id: string;
  image?: string | null;
  title: string;
  description?: string;
  price?: string | number;
  duration?: number;
  employeeCount?: number;
  onPress?: () => void;
  index?: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  image,
  title,
  description,
  price,
  duration = 60,
  employeeCount,
  onPress,
  index = 0,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400).springify()}
      style={{ width: '100%' }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: `${theme.colors.primary}20` }}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.85 },
        ]}
      >
        {/* Image Container */}
        <View style={styles.imageWrapper}>
          {imageError ? (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientPlaceholder}
            >
              <AppText weight="bold" size="h2" style={{ color: '#fff' }}>
                {title.charAt(0).toUpperCase()}
              </AppText>
            </LinearGradient>
          ) : (
            <>
              {image && (
                <Image
                  source={{ uri: image }}
                  style={styles.image}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  resizeMode="cover"
                />
              )}

              {imageLoading && (
                <View style={styles.imageLoadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                </View>
              )}
            </>
          )}
        </View>

        {/* Content Container */}
        <View style={styles.contentWrapper}>
          {/* Title and Description */}
          <View style={styles.textSection}>
            <AppText
              weight="bold"
              size="body"
              numberOfLines={2}
              style={[styles.title, { color: theme.colors.text }]}
            >
              {title}
            </AppText>

            {description && (
              <AppText
                size="small"
                color="textMuted"
                numberOfLines={2}
                style={styles.description}
              >
                {description}
              </AppText>
            )}
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {/* Duration */}
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Ionicons name="time" size={14} color={theme.colors.primary} />
              </View>
              <AppText size="caption" weight="medium" color="text">
                {duration}m
              </AppText>
            </View>

            {/* Employee Count */}
            {employeeCount && (
              <View style={styles.detailItem}>
                <View style={[styles.detailIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Ionicons name="person" size={14} color={theme.colors.primary} />
                </View>
                <AppText size="caption" weight="medium" color="text">
                  {employeeCount} pro
                </AppText>
              </View>
            )}

            {/* Price */}
            {price && (
              <View style={styles.detailItem}>
                <View style={[styles.detailIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <AppText size="caption" weight="bold" style={{ color: theme.colors.primary }}>
                    ₹
                  </AppText>
                </View>
                <AppText size="caption" weight="bold" color="primary">
                  {price}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* Action Arrow */}
        <View style={styles.actionButton}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.primary}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'transparent',
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    imageWrapper: {
      width: 120,
      height: 120,
      borderRadius: 12,
      marginLeft: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageLoadingContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `${theme.colors.background}80`,
    },
    gradientPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentWrapper: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
      justifyContent: 'space-between',
    },
    textSection: {
      marginBottom: 8,
    },
    title: {
      marginBottom: 4,
      lineHeight: 18,
    },
    description: {
      fontSize: 12,
      lineHeight: 16,
    },
    detailsGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailIcon: {
      width: 24,
      height: 24,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButton: {
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
  });

export default CategoryCard;
