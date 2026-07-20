import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getStatusBadgeConfig, isComingSoon } from '@/src/utils/serviceStatus';

const { width } = Dimensions.get('window');

interface CategoryCardProps {
  id: string;
  image?: string | null;
  title: string;
  description?: string;
  price?: string | number;
  duration?: number;
  employeeCount?: number;
  status?: string;
  onPress?: () => void;
  index?: number;
  onAddToCart?: () => void;
  isAdded?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  title,
  description,
  price,
  duration = 60,
  employeeCount,
  image,
  status,
  onPress,
  index = 0,
  onAddToCart,
  isAdded = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const cleanDescription = description?.replace(/<[^>]*>?/gm, '');
  const badgeConfig = getStatusBadgeConfig(status);
  const comingSoon = isComingSoon(status);

  const handleCardPress = () => {
    if (comingSoon) {
      Alert.alert('Coming Soon', 'This service is coming soon and cannot be booked yet.');
      return;
    }
    if (onPress) {
      onPress();
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(350)}
    >
      <Pressable
        onPress={handleCardPress}
        android_ripple={{ color: `${theme.colors.primary}15` }}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.9 },
        ]}
      >
        {/* Image Section */}
        <View style={styles.imageWrapper}>
          {image && !imageError ? (
            <>
              <Image
                source={{ uri: image }}
                style={styles.image}
                resizeMode="cover"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              {imageLoading && (
                <View style={styles.loader}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                </View>
              )}
            </>
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.gradientPlaceholder}
            >
              <AppText weight="bold" size="h2" style={{ color: '#fff' }}>
                {title.charAt(0).toUpperCase()}
              </AppText>
            </LinearGradient>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.contentWrapper}>
          <View>
            <View style={styles.headerRow}>
              <AppText
                weight="bold"
                size="body"
                numberOfLines={2}
                style={[styles.title, { flex: 1 }]}
              >
                {title}
              </AppText>
              {badgeConfig && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: badgeConfig.bgColor,
                      borderColor: badgeConfig.borderColor,
                    },
                  ]}
                >
                  <AppText
                    weight="bold"
                    style={[styles.badgeText, { color: badgeConfig.textColor }]}
                  >
                    {badgeConfig.label}
                  </AppText>
                </View>
              )}
            </View>

            {cleanDescription && (
              <AppText
                size="small"
                color="textMuted"
                numberOfLines={2}
                style={styles.description}
              >
                {cleanDescription}
              </AppText>
            )}
          </View>

          <View style={styles.detailsRow}>
            {/* Duration */}
            <View style={styles.detailItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={theme.colors.primary}
              />
              <AppText size="caption" weight="medium">
                {duration}m
              </AppText>
            </View>

            {/* Employee Count */}
            {employeeCount ? (
              <View style={styles.detailItem}>
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={theme.colors.primary}
                />
                <AppText size="caption" weight="medium">
                  {employeeCount} employee
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Action / Price Row */}
          <View style={styles.actionRow}>
            {price ? (
              <AppText size="body" weight="bold" color="primary">
                ₹{price}
              </AppText>
            ) : <View />}

            {comingSoon ? (
              <View style={styles.comingSoonBtn}>
                <AppText
                  weight="bold"
                  size="caption"
                  style={{ color: '#EA580C' }}
                >
                  Coming Soon
                </AppText>
              </View>
            ) : onAddToCart ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                style={[
                  styles.addToCartBtn,
                  isAdded && styles.addedBtn
                ]}
              >
                <AppText
                  weight="bold"
                  size="caption"
                  style={{ color: isAdded ? theme.colors.success : '#fff' }}
                >
                  {isAdded ? '✓ Added' : 'Add to Cart'}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Arrow (Legacy) */}
        {!onAddToCart && !comingSoon && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.primary}
            style={styles.arrow}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      marginBottom: 3,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    comingSoonBtn: {
      backgroundColor: '#FFF7ED',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: '#FFEDD5',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      marginHorizontal: 16,
      marginVertical: 6,
      paddingVertical: 8,
      paddingRight: 8,
      overflow: 'hidden',
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },

    imageWrapper: {
      width: 90,
      height: 90,
      borderRadius: 12,
      marginLeft: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
    },

    image: {
      width: '100%',
      height: '100%',
    },

    loader: {
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
      paddingHorizontal: 10,
      paddingVertical: 6,
      justifyContent: 'space-between',
    },

    title: {
      marginBottom: 3,
      
    },

    description: {
      fontSize: 12,
      lineHeight: 15,
    },

    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },

    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
    },

    addToCartBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },

    addedBtn: {
      backgroundColor: `${theme.colors.success}15`,
      borderWidth: 1,
      borderColor: theme.colors.success,
    },

    arrow: {
      marginRight: 8,
    },
  });

export default CategoryCard;