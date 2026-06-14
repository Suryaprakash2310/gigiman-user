import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

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
  title,
  description,
  price,
  duration = 60,
  employeeCount,
  image,
  onPress,
  index = 0,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const cleanDescription = description?.replace(/<[^>]*>?/gm, '');

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(350)}
    >
      <Pressable
        onPress={onPress}
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
            <AppText
              weight="bold"
              size="body"
              numberOfLines={3}
              style={styles.title}
            >
              {title}
            </AppText>

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

            {/* Price */}
            {price ? (
              <View style={styles.priceContainer}>
                <AppText size="caption" weight="bold" color="primary">
                  ₹{price}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        {/* Arrow */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.primary}
          style={styles.arrow}
        />
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
      marginTop: 6,
    },

    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    priceContainer: {
      marginLeft: 'auto',
    },

    arrow: {
      marginRight: 8,
    },
  });

export default CategoryCard;