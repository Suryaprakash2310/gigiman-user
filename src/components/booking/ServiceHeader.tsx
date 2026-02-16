import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface ServiceHeaderProps {
  name: string;
  price: number;
  duration: number;
  image?: string;
}

const { width } = Dimensions.get('window');

const ServiceHeader: React.FC<ServiceHeaderProps> = ({
  name,
  price,
  duration,
  image,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

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
                ₹{price}
              </AppText>
            </LinearGradient>

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
  });

export default ServiceHeader;
