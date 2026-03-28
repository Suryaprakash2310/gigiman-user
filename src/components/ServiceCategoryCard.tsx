import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import AppText from './ui/AppText';

// Get screen dimensions
const { width } = Dimensions.get('window');

interface ServiceCategoryCardProps {
  image?: ImageSourcePropType | null;
  icon?: string;
  title: string;
  subtitle?: string;
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
      {/* Icon / Image placeholder */}
      <View
        style={[
          styles.iconPlaceholder,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {image && (
          <Image
            source={image}
            style={styles.iconImage}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <AppText weight="semibold" size="body" numberOfLines={1}>
          {title}
        </AppText>
        <AppText
          color="textMuted"
          size="small"
          numberOfLines={2}
          style={styles.subtitle}
        >
          {subtitle}
        </AppText>
        {points && (
          <View style={styles.pointsContainer}>
            {points.map((point, index) => (
              <AppText
                key={index}
                size="small"
                color="textMuted"
                style={styles.pointText}
              >
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

      {/* Arrow */}
      <AppText weight="semibold" color="textMuted" style={styles.arrowIcon}>
        ›
      </AppText>
    </Pressable>
  );
};

export default ServiceCategoryCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: width * 0.04, // 4% of screen width
    marginBottom: width * 0.04,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc', // visible border
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconPlaceholder: {
    width: width * 0.15, // scales with screen width
    height: width * 0.15,
    borderRadius: 12,
    marginRight: width * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
    marginHorizontal: width * 0.04,
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: width * 0.07, // scales with screen width
    lineHeight: width * 0.08,
  },
  pointsContainer: {
    marginTop: 8,
  },
  pointText: {
    marginBottom: 4,
  },
});