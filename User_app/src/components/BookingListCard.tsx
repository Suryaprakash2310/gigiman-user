import AppCard from "@/src/components/ui/AppCard";
import AppText from "@/src/components/ui/AppText";
import { BookingItem } from "@/src/context/BookingContext";
import { useTheme } from "@/src/theme/useTheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  booking: BookingItem;
  onPress: () => void;
}

export default function BookingListCard({ booking, onPress }: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getStatusConfig = () => {
    if (booking.assignmentStatus === "FAILED" && !booking.isManuallyAssigned) {
      return {
        label: "Awaiting manual assignment",
        bg: "#DBEAFE",
        color: "#1D4ED8",
      };
    }

    switch (booking.status) {
      case "searching":
        return {
          label: "Searching technician…",
          bg: "#FEF3C7",
          color: "#B45309",
        };

      case "otp":
        return {
          label: "Technician arrived",
          bg: "#DBEAFE",
          color: "#1D4ED8",
        };

      case "assigned":
        return {
          label: "Technician assigned",
          bg: "#DBEAFE",
          color: "#1D4ED8",
        };

      case "in_progress":
        return {
          label: "Service in progress",
          bg: "#DCFCE7",
          color: "#166534",
        };

      case "scheduled":
        return {
          label: "Scheduled",
          bg: "#E0E7FF",
          color: "#3730A3",
        };

      case "completed":
        return {
          label: "Completed",
          bg: "#DCFCE7",
          color: "#166534",
        };

      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  if (!statusConfig) return null; // safety

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <AppCard style={styles.card}>
        <View style={styles.rowTop}>
          <AppText weight="bold" style={styles.serviceName}>
            {booking.serviceCategoryName}
          </AppText>

          {booking.totalPrice && (
            <View style={{ alignItems: "flex-end" }}>
              <AppText
                weight="bold"
                style={{ color: theme.colors.primary }}
              >
                ₹{booking.paymentType === 'ADVANCE' && booking.paymentStatus === 'partially_paid' && booking.remainingAmount != null
                  ? booking.remainingAmount
                  : booking.totalPrice}
              </AppText>
              {booking.paymentType === 'ADVANCE' && booking.paymentStatus === 'partially_paid' && (
                <AppText size="caption" color="textMuted" style={{ fontSize: 10 }}>
                  Remaining Bal.
                </AppText>
              )}
            </View>
          )}
        </View>

        <View style={styles.rowMid}>
          <AppText size="small" color="textMuted">
            {booking.scheduleDateTime
              ? new Date(booking.scheduleDateTime).toLocaleString()
              : ""}
          </AppText>

          <AppText size="small" color="textMuted">
            {booking.address}
          </AppText>
        </View>

        <View style={styles.rowBottom}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={[
                styles.pill,
                { backgroundColor: statusConfig.bg },
              ]}
            >
              <AppText
                size="small"
                weight="semibold"
                style={{ color: statusConfig.color }}
              >
                {statusConfig.label}
              </AppText>
            </View>

            {booking.otp && (booking.status === "otp" || booking.status === "assigned") && (
              <View style={[styles.pill, { backgroundColor: "#A5F3FC" }]}>
                <AppText size="small" weight="bold" style={{ color: "#0E7490" }}>
                  OTP: {booking.otp}
                </AppText>
              </View>
            )}
          </View>

          {(booking.status === "in_progress" || booking.status === "completed" || booking.status === "assigned" || booking.status === "otp") &&
            booking.name && (
              <AppText size="small" color="textMuted">
                {booking.status === "completed" ? "By" : "With"} {booking.name}
              </AppText>
            )}
        </View>
      </AppCard>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      padding: 14,
      marginBottom: 12,
      borderRadius: 16,
    },
    rowTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 4,
    },
    serviceName: {
      flex: 1,
      marginRight: 12,
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