import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BookingAPI } from '@/src/api/booking.api';
import { useTheme } from '@/src/theme/useTheme';
import AppHeader from '@/src/components/ui/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/* ===============================
   STATUS STYLE (DYNAMIC)
================================ */
const getStatusChipStyle = (status: string) => ({
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
  backgroundColor:
    status === 'COMPLETED'
      ? '#E6F7EC'
      : status === 'CANCELLED'
      ? '#FDECEA'
      : '#FFF4E5',
});

export default function MyBookingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await BookingAPI.getUserBookings();
      setBookings(data || []);
    } catch (err) {
      console.error('Booking load error', err);
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(theme, insets);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <AppHeader title="My Bookings" showBack showShadow />

      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>No bookings found</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.service}>
                {item.serviceCategoryName || 'Service'}
              </Text>
              <Text style={styles.amount}>₹{item.totalPrice}</Text>
            </View>

            <Text style={styles.sub}>
              Assigned: {item.primaryEmployee?.fullname || '—'}
            </Text>

            <View style={styles.footer}>
              <Text style={styles.date}>
                {new Date(item.createdAt).toDateString()}
              </Text>

              <View style={getStatusChipStyle(item.status)}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

/* ===============================
   STATIC STYLES
================================ */
const makeStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingHorizontal: Math.min(20, width * 0.06),
      paddingTop: insets.top + 12,
      paddingBottom: 28,
    },
    empty: {
      textAlign: 'center',
      marginTop: 40,
      color: theme.colors.textMuted,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: theme.spacing?.md || 14,
      marginBottom: 12,
      elevation: 2,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    service: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    amount: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.success || '#2e7d32',
    },
    sub: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    footer: {
      marginTop: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    date: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });
