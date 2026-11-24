import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

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
                style={{ color: theme.dark ? theme.colors.text : theme.colors.primary }}
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
      marginHorizontal: 16,
      marginTop: -24,
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 1,
      zIndex: 10,
    },
    headerContent: {
      width: '100%',
    },
    title: {
      marginBottom: 8,
      lineHeight: 26,
    },
    detailsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      rowGap: 8,
    },
    priceBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
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
