import React from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { getStatusBadgeConfig, isComingSoon } from '@/src/utils/serviceStatus';

export type SubServiceItem = string | { name: string; status?: string };

interface SubServiceListProps {
  title: string;
  services: SubServiceItem[];
  onServiceSelect: (serviceName: string) => void;
  loading?: boolean;
}

const SubServiceList: React.FC<SubServiceListProps> = ({
  title,
  services,
  onServiceSelect,
  loading = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getItemName = (item: SubServiceItem) =>
    typeof item === 'string' ? item : item.name;

  const getItemStatus = (item: SubServiceItem) =>
    typeof item === 'string' ? undefined : item.status;

  const renderServiceItem = ({ item }: { item: SubServiceItem }) => {
    const name = getItemName(item);
    const status = getItemStatus(item);
    const badgeConfig = getStatusBadgeConfig(status);
    const comingSoon = isComingSoon(status);

    const handlePress = () => {
      if (comingSoon) {
        Alert.alert('Coming Soon', 'This service is coming soon and cannot be booked yet.');
        return;
      }
      onServiceSelect(name);
    };

    return (
      <TouchableOpacity
        style={[styles.item, comingSoon && styles.comingSoonItem]}
        onPress={handlePress}
        activeOpacity={comingSoon ? 0.9 : 0.7}
        accessible={true}
        accessibilityLabel={`Select ${name} service`}
        accessibilityRole="button"
      >
        <View style={styles.itemContent}>
          <View style={styles.nameRow}>
            <AppText weight="semibold" size="body" color="text">
              {name}
            </AppText>
            {badgeConfig && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: badgeConfig.bgColor,
                    borderColor: badgeConfig.borderColor,
                  },
                ]}
              >
                <AppText
                  weight="bold"
                  style={[styles.badgeText, { color: badgeConfig.textColor }]}
                >
                  {badgeConfig.label}
                </AppText>
              </View>
            )}
          </View>
          {comingSoon ? (
            <AppText size="small" color="accent" weight="bold">
              Coming Soon
            </AppText>
          ) : (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textMuted}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <AppText weight="bold" size="h2" style={styles.title}>
      {title}
    </AppText>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <AppText color="textMuted" style={styles.emptyText}>
        No services available
      </AppText>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => getItemName(item)}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    title: {
      marginBottom: theme.spacing.md,
      color: theme.colors.text,
    },
    item: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    comingSoonItem: {
      opacity: 0.85,
    },
    itemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    badgeText: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
    emptyContainer: {
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
    },
  });

export default SubServiceList;
