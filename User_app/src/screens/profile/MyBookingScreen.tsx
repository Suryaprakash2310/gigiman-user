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
import { useNavigation } from "@react-navigation/native";
import AppHeader from "@/src/components/ui/AppHeader";
import { useTheme } from "@/src/theme/useTheme";
import { BookingAPI } from "@/src/api/booking.api";
import BookingListCard from "@/src/components/BookingListCard";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";
import { BookingItem } from "@/src/context/BookingContext";

const { width } = Dimensions.get("window");

export default function MyBookingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme, insets);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<BookingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const bookings = await BookingAPI.getUserBookings();
        const mapped = (bookings || []).map((b: any) => mapBookingToBookingItem(b));
        // De-duplicate history bookings by _id
        const uniqueMapped = Array.from(
          new Map(mapped.map((item: any) => [item._id, item])).values()
        );
        setHistory(uniqueMapped);
      } catch (e) {
        setError("Failed to load booking history");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCardPress = (item: BookingItem) => {
    navigation.navigate("BookingDetails", { bookingId: item._id });
  };

  const handleBack = () => {
    navigation.navigate('ProfileScreen');
  };

  return (
    <View style={styles.wrapper}>
      <AppHeader title="Booking History" showBack={true} onBackPress={handleBack} showShadow={true} />
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

const makeStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
    content: {
      paddingHorizontal: Math.min(20, width * 0.05),
      paddingTop: 16,
      paddingBottom: 28,
    },
    empty: {
      textAlign: "center",
      marginTop: 40,
      color: theme.colors.textMuted,
    },
  });