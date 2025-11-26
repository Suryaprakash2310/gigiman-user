import React from 'react';
import { View, StyleSheet, Pressable, Image, ImageSourcePropType } from 'react-native';
import AppText from './AppText';
import { useTheme } from '../../theme/useTheme';

interface ServiceCategoryCardProps {
  image?: ImageSourcePropType | null;
  icon?: string; // This can be kept for future use, but we'll display a placeholder
  title: string;
  subtitle: string;
  amount?: string | number;
  onPress?: () => void;
  points?: string[];
}

const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({
  image,
  icon,
  title,
  subtitle,
  amount,
  onPress,
  points,
}) => {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.cardShadow,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      {/* Service row icon placeholder */}
      <View style={[styles.iconPlaceholder, { backgroundColor: theme.colors.background }]}>
        {/* An <Image> component can be placed here */}
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        <AppText weight="semibold" size="body" numberOfLines={1}>
          {title}
        </AppText>
        <AppText color="textMuted" size="small" numberOfLines={2} style={styles.subtitle}>
          {subtitle}
        </AppText>
        {points && (
          <View style={styles.pointsContainer}>
            {points.map((point, index) => (
              <AppText key={index} size="small" color="textMuted" style={styles.pointText}>
                • {point}
              </AppText>
            ))}
          </View>
        )}
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        {amount && (
          <AppText weight="bold" size="body" color="primary">
            ₹{amount}
          </AppText>
        )}
      </View>
      
      {/* Right arrow icon */}
      <AppText weight="semibold" color="textMuted" style={styles.arrowIcon}>›</AppText>
    </Pressable>
  );
};

export default ServiceCategoryCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    // --- Corrected Shadow ---
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8, // Using a higher opacity with the specific cardShadow color
    shadowRadius: 15,
    elevation: 5,
  },
  iconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 2,
    marginBottom: 8,
  },
  amountContainer: {
    marginHorizontal: 16,
  },
  arrowIcon: {
    fontSize: 28,
    lineHeight: 30,
  },
  pointsContainer: {
    marginTop: 8,
  },
  pointText: {
    marginBottom: 4,
  },
});
