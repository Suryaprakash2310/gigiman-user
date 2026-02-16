import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import AppLoader from "@/src/components/ui/AppLoader";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppBottomSheet, {
  AppBottomSheetRef,
} from "@/src/components/ui/AppBottomSheet";
import AppHeader from "@/src/components/ui/AppHeader";
import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";

import { DomainService, ServiceAPI } from "@/src/api/service.api";
import ServiceCard from "@/src/components/service/ServiceCard";
import ServiceSearchBar from "@/src/components/service/ServiceSearchBar";
import SubServiceList from "@/src/components/service/SubServiceList";

interface ServiceState {
  services: DomainService[];
  loading: boolean;
  error: string | null;
}

interface SubServiceState {
  services: string[];
  loading: boolean;
  error: string | null;
}

const { width } = Dimensions.get("window");

export default function ServicesScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<AppBottomSheetRef>(null);

  // State management
  const [serviceState, setServiceState] = useState<ServiceState>({
    services: [],
    loading: true,
    error: null,
  });

  const [subServiceState, setSubServiceState] = useState<SubServiceState>({
    services: [],
    loading: false,
    error: null,
  });

  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState("");

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = useCallback(async () => {
    try {
      setServiceState((prev) => ({ ...prev, loading: true, error: null }));
      const res = await ServiceAPI.getServicesAPI();
      const servicesList = res.services || [];
      setServiceState({
        services: servicesList,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error loading services:", err);
      setServiceState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load services. Please try again.",
      }));
    }
  }, []);

  const loadSubServices = useCallback(
    async (domainName: string, domainId: string) => {
      setSelectedDomain(domainName);
      setSelectedDomainId(domainId);

      try {
        setSubServiceState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        const res = await ServiceAPI.getSubServicesByDomainId(domainId);
        const list = res?.services || res?.categoriesservices || [];
        const names = (list as any[])
          .map(
            (s) =>
              s?.serviceName ||
              s?.parentServiceName ||
              s?.serviceCategoryName
          )
          .filter(Boolean);

        setSubServiceState({
          services: names,
          loading: false,
          error: null,
        });

        sheetRef.current?.expand();
      } catch (err) {
        console.error("Error loading sub-services:", err);
        setSubServiceState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load sub-services.",
        }));
      }
    },
    []
  );

  const handleServiceCardPress = useCallback(
    (domainName: string, domainId: string) => {
      loadSubServices(domainName, domainId);
    },
    [loadSubServices]
  );

  const handleSubServiceSelect = useCallback(
    (serviceName: string) => {
      sheetRef.current?.close();
      navigation.navigate("ServiceCategory", {
        serviceName: serviceName,
        domainId: selectedDomainId,
      });
    },
    [navigation, selectedDomainId]
  );

  const filteredServices = serviceState.services.filter((s) =>
    s.domainName.toLowerCase().includes(search.toLowerCase())
  );

  const renderServiceGrid = useCallback(
    ({ item }: { item: DomainService }) => (
      <ServiceCard
        service={item}
        onPress={handleServiceCardPress}
      />
    ),
    [handleServiceCardPress]
  );

  const keyExtractor = useCallback((item: DomainService) => item._id, []);

  if (serviceState.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Services" showBack />
        <View style={styles.loadingContainer}>
          <AppLoader visible={true} text="Loading services..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: Platform.OS === "android" ? insets.top : 0 },
      ]}
    >
      <AppHeader title="Services" showBack />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerSection}>
          <AppText weight="bold" size="h1" style={styles.title}>
            Find Your Service
          </AppText>
          <AppText
            size="small"
            color="textMuted"
            style={styles.subtitle}
          >
            Browse and select the service you need
          </AppText>
        </View>

        {/* Search Bar */}
        <ServiceSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search services..."
        />

        {/* Error State */}
        {serviceState.error && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={theme.colors.danger}
            />
            <AppText
              size="small"
              color="danger"
              style={styles.errorText}
            >
              {serviceState.error}
            </AppText>
          </View>
        )}

        {/* Service Grid */}
        {filteredServices.length === 0 && !serviceState.loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
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
              {search ? "No services found" : "No services available"}
            </AppText>
            <AppText
              size="small"
              color="textMuted"
              style={styles.emptySubtitle}
            >
              {search
                ? "Try adjusting your search terms"
                : "Check back soon for more services"}
            </AppText>
            {search && (
              <View
                style={{
                  marginTop: theme.spacing.lg,
                  paddingHorizontal: theme.spacing.lg,
                }}
              >
                {/* Clear search button would go here */}
              </View>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            keyExtractor={keyExtractor}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
            renderItem={renderServiceGrid}
            initialNumToRender={6}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
          />
        )}
      </View>

      {/* Bottom Sheet for Sub-Services */}
      <AppBottomSheet
        ref={sheetRef}
        snapPoints={["45%", "75%"]}
        enableScroll={true}
      >
        {subServiceState.loading ? (
          <View style={styles.loaderWrapper}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />
            <AppText
              size="body"
              style={[
                styles.loaderText,
                { color: theme.colors.textMuted },
              ]}
            >
              Loading sub-services...
            </AppText>
          </View>
        ) : subServiceState.error ? (
          <View style={styles.errorWrapper}>
            <Ionicons
              name="alert-circle"
              size={32}
              color={theme.colors.danger}
            />
            <AppText
              weight="semibold"
              size="body"
              color="danger"
              style={styles.errorWrapperText}
            >
              {subServiceState.error}
            </AppText>
          </View>
        ) : (
          <SubServiceList
            title={selectedDomain}
            services={subServiceState.services}
            onServiceSelect={handleSubServiceSelect}
          />
        )}
      </AppBottomSheet>
    </SafeAreaView>
  );
}

/* ----------------------------- STYLES ----------------------------- */

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    headerSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    title: {
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 14,
    },
    columnWrapper: {
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.sm,
    },
    listContent: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.xl,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: theme.spacing.xl,
    },
    emptyIcon: {
      marginBottom: theme.spacing.lg,
      opacity: 0.5,
    },
    emptyTitle: {
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      textAlign: "center",
      fontSize: 13,
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: `${theme.colors.danger}15`,
      borderRadius: theme.radius.md,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.danger,
    },
    errorText: {
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    loaderWrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: theme.spacing.xl,
    },
    loaderText: {
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
    errorWrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: theme.spacing.xl,
    },
    errorWrapperText: {
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
  });
