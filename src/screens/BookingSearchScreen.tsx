import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import AppText from "@/src/components/ui/AppText";
import AppCard from "@/src/components/ui/AppCard";
import { useTheme } from "@/src/theme/useTheme";
import { useBooking } from "@/src/context/BookingContext";
import { BookingParamList } from "@/src/navigation/stacks/BookingStack";

type SearchingRoute = RouteProp<BookingParamList, "Searching">;

export default function BookingSearchScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<any>();
  const route = useRoute<SearchingRoute>();
  const { bookingId } = route.params;

  const { getBookingById, updateBooking, cancelBooking } = useBooking();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const booking = getBookingById(bookingId);

  // progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // simulate technician assignment
  useEffect(() => {
    if (!booking) return;
    if (booking.status !== "searching") return;

    const timer = setTimeout(() => {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      updateBooking(booking.id, {
        status: "assigned",
        otp,
        technicianName: "Arun Kumar",
        technicianPhone: "+91 98765 43210",
        technicianRating: 4.9,
      });

      navigation.replace("BookingDetails", { bookingId: booking.id });
    }, 8000);

    return () => clearTimeout(timer);
  }, [booking?.id, booking?.status]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["20%", "80%"],
  });

  if (!booking) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <AppText>No booking found.</AppText>
      </View>
    );
  }

  const handleCancelBooking = () => {
    cancelBooking(booking.id);
    setIsModalVisible(false);
    navigation.navigate("BookingsMain");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.headerSection}>
          <View style={styles.iconHolder}>
            <Feather name="search" size={75} color={theme.colors.primary} />
          </View>

          <AppText weight="bold" size="h2" style={styles.title}>
            Finding the best technician for you…
          </AppText>

          <AppText color="textMuted" style={styles.subtitle}>
            This usually takes 10–30 seconds. Please stay on this screen.
          </AppText>
        </View>

        {/* STATUS CARD */}
        <View style={styles.statusWrapper}>
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            style={[
              styles.infoButton,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Feather name="info" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <AppCard style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardRow}>
              <View
                style={[
                  styles.serviceIcon,
                  { backgroundColor: theme.colors.border + "44" },
                ]}
              >
                <MaterialCommunityIcons
                  name="fan"
                  size={34}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.cardTextWrapper}>
                <AppText weight="bold" size="body">
                  {booking.serviceName}
                </AppText>
                <AppText color="textMuted" size="small" style={{ marginTop: 4 }}>
                  {booking.address}
                </AppText>
                <AppText color="textMuted" size="small" style={{ marginTop: 2 }}>
                  {booking.dateLabel} • {booking.timeLabel}
                </AppText>
              </View>

              <AppText
                weight="bold"
                size="h3"
                style={{ color: theme.colors.primary }}
              >
                ₹{booking.amount}
              </AppText>
            </View>

            {/* PROGRESS BAR */}
            <View
              style={[
                styles.progressBackground,
                { backgroundColor: theme.colors.border },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: theme.colors.primary,
                    width: animatedWidth,
                  },
                ]}
              />
            </View>
          </AppCard>
        </View>
      </View>

      {/* CANCEL MODAL */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <AppText weight="bold" size="h3" style={{ textAlign: "center" }}>
              Cancel Booking?
            </AppText>

            <AppText
              color="textMuted"
              style={{ textAlign: "center", marginTop: 8, marginBottom: 22 }}
            >
              Are you sure you want to cancel this booking?
            </AppText>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                onPress={() => setIsModalVisible(false)}
              >
                <AppText weight="semibold">Keep Booking</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.danger },
                ]}
                onPress={handleCancelBooking}
              >
                <AppText weight="semibold" style={{ color: "#fff" }}>
                  Cancel Booking
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    headerSection: {
      alignItems: "center",
      paddingTop: 50,
      paddingHorizontal: 24,
    },
    iconHolder: { marginBottom: 20 },
    title: {
      textAlign: "center",
      marginBottom: 6,
      color: theme.colors.text,
    },
    subtitle: {
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 10,
    },
    statusWrapper: {
      marginTop: 40,
      paddingHorizontal: 20,
      position: "relative",
    },
    infoButton: {
      width: 38,
      height: 38,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      right: 24,
      top: -45,
      elevation: 5,
    },
    card: {
      borderRadius: 18,
      padding: 18,
    },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 18,
    },
    serviceIcon: {
      width: 60,
      height: 60,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    cardTextWrapper: { flex: 1 },
    progressBackground: {
      height: 5,
      width: "100%",
      borderRadius: 4,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      borderRadius: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalCard: {
      width: "100%",
      borderRadius: 16,
      padding: 24,
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },
    modalButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },
  });
