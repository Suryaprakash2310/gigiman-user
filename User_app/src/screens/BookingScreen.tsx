import AppText from "@/src/components/ui/AppText";
import { BookingItem, useBooking } from "@/src/context/BookingContext";
import { useTheme } from "@/src/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingAPI } from "../api/booking.api";
import BookingListCard from "../components/BookingListCard";
import AppHeader from "../components/ui/AppHeader";
import { BookingParamList } from "../navigation/stacks/BookingStack";

type TabType = "ongoing" | "manualAssignment" | "upcoming" | "history";
type BookingRouteProp = RouteProp<BookingParamList, "BookingsMain">;

export default function BookingScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<any>();
  const route = useRoute<BookingRouteProp>();
  const { ongoing, upcoming, manualBookings, refreshBookings } = useBooking();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>("ongoing");
  const [refreshing, setRefreshing] = useState(false);
  const prevManualBookingsCount = useRef(manualBookings?.length || 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshBookings();
    } catch (err) {
      console.warn("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshBookings]);

  // Handle initial tab from params or logic
  useEffect(() => {
    // 1. Check if tab was explicitly passed from navigation
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab as TabType);
    }
    // 2. If no param, auto-select based on status
    else if (ongoing.length > 0) {
      setActiveTab("ongoing");
    } else if (manualBookings?.length > 0) {
      setActiveTab("manualAssignment");
    } else if (upcoming.length > 0) {
      setActiveTab("upcoming");
    }
  }, [route.params?.activeTab]);

  // Auto-switch tabs if a manual booking gets assigned
  useEffect(() => {
    if (
      activeTab === "manualAssignment" &&
      (manualBookings?.length || 0) === 0 &&
      prevManualBookingsCount.current > 0 &&
      ongoing.length > 0
    ) {
      setActiveTab("ongoing");
    }
    prevManualBookingsCount.current = manualBookings?.length || 0;
  }, [manualBookings?.length, ongoing.length, activeTab]);

  // History state
  const [historyBookings, setHistoryBookings] = useState<BookingItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch history when tab is selected
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const bookings = await BookingAPI.getUserBookings();
      const mapped: BookingItem[] = (bookings || []).map((b: any) => ({
        _id: b._id,
        serviceCategoryName: b.serviceCategoryName || "",
        address: b.address || "",
        status: "completed" as const,
        totalPrice: b.totalPrice ?? b.cost,
        name: b.primaryEmployee?.fullname || b.name || "",
        rating: b.primaryEmployee?.rating,
        durationInMinutes: b.durationInMinutes,
        dateLabel: b.createdAt
          ? new Date(b.createdAt).toLocaleDateString()
          : "",
        timeLabel: b.createdAt
          ? new Date(b.createdAt).toLocaleTimeString()
          : "",
      }));
      setHistoryBookings(mapped);
    } catch (err) {
      console.log("History fetch error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // Get data for current tab
  const getTabData = (): BookingItem[] => {
    if (activeTab === "history") return historyBookings;
    if (activeTab === "manualAssignment") return manualBookings || [];

    const rawData = activeTab === "ongoing" ? ongoing : upcoming;
    return rawData.filter(
      b => b.status !== "completed" && b.status !== "cancelled"
    );
  };

  const data = getTabData();
  const empty = data.length === 0;

  const handleCardPress = (booking: BookingItem) => {
    if (booking.assignmentStatus === "FAILED" || booking.status === "manual_assign") {
      navigation.navigate("BookingDetails", { bookingId: booking._id });
      return;
    }

    if (booking.status === "searching") {
      navigation.navigate("Searching", { bookingId: booking._id });
      return;
    }

    if (
      booking.status === "otp" ||
      booking.status === "in_progress" ||
      booking.status === "assigned"
    ) {
      navigation.navigate("BookingDetails", { bookingId: booking._id });
      return;
    }

    if (booking.status === "completed") {
      //navigation.navigate("Review", { bookingId: booking._id });
      return;
    }

    if (booking.status === "scheduled") {
      // still waiting for time
      return;
    }
  };

  const getEmptyText = () => {
    switch (activeTab) {
      case "ongoing":
        return {
          title: "No Ongoing Services",
          subtitle: "Book a service and track its live status here.",
        };
      case "manualAssignment":
        return {
          title: "No Bookings Pending Assignment",
          subtitle: "Bookings awaiting admin manual assignment will show here.",
        };
      case "upcoming":
        return {
          title: "No Upcoming Services",
          subtitle: "Your scheduled services will show here.",
        };
      case "history":
        return {
          title: "No Completed Bookings",
          subtitle: "Your completed service history will appear here.",
        };
    }
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "ongoing", label: "Ongoing", icon: "pulse-outline" },
    { key: "upcoming", label: "Upcoming", icon: "calendar-outline" },
    { key: "manualAssignment", label: "Awaiting Assignment", icon: "person-add-outline" },
    { key: "history", label: "History", icon: "time-outline" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <AppHeader title="Your Bookings" />
      </View>

      {/* TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollStyle}
        contentContainerStyle={styles.tabRow}
      >
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          const rawData = tab.key === "ongoing" ? ongoing : upcoming;
          const count =
            tab.key === "history"
              ? historyBookings.length
              : tab.key === "manualAssignment"
                ? (manualBookings?.length || 0)
                : rawData.filter(
                    b => b.status !== "completed" && b.status !== "cancelled"
                  ).length;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
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
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={active ? "#fff" : theme.colors.text}
                style={{ marginRight: 4 }}
              />
              <AppText
                weight={active ? "bold" : "medium"}
                style={{
                  color: active ? "#fff" : theme.colors.text,
                }}
              >
                {tab.label}
              </AppText>
              {count > 0 && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: active ? "#fff" : theme.colors.primary,
                    },
                  ]}
                >
                  <AppText
                    weight="bold"
                    style={[
                      styles.badgeText,
                      {
                        color: active ? theme.colors.primary : "#fff",
                      },
                    ]}
                  >
                    {count}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* LOADING (History tab) */}
      {activeTab === "history" && historyLoading && (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText color="textMuted" style={{ marginTop: 12 }}>
            Loading booking history...
          </AppText>
        </View>
      )}

      {/* EMPTY STATE */}
      {empty && !(activeTab === "history" && historyLoading) && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <Ionicons
              name={
                activeTab === "ongoing"
                  ? "construct-outline"
                  : activeTab === "manualAssignment"
                    ? "person-add-outline"
                    : activeTab === "upcoming"
                      ? "calendar-outline"
                      : "checkmark-done-outline"
              }
              size={40}
              color="#9CA3AF"
            />
          </View>
          <AppText weight="bold" size="h3" style={{ marginTop: 12 }}>
            {getEmptyText().title}
          </AppText>
          <AppText
            color="textMuted"
            style={{ marginTop: 6, textAlign: "center", width: "70%" }}
          >
            {getEmptyText().subtitle}
          </AppText>
        </View>
      )}

      {/* LIST */}
      {!empty && !(activeTab === "history" && historyLoading) && (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          style={[styles.list, activeTab === "history" && { marginTop: 20 }]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
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
      flexShrink: 0,
    },
    tabScrollStyle: {
      height: 52,
      marginBottom: 12,
      flexShrink: 0,
      flexGrow: 0,
    },
    tabRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingRight: 16,
    },
    tabButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    badge: {
      marginLeft: 6,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 10,
      lineHeight: 12,
    },
    list: {
      flex: 1,
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
      backgroundColor: "#F3F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
  });
