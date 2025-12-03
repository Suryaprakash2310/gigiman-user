import React, { useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import BookingCard from "../components/BookingCard";

// -------------------------------------
// 1) TYPE
// -------------------------------------
type BookingItem = {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  amount: string;
  technicianName?: string;
  paymentMode?: string;
};

// -------------------------------------
// 2) MOCK DATA (Replace with API later)
// -------------------------------------
const MOCK_DATA: Record<"upcoming" | "ongoing", BookingItem[]> = {
  upcoming: [
    {
      id: "1",
      serviceName: "Home Cleaning",
      technicianName: "Raj",
      amount: "149",
      date: "Wed, Oct 10",
      time: "10:00 AM",
    },
  ],

  ongoing: [
    // when search+assign flow is ready, push current booking here
    {
      id: "2",
      serviceName: "Fan Installation",
      technicianName: "Arun Kumar",
      amount: "199",
      date: "Today",
      time: "4:30 PM",
    },
  ],
};

// -------------------------------------
const FILTERS = ["Ongoing", "Upcoming"] as const;
type FilterType = (typeof FILTERS)[number];

export default function BookingScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [activeFilter, setActiveFilter] = useState<FilterType>("Ongoing");

  const getData = () => {
    if (activeFilter === "Upcoming") return MOCK_DATA.upcoming;
    return MOCK_DATA.ongoing;
  };

  const data = getData();
  const empty = data.length === 0;

  const renderCard = (item: BookingItem) => {
    // For now we treat both as "assigned" style; you can later add type="upcoming"
    return (
      <BookingCard
        type="assigned"
        serviceName={item.serviceName}
        amount={item.amount}
        date={item.date}
        time={item.time}
        technicianName={item.technicianName}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* FILTER BUTTONS */}
      <View style={styles.filterRow}>
        {FILTERS.map((label) => {
          const active = activeFilter === label;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => setActiveFilter(label)}
              style={[
                styles.filterButton,
                {
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active
                    ? theme.colors.primary + "15"
                    : theme.colors.surface,
                },
              ]}
            >
              <AppText
                weight={active ? "bold" : "medium"}
                style={{ color: active ? theme.colors.primary : theme.colors.text }}
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
          <View style={styles.emptyIcon} />
          <AppText weight="bold" size="h3" style={{ marginTop: 12 }}>
            {activeFilter === "Ongoing"
              ? "No Ongoing Services"
              : "No Scheduled Services"}
          </AppText>
          <AppText
            color="textMuted"
            style={{ marginTop: 6, textAlign: "center", width: "70%" }}
          >
            {activeFilter === "Ongoing"
              ? "Book a service now and track its live status here."
              : "When you schedule a service for later, it will appear here."}
          </AppText>
        </View>
      )}

      {/* LIST */}
      {!empty && (
        <FlatList<BookingItem>
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => renderCard(item)}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 12,
    },

    filterRow: {
      flexDirection: "row",
      justifyContent: "flex-start",
      marginVertical: 12,
      flexWrap: "wrap",
      columnGap: 12,
    },

    filterButton: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 24,
      borderWidth: 1.5,
      marginBottom: 8,
    },

    listContent: {
      paddingBottom: 60,
    },

    // ----- NO RECORD UI -----
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#EEF1F5",
      opacity: 0.6,
    },
  });
