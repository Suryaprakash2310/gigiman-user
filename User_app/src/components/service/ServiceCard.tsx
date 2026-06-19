import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { DomainService } from '@/src/api/service.api';

interface ServiceCardProps {
  service: DomainService;
  onPress: (domainName: string, domainId: string) => void;
}

const { width } = Dimensions.get('window');

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    onPress(service.domainName, service._id);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.card}
      onPress={handlePress}
      accessible={true}
      accessibilityLabel={`${service.domainName} service`}
      accessibilityRole="button"
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={styles.placeholderContainer}>
            <AppText size="h3" color="textMuted" weight="bold">
              {service.domainName.charAt(0).toUpperCase()}
            </AppText>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: (service as any).serviceImage }}
              style={styles.image}
              onLoad={handleImageLoad}
              onError={handleImageError}
              resizeMode="contain"
            />
            {imageLoading && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
          </>
        )}
      </View>

      {/* Text Container */}
      <View style={styles.textContainer}>
        <AppText
          weight="semibold"
          numberOfLines={2}
          size="body"
          style={styles.title}
        >
          {service.domainName}
        </AppText>

        <AppText
          size="small"
          color="textMuted"
          numberOfLines={1}
          style={styles.subtitle}
        >
          View services
        </AppText>
      </View>

      {/* Tap Indicator */}
      <View style={styles.tapIndicator} />
    </TouchableOpacity>
  );
};

const useMemo = (fn: () => any, deps: any[]) => {
  const [value] = React.useState(() => fn());
  React.useEffect(() => {
    // Update value if deps change
  }, deps);
  return value;
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      marginHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'transparent',
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    imageContainer: {
      width: 100,
      height: 100,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    loaderContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `${theme.colors.background}80`,
    },
    placeholderContainer: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      alignItems: 'center',
      flex: 1,
      width: '100%',
    },
    title: {
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
      color: theme.colors.text,
    },
    subtitle: {
      textAlign: 'center',
      fontSize: 12,
    },
    tapIndicator: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
  });

export default ServiceCard;
