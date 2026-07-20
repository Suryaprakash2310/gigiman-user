import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface ServiceDescriptionProps {
  description?: string;
  features?: string[];
}

const ServiceDescription: React.FC<ServiceDescriptionProps> = ({
  description,
  features,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const parseDescription = (html?: string) => {
    if (!html) return [] as string[];
    let text = html.replace(/<\/p>\s*<p>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return text
      .split(/\r?\n/)
      .map((s) => s.trim().replace(/^[✓✔☑]\s*/, ''))
      .filter(Boolean);
  };

  const descriptionPoints = useMemo(
    () => parseDescription(description),
    [description]
  );

  const allFeatures = features || descriptionPoints;

  if (!description && (!features || features.length === 0)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="list"
          size={20}
          color={theme.colors.primary}
          weight="bold"
        />
        <AppText
          weight="bold"
          size="body"
          style={[styles.title, { color: theme.colors.text }]}
        >
          Service Includes
        </AppText>
      </View>

      <View style={styles.featuresContainer}>
        {allFeatures.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <AppText
              size="body"
              numberOfLines={3}
              style={[styles.featureText, { color: theme.colors.text }]}
            >
              {feature}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      marginVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      marginHorizontal: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    title: {
      marginBottom: 0,
    },
    featuresContainer: {
      gap: theme.spacing.md,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    featureText: {
      flex: 1,
      lineHeight: 20,
    },
  });

export default ServiceDescription;
