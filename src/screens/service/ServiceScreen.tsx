import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { useTheme } from "@/src/theme/useTheme";
import AppText from "@/src/components/ui/AppText";
import AppHeader from "@/src/components/ui/AppHeader";
import AppBottomSheet, {
  AppBottomSheetRef,
} from "@/src/components/ui/AppBottomSheet";

import { ServiceAPI, DomainService } from "@/src/api/service.api";

export default function ServicesScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const cardStyles = serviceCardStyles(theme);
  const insets = useSafeAreaInsets();

  const sheetRef = useRef<AppBottomSheetRef>(null);

  const [services, setServices] = useState<DomainService[]>([]);
  const [search, setSearch] = useState("");
  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const res = await ServiceAPI.getServicesAPI();
    setServices(res.services || []);
  };

  const openBottomSheet = async (domainName: string, domainId: string) => {
    setSelectedDomain(domainName);
    setSelectedDomainId(domainId);
    const res = await ServiceAPI.getSubServicesByDomainId(domainId);
    console.log("subservices::", res);
    // API returns { success: true, services: [...] } where each item has `serviceName`.
    // Fallback to other shapes if present (categoriesservices, etc.).
    const list = res?.services || res?.categoriesservices || [];
    const names = (list as any[])
      .map((s) => s?.serviceName || s?.parentServiceName || s?.serviceCategoryName)
      .filter(Boolean);
    setServiceNames(names);
    sheetRef.current?.expand();
  };

  const filteredServices = services.filter((s) =>
    s.domainName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: Platform.OS === "android" ? insets.top : 0 },
      ]}
    >
      <AppHeader title="Services" showBack />

      <View style={styles.container}>
        <AppText weight="bold" size="h1">
          Find Your Service
        </AppText>

        {/* SEARCH */}
        <View style={styles.searchCard}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.textMuted}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search service"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        {/* GRID */}
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={cardStyles.card}
              onPress={() => openBottomSheet(item.domainName, item._id)}
            >
              <View style={cardStyles.iconWrap}>
                <MaterialIcons
                  name="home-repair-service"
                  size={26}
                  color={theme.colors.primary}
                />
              </View>

              <AppText
                weight="semibold"
                numberOfLines={2}
                style={cardStyles.title}
              >
                {item.domainName}
              </AppText>

              <AppText size="small" style={{ color: theme.colors.textMuted }}>
                Tap to view services
              </AppText>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <AppText style={{ color: theme.colors.textMuted }}>
                No services found
              </AppText>
            </View>
          }
        />
      </View>

      {/* BOTTOM SHEET */}
      <AppBottomSheet ref={sheetRef} snapPoints={["40%", "70%"]}>
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <AppText weight="bold" size="h2">
            {selectedDomain}
          </AppText>

          {serviceNames.map((name) => (
            <TouchableOpacity
              key={name}
              style={styles.sheetItem}
                onPress={() => {
                sheetRef.current?.close();
                navigation.navigate("ServiceCategory", {
                  serviceName: name,
                  domainId: selectedDomainId,
                });
              }}
            >
              <AppText weight="semibold">{name}</AppText>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </BottomSheetScrollView>
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
      paddingHorizontal: theme.spacing.lg,
    },
    searchCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      marginVertical: theme.spacing.md,
      ...theme.shadow.sm,
    },
    searchInput: {
      flex: 1,
      marginLeft: theme.spacing.sm,
      fontSize: 15,
      color: theme.colors.text,
    },
    columnWrap: {
      justifyContent: "space-between",
    },
    emptyWrap: {
      alignItems: "center",
      marginTop: 40,
    },
    sheetContent: {
      padding: theme.spacing.lg,
    },
    sheetItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
  });

const serviceCardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: "48%",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      ...theme.shadow.sm,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.sm,
    },
    title: {
      marginBottom: 4,
    },
  });
