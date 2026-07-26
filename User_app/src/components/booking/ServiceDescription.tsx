import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface ServiceDescriptionProps {
  description?: string;
  features?: string[];
}

export interface ParsedSections {
  includes: string[];
  excludes: string[];
}

const cleanLine = (str: string) => {
  return str
    .replace(/^[•▪◦⁃‣]\s*/, '')
    .replace(/^[\-\*]\s+/, '')
    .replace(/^[✅❌✕]\s*/, '')
    .replace(/^service\s*includes?:?\s*/i, '')
    .replace(/^(not\s*included|service\s*not\s*included|excludes?):?\s*/i, '')
    .trim();
};

const isIncludesHeader = (line: string) => {
  const clean = line
    .replace(/^[✅✔✓☑\s]+/, '')
    .replace(/[:\s]+$/, '')
    .trim()
    .toLowerCase();

  return (
    clean === 'service includes' ||
    clean === 'service include' ||
    clean === 'includes' ||
    clean === 'include' ||
    clean === "what's included" ||
    clean === 'whats included' ||
    clean.startsWith('service includes') ||
    clean.startsWith('includes')
  );
};

const isExcludesHeader = (line: string) => {
  const clean = line
    .replace(/^[❌✕\s]+/, '')
    .replace(/[:\s]+$/, '')
    .trim()
    .toLowerCase();

  return (
    clean === 'not included' ||
    clean === 'service not included' ||
    clean === 'excludes' ||
    clean === 'exclude' ||
    clean === "what's not included" ||
    clean === 'whats not included' ||
    clean.startsWith('not included') ||
    clean.startsWith('excludes')
  );
};

const parseDescription = (html?: string): ParsedSections => {
  if (!html) return { includes: [], excludes: [] };

  // Step 1: Replace all block HTML tags with newlines to avoid text concatenation
  let text = html
    .replace(/<\/(p|div|li|ul|ol|h[1-6]|tr|td)>/gi, '\n')
    .replace(/<(p|div|li|ul|ol|h[1-6]|tr|td)[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');

  // Step 2: Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Step 3: Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Step 4: Break inline headers and bullet points into newlines if joined (without splitting hyphenated words like Move-in/Move-out)
  text = text
    .replace(/([✅✔✓☑])\s*(service\s*includes?|what['’]?s\s*included|includes?)/gi, '\n$1 $2\n')
    .replace(/([❌✕])\s*(not\s*included|service\s*not\s*included|excludes?|what['’]?s\s*not\s*included)/gi, '\n$1 $2\n')
    .replace(/([•▪◦⁃‣])|(?<=\s|^)\-(?=\s)|(?<=\s|^)\*(?=\s)/g, '\n$1');

  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const includes: string[] = [];
  const excludes: string[] = [];
  let currentSection: 'includes' | 'excludes' = 'includes';

  for (const rawLine of lines) {
    if (isIncludesHeader(rawLine)) {
      currentSection = 'includes';
      continue;
    }
    if (isExcludesHeader(rawLine)) {
      currentSection = 'excludes';
      continue;
    }

    const item = cleanLine(rawLine);
    if (!item) continue;

    if (currentSection === 'excludes') {
      excludes.push(item);
    } else {
      includes.push(item);
    }
  }

  return { includes, excludes };
};

const ServiceDescription: React.FC<ServiceDescriptionProps> = ({
  description,
  features,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const parsed = useMemo(
    () => parseDescription(description),
    [description]
  );

  const includesList = features && features.length > 0 ? features : parsed.includes;
  const excludesList = parsed.excludes;

  if (includesList.length === 0 && excludesList.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* SERVICE INCLUDES CARD */}
      {includesList.length > 0 && (
        <View style={[styles.card, styles.includesCard]}>
          <View style={styles.header}>
            <View style={[styles.headerIconContainer, styles.includesIconBg]}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={theme.dark ? '#34D399' : '#059669'}
              />
            </View>
            <AppText
              weight="bold"
              size="body"
              style={[styles.title, { color: theme.colors.text }]}
            >
              Service Includes
            </AppText>
            <View style={[styles.badge, styles.includesBadge]}>
              <AppText size="caption" style={styles.includesBadgeText}>
                {includesList.length} items
              </AppText>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {includesList.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons
                  name="checkmark-sharp"
                  size={16}
                  color={theme.dark ? '#34D399' : '#059669'}
                  style={styles.bulletIcon}
                />
                <AppText
                  size="body"
                  style={[styles.featureText, { color: theme.colors.text }]}
                >
                  {feature}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* NOT INCLUDED CARD */}
      {excludesList.length > 0 && (
        <View style={[styles.card, styles.excludesCard]}>
          <View style={styles.header}>
            <View style={[styles.headerIconContainer, styles.excludesIconBg]}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.dark ? '#F87171' : '#DC2626'}
              />
            </View>
            <AppText
              weight="bold"
              size="body"
              style={[styles.title, { color: theme.colors.text }]}
            >
              Not Included
            </AppText>
            <View style={[styles.badge, styles.excludesBadge]}>
              <AppText size="caption" style={styles.excludesBadgeText}>
                {excludesList.length} items
              </AppText>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {excludesList.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons
                  name="close-sharp"
                  size={15}
                  color={theme.dark ? '#F87171' : '#DC2626'}
                  style={styles.bulletIcon}
                />
                <AppText
                  size="body"
                  style={[
                    styles.featureText,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {feature}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginVertical: theme.spacing.sm,
      marginHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    card: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
    },
    includesCard: {
      backgroundColor: theme.dark ? '#064E3B20' : '#ECFDF5',
      borderColor: theme.dark ? '#05966940' : '#A7F3D0',
    },
    excludesCard: {
      backgroundColor: theme.dark ? '#7F1D1D20' : '#FEF2F2',
      borderColor: theme.dark ? '#DC262640' : '#FECACA',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    headerIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    includesIconBg: {
      backgroundColor: theme.dark ? '#064E3B60' : '#D1FAE5',
    },
    excludesIconBg: {
      backgroundColor: theme.dark ? '#7F1D1D60' : '#FEE2E2',
    },
    title: {
      fontSize: 16,
      flex: 1,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radius.round,
    },
    includesBadge: {
      backgroundColor: theme.dark ? '#05966930' : '#D1FAE5',
    },
    includesBadgeText: {
      color: theme.dark ? '#34D399' : '#047857',
      fontWeight: '600',
    },
    excludesBadge: {
      backgroundColor: theme.dark ? '#DC262630' : '#FEE2E2',
    },
    excludesBadgeText: {
      color: theme.dark ? '#F87171' : '#B91C1C',
      fontWeight: '600',
    },
    featuresContainer: {
      gap: theme.spacing.sm,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 2,
    },
    bulletIcon: {
      marginRight: theme.spacing.sm,
      marginTop: 2,
    },
    featureText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
  });

export default ServiceDescription;


