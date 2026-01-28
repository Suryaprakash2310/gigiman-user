import AppCard from "@/src/components/ui/AppCard";
import AppText from "@/src/components/ui/AppText";
import { BookingItem, useBooking } from "@/src/context/BookingContext";
import { useTheme } from "@/src/theme/useTheme";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from "../components/ui/AppHeader";

type TabType = "ongoing" | "upcoming";

export default function BookingScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<any>();
  const { ongoing, upcoming } = useBooking();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>("ongoing");

  const data = activeTab === "ongoing" ? ongoing : upcoming;
  const empty = data.length === 0;

  const handleCardPress = (booking: BookingItem) => {
    if (booking.status === "searching") {
      navigation.navigate("Searching", { bookingId: booking._id });
      return;
    }
  
    // assigned or upcoming → open details
    navigation.navigate("BookingDetails", { bookingId: booking._id });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <AppHeader title="Your Bookings" />
      </View>

      {/* TABS */}
      <View style={styles.tabRow}>
        {(["ongoing", "upcoming"] as TabType[]).map((tab) => {
          const label = tab === "ongoing" ? "Ongoing" : "Upcoming";
          const active = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButton,
                {
                  backgroundColor: active
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: active
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              <AppText
                weight={active ? "bold" : "medium"}
                style={{
                  color: active ? "#fff" : theme.colors.text,
                }}
              >
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* EMPTY STATE */}
      {empty && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle} />
          <AppText weight="bold" size="h3" style={{ marginTop: 12 }}>
            {activeTab === "ongoing"
              ? "No Ongoing Services"
              : "No Upcoming Services"}
          </AppText>
          <AppText
            color="textMuted"
            style={{ marginTop: 6, textAlign: "center", width: "70%" }}
          >
            {activeTab === "ongoing"
              ? "Book a service and track its live status here."
              : "Your scheduled services will show here."}
          </AppText>
        </View>
      )}

      {/* LIST */}
      {!empty && (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BookingListCard
              booking={item}
              onPress={() => handleCardPress(item)}
            />
          )}
        />
      )}
    </View>
  );
}

/* ------------ SMALL CARD COMPONENT ------------- */

const BookingListCard = ({
  booking,
  onPress,
}: {
  booking: BookingItem;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const s = cardStyles(theme);

  const isSearching = booking.status === "searching";
  const statusLabel = isSearching ? "Searching technician…" : "Technician assigned";

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <AppCard style={s.card}>
        <View style={s.rowTop}>
          <AppText weight="bold" size="body">
            {booking.serviceName}
          </AppText>
          <AppText weight="bold" size="body" style={{ color: theme.colors.primary }}>
            ₹{booking.amount}
          </AppText>
        </View>

        <View style={s.rowMid}>
          <AppText size="small" color="textMuted">
            {booking.dateLabel} • {booking.timeLabel}
          </AppText>
          <AppText size="small" color="textMuted">
            {booking.address}
          </AppText>
        </View>

        <View style={s.rowBottom}>
          <View
            style={[
              s.pill,
              { backgroundColor: isSearching ? "#FEF3C7" : "#DCFCE7" },
            ]}
          >
            <AppText
              size="small"
              weight="semibold"
              style={{
                color: isSearching ? "#B45309" : "#166534",
              }}
            >
              {statusLabel}
            </AppText>
          </View>

          {booking.status === "assigned" && booking.technicianName && (
            <AppText size="small" color="textMuted">
              With {booking.technicianName}
            </AppText>
          )}
        </View>
      </AppCard>
    </TouchableOpacity>
  );
};

/* ------------ STYLES ------------- */

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    headerRow: {
      marginBottom: 12,
    },
    tabRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    tabButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    listContent: {
      paddingBottom: 40,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: "#E5E7EB",
      opacity: 0.5,
    },
  });

const cardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      padding: 14,
      marginBottom: 12,
      borderRadius: 16,
    },
    rowTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    rowMid: {
      marginBottom: 8,
    },
    rowBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
  });
