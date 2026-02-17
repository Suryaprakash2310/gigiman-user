import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  Platform,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceAPI } from '@/src/api/service.api';
import AppHeader from '@/src/components/ui/AppHeader';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import CategoryCard from '@/src/components/service/CategoryCard';
import CategoryCardSkeleton from '@/src/components/service/CategoryCardSkeleton';

interface CategoryItem {
  _id: string;
  serviceCategoryName: string;
  servicecategoryImage?: string;
  description?: string;
  price?: number;
  durationInMinutes?: number;
  employeeCount?: number;
}

interface CategoryState {
  items: CategoryItem[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export default function ServiceCategory({ route, navigation }: any) {
  const { serviceName, domainId } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<CategoryState>({
    items: [],
    loading: true,
    error: null,
    refreshing: false,
  });

  useEffect(() => {
    loadCategories();
  }, [serviceName, domainId]);

  const loadCategories = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      if (domainId) {
        const res = await ServiceAPI.getSubServicesByDomainId(domainId);
        const services = res?.services || [];
        const svc = services.find((s: any) => s.serviceName === serviceName);
        const cats = (svc?.serviceCategory || []) as CategoryItem[];

        setState((prev) => ({
          ...prev,
          items: cats,
          loading: false,
        }));
        return;
      }

      const res = await ServiceAPI.getSubServicesAPI();
      const filtered = (res.categoriesservices || []).filter(
        (c: any) => c.parentServiceName === serviceName
      ) as CategoryItem[];

      setState((prev) => ({
        ...prev,
        items: filtered,
        loading: false,
      }));
    } catch (err) {
      console.error('Error loading categories:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to load categories. Please try again.',
      }));
    }
  }, [serviceName, domainId]);

  const handleRefresh = useCallback(async () => {
    setState((prev) => ({ ...prev, refreshing: true }));
    await loadCategories();
    setState((prev) => ({ ...prev, refreshing: false }));
  }, [loadCategories]);

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      navigation.navigate('Booking', {
        serviceCategoryId: categoryId,
      });
    },
    [navigation]
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <AppText
        weight="bold"
        size="h2"
        style={[styles.headerTitle, { color: theme.colors.text }]}
      >
        Select a Service
      </AppText>
      <AppText size="small" color="textMuted" style={styles.headerSubtitle}>
        {state.items.length > 0
          ? `${state.items.length} option${
              state.items.length !== 1 ? 's' : ''
            } available`
          : 'Loading options...'}
      </AppText>
    </View>
  );

  const renderEmptyOrError = () => {
    if (state.loading) {
      return <CategoryCardSkeleton count={5} />;
    }

    if (state.error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={theme.colors.danger}
            style={{ marginBottom: 12 }}
          />
          <AppText weight="bold" size="body" color="danger">
            Oops! Something went wrong
          </AppText>
          <AppText size="small" color="textMuted" style={{ marginTop: 6 }}>
            {state.error}
          </AppText>
        </View>
      );
    }

    if (state.items.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons
            name="layers-outline"
            size={48}
            color={theme.colors.textMuted}
            style={{ marginBottom: 12 }}
          />
          <AppText weight="semibold" size="body" color="textMuted">
            No services available
          </AppText>
          <AppText size="small" color="textMuted" style={{ marginTop: 6 }}>
            Check back soon for more services
          </AppText>
        </View>
      );
    }

    return null;
  };

  return (
    <View
      style={[
        styles.safe,
        { paddingTop: Platform.OS === 'android' ? insets.top : 0 },
      ]}
    >
      <AppHeader showBack title={serviceName} />
     <View >
      <FlatList
      //style={{ flex: 1 }}
        data={state.items}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <CategoryCard
            id={item._id}
            image={item.servicecategoryImage}
            title={item.serviceCategoryName}
            description={item.description}
            price={item.price}
            duration={item.durationInMinutes}
            employeeCount={item.employeeCount}
            onPress={() => handleCategoryPress(item._id)}
            index={index}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyOrError}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={{
          //paddingBottom: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      />
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    headerTitle: {
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: 13,
    },
    centerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xl,
      flex: 1,
    },
  });