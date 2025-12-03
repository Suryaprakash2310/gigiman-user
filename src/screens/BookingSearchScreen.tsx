// src/screens/booking/BookingSearchScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Animated, Modal } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AppCard from "@/src/components/ui/AppCard";
import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useBooking } from "@/src/context/BookingContext";

export default function BookingSearchScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { setOngoingBooking } = useBooking();

  const { serviceName, amount, date, time } = route.params;

  const [modalVisible, setModalVisible] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration: 1600, useNativeDriver: false })
      ])
    ).start();
  }, []);

  const animatedWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["20%", "80%"]
  });

  // ⏳ Auto-Navigate to OTP Page after 2 mins
  useEffect(() => {
    const timer = setTimeout(() => {
      const bookingId = Math.random().toString(36).slice(2);

      // Store booking in global context
      setOngoingBooking({
        id: bookingId,
        serviceName,
        date,
        time,
        amount,
        technicianName: "Arun Kumar"
      });

      navigation.navigate("BookingDetails", { bookingId });
    }, 2000); // change to 120000 for production (2 mins)

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      <View style={styles.headerSection}>
        <Feather name="search" size={70} color={theme.colors.primary} />
        <AppText weight="bold" size="h2" style={styles.title}>
          Finding the best technician for you…
        </AppText>
        <AppText color="textMuted" style={styles.subtitle}>
          This usually takes 10–30 seconds. Stay on this page.
        </AppText>
      </View>

      {/* INFO BUTTON */}
      <View style={styles.infoWrapper}>
        <TouchableOpacity style={[styles.infoButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => setModalVisible(true)}>
          <Feather name="info" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* STATUS CARD */}
      <AppCard style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.border + "30" }]}>
            <MaterialCommunityIcons name="fan" size={34} color={theme.colors.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <AppText weight="bold">{serviceName}</AppText>
            <AppText color="textMuted" size="small">{date}</AppText>
            <AppText color="textMuted" size="small">{time}</AppText>
          </View>

          <AppText weight="bold" size="h3" style={{ color: theme.colors.primary }}>
            ₹{amount}
          </AppText>
        </View>

        {/* PROGRESS */}
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressBar, { backgroundColor: theme.colors.primary, width: animatedWidth }]} />
        </View>
      </AppCard>

      {/* CANCEL MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <AppText weight="bold" size="h3">Cancel Booking?</AppText>
            <AppText color="textMuted" style={{ marginVertical: 10 }}>
              Are you sure you want to cancel this booking?
            </AppText>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.colors.border }]}
                onPress={() => setModalVisible(false)}>
                <AppText>Keep Booking</AppText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.danger }]}
                onPress={() => navigation.goBack()}>
                <AppText style={{ color: "white" }}>Cancel</AppText>
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
    headerSection: { alignItems: "center", paddingTop: 50, paddingHorizontal: 24 },
    title: { marginTop: 10, textAlign: "center", color: theme.colors.text },
    subtitle: { marginTop: 5, textAlign: "center" },
    infoWrapper: { marginTop: 40, alignItems: "center" },
    infoButton: {
      position: "absolute", top: -20, right: 20,
      width: 38, height: 38, borderRadius: 20, justifyContent: "center", alignItems: "center"
    },
    card: { marginTop: 20, padding: 20, borderRadius: 16 },
    cardRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    iconBox: { width: 60, height: 60, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 16 },
    progressBg: { height: 5, borderRadius: 4, backgroundColor: theme.colors.border },
    progressBar: { height: "100%", borderRadius: 4 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modalCard: { width: "85%", borderRadius: 16, padding: 24 },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 12 },
    modalBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  });
