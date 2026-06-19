// src/screens/MyBookingsScreen.tsx

import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "@/src/components/ui/AppHeader";
import { useTheme } from "@/src/theme/useTheme";
import { BookingAPI } from "@/src/api/booking.api";
const { width } = Dimensions.get("window");

export default function MyBookingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme, insets);

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const bookings = await BookingAPI.getUserBookings();
        setHistory(bookings || []);
      } catch (e) {
        setError("Failed to load booking history");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.wrapper}>
      <AppHeader title="Booking History" showBack showShadow />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : error ? (
        <Text style={styles.empty}>{error}</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={<Text style={styles.empty}>No booking history found</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.service}>{item.serviceCategoryName}</Text>
                <Text style={styles.amount}>₹{item.totalPrice || 0}</Text>
              </View>
              <Text style={styles.sub}>{item.address}</Text>
              <View style={styles.footer}>
                <Text style={styles.status}>{item.status}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
    tabContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginVertical: 12,
    },
    tabButton: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 20,
      marginHorizontal: 6,
      backgroundColor: theme.colors.surface,
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      color: theme.colors.text,
      fontWeight: "600",
    },
    content: {
      paddingHorizontal: Math.min(20, width * 0.06),
      paddingBottom: 28,
    },
    empty: {
      textAlign: "center",
      marginTop: 40,
      color: theme.colors.textMuted,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      elevation: 2,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    service: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.text,
    },
    amount: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.success || "#2e7d32",
    },
    sub: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    footer: {
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    status: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.primary,
    },
  });