import React from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface SubServiceListProps {
  title: string;
  services: string[];
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

  const renderServiceItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onServiceSelect(item)}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={`Select ${item} service`}
      accessibilityRole="button"
    >
      <View style={styles.itemContent}>
        <AppText weight="semibold" size="body" color="text">
          {item}
        </AppText>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );

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
        keyExtractor={(item) => item}
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
    itemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
