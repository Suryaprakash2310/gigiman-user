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
import BookingListCard from "../components/BookingListCard";

type TabType = "ongoing" | "upcoming";

export default function BookingScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<any>();
  const { ongoing, upcoming } = useBooking();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>("ongoing");

  const rawData = activeTab === "ongoing" ? ongoing : upcoming;

  const data = rawData.filter(
    b => b.status !== "completed" && b.status !== "cancelled"
  ); const empty = data.length === 0;

  const handleCardPress = (booking: BookingItem) => {

    if (booking.status === "searching") {
      navigation.navigate("Searching", { bookingId: booking._id });
      return;
    }

    if (booking.status === "otp" || booking.status === "in_progress") {
      navigation.navigate("BookingDetails", { bookingId: booking._id });
      return;
    }

    if (booking.status === "completed") {
      navigation.navigate("Review", { bookingId: booking._id });
      return;
    }

    if (booking.status === "scheduled") {
      // still waiting for time
      return;
    }

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


