// src/screens/ServicesScreen.tsx
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/useTheme";
import AppText from "@/src/components/ui/AppText";
import AppBottomSheet, {
  AppBottomSheetRef,
} from "@/src/components/ui/AppBottomSheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

/* ----------------------------- MAIN SERVICE LIST ----------------------------- */

type ServiceItem = {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  priceLabel: string;
};

const SERVICES: ServiceItem[] = [
  { id: "1", title: "AC Service", icon: "ac-unit", priceLabel: "Starts ₹499" },
  { id: "2", title: "Electrical Work", icon: "bolt", priceLabel: "Starts ₹149" },
  { id: "3", title: "Plumbing", icon: "plumbing", priceLabel: "Starts ₹129" },
  { id: "4", title: "Home Cleaning", icon: "cleaning-services", priceLabel: "Starts ₹699" },
  { id: "5", title: "Painting", icon: "format-paint", priceLabel: "Starts ₹999" },
  { id: "6", title: "Carpentry", icon: "holiday-village", priceLabel: "Starts ₹199" },
  { id: "7", title: "Pest Control", icon: "bug-report", priceLabel: "Starts ₹499" },
  { id: "8", title: "Salon at Home", icon: "content-cut", priceLabel: "Starts ₹299" },
];

/* ----------------------------- SUB SERVICE LIST ----------------------------- */

const SUB_SERVICES: Record<
  string,
  Array<{ id: string; title: string; price: string }>
> = {
  "1": [
    { id: "ac1", title: "AC Jet Cleaning", price: "₹499" },
    { id: "ac2", title: "AC Gas Refill", price: "₹1599" },
    { id: "ac3", title: "AC General Service", price: "₹699" },
  ],
  "2": [
    { id: "el1", title: "Fan Installation", price: "₹199" },
    { id: "el2", title: "Tube Light Fitting", price: "₹149" },
    { id: "el3", title: "Switchboard Repair", price: "₹99" },
  ],
  "3": [
    { id: "pl1", title: "Tap Leak Fix", price: "₹129" },
    { id: "pl2", title: "Bathroom Block Removal", price: "₹249" },
  ],
};

/* ----------------------------- MAIN COMPONENT ----------------------------- */

export default function ServicesScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  const sheetRef = useRef<AppBottomSheetRef>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const openSheet = (id: string) => {
    setSelectedServiceId(id);
    sheetRef.current?.expand();
  };

  const filtered = SERVICES.filter((s) =>
    s.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        {/* HEADER */}
        <AppText weight="bold" size="h1" style={{ marginBottom: 12 }}>
          Find Your Service
        </AppText>

        {/* SEARCH BAR */}
        <View style={[styles.searchCard]}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.textMuted}
            style={{ marginRight: 10 }}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search service..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        {/* GRID */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <ServiceCard item={item} onPress={() => openSheet(item.id)} />
          )}
        />
      </View>

      {/* --------------------- BOTTOM SHEET --------------------- */}
      <AppBottomSheet ref={sheetRef} snapPoints={["40%", "70%"]}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <AppText weight="bold" size="h2">
            Choose a Sub-Service
          </AppText>

          {selectedServiceId &&
            SUB_SERVICES[selectedServiceId]?.map((svc) => (
              <TouchableOpacity
                key={svc.id}
                style={styles.subCard}
                onPress={() => {
                  sheetRef.current?.close();
                  navigation.navigate("SubServiceScreen");
                }}
              >
                <AppText weight="semibold" size="body">
                  {svc.title}
                </AppText>
                <AppText weight="bold" color="primary">
                  {svc.price}
                </AppText>
              </TouchableOpacity>
            ))}
        </BottomSheetScrollView>
      </AppBottomSheet>
    </SafeAreaView>
  );
}

/* ----------------------------- SERVICE CARD ----------------------------- */

const ServiceCard = ({
  item,
  onPress,
}: {
  item: ServiceItem;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const s = serviceCardStyles(theme);

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.9} onPress={onPress}>
      <View style={s.iconWrap}>
        <MaterialIcons name={item.icon} size={30} color={theme.colors.primary} />
      </View>

      <AppText weight="semibold" size="body" style={s.title}>
        {item.title}
      </AppText>

      <AppText size="small" color="primary" weight="bold">
        {item.priceLabel}
      </AppText>
    </TouchableOpacity>
  );
};

/* ----------------------------- STYLES ----------------------------- */

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: 18,
    },
    searchCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      marginBottom: 16,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
    },
    subCard: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
  });

const serviceCardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: "48%",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
    },
    iconWrap: {
      width: 50,
      height: 50,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    title: {
      marginBottom: 6,
    },
  });
