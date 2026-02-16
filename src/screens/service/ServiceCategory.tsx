import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  Platform,
  Dimensions,
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

const { width } = Dimensions.get('window');

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

      // Fallback to legacy endpoint shape
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

  const renderContent = () => {
    if (state.loading) {
      return <CategoryCardSkeleton count={5} />;
    }

    if (state.error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={theme.colors.danger}
            style={styles.errorIcon}
          />
          <AppText
            weight="bold"
            size="body"
            color="danger"
            style={styles.errorTitle}
          >
            Oops! Something went wrong
          </AppText>
          <AppText
            size="small"
            color="textMuted"
            style={styles.errorSubtitle}
          >
            {state.error}
          </AppText>
          <View style={styles.retryButtonContainer}>
            {/* You can add a retry button here if needed */}
          </View>
        </View>
      );
    }

    if (state.items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="layers-outline"
            size={48}
            color={theme.colors.textMuted}
            style={styles.emptyIcon}
          />
          <AppText
            weight="semibold"
            size="body"
            color="textMuted"
            style={styles.emptyTitle}
          >
            No services available
          </AppText>
          <AppText
            size="small"
            color="textMuted"
            style={styles.emptySubtitle}
          >
            Check back soon for more services in this category
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {state.items.map((item, index) => (
          <CategoryCard
            key={item._id}
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
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: Platform.OS === 'android' ? insets.top : 0 },
      ]}
    >
      <AppHeader showBack title={serviceName} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <AppText
            weight="bold"
            size="h2"
            style={[styles.headerTitle, { color: theme.colors.text }]}
          >
            Select a Service
          </AppText>
          <AppText
            size="small"
            color="textMuted"
            style={styles.headerSubtitle}
          >
            {state.items.length > 0
              ? `${state.items.length} option${state.items.length !== 1 ? 's' : ''} available`
              : 'Loading options...'}
          </AppText>
        </View>

        {/* Content */}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xl,
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
    listContainer: {
      marginVertical: theme.spacing.sm,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xl,
      minHeight: 300,
    },
    errorIcon: {
      marginBottom: theme.spacing.md,
      opacity: 0.6,
    },
    errorTitle: {
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    errorSubtitle: {
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      fontSize: 13,
    },
    retryButtonContainer: {
      marginTop: theme.spacing.lg,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xl,
      minHeight: 350,
    },
    emptyIcon: {
      marginBottom: theme.spacing.lg,
      opacity: 0.4,
    },
    emptyTitle: {
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptySubtitle: {
      textAlign: 'center',
      fontSize: 13,
    },
  });
