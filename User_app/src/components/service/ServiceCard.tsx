import React, { useMemo } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  Alert,
  Dimensions,
} from 'react-native';
import AppText from '@/src/components/ui/AppText';
import OptimizedImage from '@/src/components/ui/OptimizedImage';
import { useTheme } from '@/src/theme/useTheme';
import { DomainService } from '@/src/api/service.api';
import { getStatusBadgeConfig, isComingSoon } from '@/src/utils/serviceStatus';

interface ServiceCardProps {
  service: DomainService;
  onPress: (domainName: string, domainId: string) => void;
  cardWidth?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress, cardWidth }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const badgeConfig = getStatusBadgeConfig(service.status);
  const comingSoon = isComingSoon(service.status);

  const imageUrl = service.domainImage || (service as any).serviceImage || (service as any).image;

  const handlePress = () => {
    if (comingSoon) {
      Alert.alert('Coming Soon', 'This service is coming soon and cannot be booked yet.');
      return;
    }
    onPress(service.domainName, service._id);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth || DEFAULT_CARD_WIDTH },
        pressed && styles.pressed,
        comingSoon && styles.comingSoonCard,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${service.domainName} service`}
    >
      {/* Image Container matching CategoryCard visual language */}
      <View style={styles.imageContainer}>
        <OptimizedImage
          uri={imageUrl}
          style={styles.image}
          contentFit="cover"
          transition={250}
        />
        {/* Status Tag Badge */}
        {badgeConfig && (
          <View
            style={[
              styles.statusTag,
              {
                backgroundColor: badgeConfig.bgColor,
                borderColor: badgeConfig.borderColor,
              },
            ]}
          >
            <AppText
              weight="bold"
              style={[styles.statusTagText, { color: badgeConfig.textColor }]}
            >
              {badgeConfig.label}
            </AppText>
          </View>
        )}
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        <AppText
          weight="semibold"
          numberOfLines={2}
          style={styles.titleText}
        >
          {service.domainName}
        </AppText>
        <AppText
          size="small"
          color={comingSoon ? "accent" : "textMuted"}
          numberOfLines={1}
          style={styles.subtitleText}
        >
          {comingSoon ? "Coming Soon" : "View services"}
        </AppText>
      </View>
    </Pressable>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: theme.spacing.md,
      minHeight: 165,
    },
    pressed: {
      transform: [{ scale: 0.97 }],
      opacity: 0.95,
    },
    comingSoonCard: {
      opacity: 0.85,
    },
    imageContainer: {
      width: '100%',
      height: 120,
      borderRadius: 18,
      backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    statusTag: {
      position: 'absolute',
      top: 8,
      right: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      zIndex: 2,
    },
    statusTagText: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
    contentContainer: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 2,
    },
    titleText: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      marginBottom: 2,
    },
    subtitleText: {
      textAlign: 'center',
      fontSize: 11,
    },
  });

export default ServiceCard;

