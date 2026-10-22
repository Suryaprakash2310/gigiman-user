import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface ServiceHeaderProps {
  name: string;
  price: number;
  originalPrice?: number;
  offerPrice?: number;
  duration: number;
  image?: string;
}

const { width } = Dimensions.get('window');

const ServiceHeader: React.FC<ServiceHeaderProps> = ({
  name,
  price,
  originalPrice,
  offerPrice,
  duration,
  image,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const rawPrice = Number(price || 0);
  const rawOfferPrice = offerPrice != null && Number(offerPrice) > 0 ? Number(offerPrice) : rawPrice;
  const rawOriginalPrice = (originalPrice != null && Number(originalPrice) > rawOfferPrice)
    ? Number(originalPrice)
    : (rawOfferPrice > 0 ? Math.round((rawOfferPrice * 1.35) / 10) * 10 : rawOfferPrice);

  const displayPrice = rawOfferPrice;
  const origPrice = rawOriginalPrice;
  const hasDiscount = origPrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((origPrice - displayPrice) / origPrice) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header Info Card - Positioned over image */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <AppText
            weight="bold"
            size="h2"
            numberOfLines={2}
            style={[styles.title, { color: theme.colors.text }]}
          >
            {name}
          </AppText>

          <View style={styles.detailsContainer}>
            {/* Price Badge */}
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.priceBadge}
            >
              <AppText weight="bold" size="h3" style={{ color: '#fff' }}>
                ₹{displayPrice}
              </AppText>
            </LinearGradient>

            {hasDiscount && (
              <View style={styles.originalPriceContainer}>
                <AppText
                  weight="medium"
                  size="body"
                  style={styles.originalPriceText}
                >
                  ₹{origPrice}
                </AppText>
                <View style={styles.discountBadge}>
                  <AppText weight="bold" style={styles.discountText}>
                    {discountPercent}% OFF
                  </AppText>
                </View>
              </View>
            )}

            {/* Duration Badge */}
            <View
              style={[
                styles.durationBadge,
                { backgroundColor: `${theme.colors.primary}15` },
              ]}
            >
              <AppText
                weight="semibold"
                size="body"
                style={{ color: theme.colors.primary }}
              >
                {duration}m
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
      marginBottom: theme.spacing.md,
    },
    headerCard: {
      marginHorizontal: theme.spacing.lg,
      marginTop: -40,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'transparent',
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
      zIndex: 10,
    },
    headerContent: {
      width: '100%',
    },
    title: {
      marginBottom: theme.spacing.md,
      lineHeight: 28,
    },
    detailsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      flexWrap: 'wrap',
      rowGap: 8,
    },
    priceBadge: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    durationBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    originalPriceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    originalPriceText: {
      color: theme.colors.textMuted || '#94A3B8',
      textDecorationLine: 'line-through',
    },
    discountBadge: {
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    discountText: {
      color: '#166534',
      fontSize: 11,
    },
  });

export default ServiceHeader;
