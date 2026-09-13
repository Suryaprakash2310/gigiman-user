import BookingProcessTracker from "@/src/components/BookingProcessTracker";
import AppCard from "@/src/components/ui/AppCard";
import AppText from "@/src/components/ui/AppText";
import { BookingItem } from "@/src/context/BookingContext";
import { useTheme } from "@/src/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  booking: BookingItem;
  onPress: () => void;
  onReviewPress?: () => void;
}

export default function BookingListCard({ booking, onPress, onReviewPress }: Props) {
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

      case "accepted":
      case "assigned":
        return {
          label: "Technician assigned",
          bg: "#DBEAFE",
          color: "#1D4ED8",
        };

      case "provider_started_trip":
        return {
          label: "Trip started",
          bg: "#E0F2FE",
          color: "#0284C7",
        };

      case "provider_on_the_way":
        return {
          label: "On the way",
          bg: "#CCFBF1",
          color: "#0F766E",
        };

      case "provider_arrived":
        return {
          label: "Technician arrived",
          bg: "#D1FAE5",
          color: "#059669",
        };

      case "otp":
        return {
          label: "Start Service OTP",
          bg: "#A5F3FC",
          color: "#0E7490",
        };

      case "otp_verified":
        return {
          label: "OTP Verified",
          bg: "#DCFCE7",
          color: "#166534",
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

      case "cancelled":
        return {
          label: "Cancelled",
          bg: "#FEE2E2",
          color: "#991B1B",
        };

      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  if (!statusConfig) return null; // safety

  const hasOtp = !!(booking.otp && !["completed", "cancelled", "otp_verified", "in_progress"].includes(booking.status));
  const isInProgress = booking.status === "in_progress" || booking.status === "otp_verified";
  const duration = booking.durationInMinutes || 60;

  // Live timer for ongoing active service
  const [liveRemaining, setLiveRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!isInProgress) {
      setLiveRemaining(null);
      return;
    }

    const computeSeconds = () => {
      const totalSecs = duration * 60;
      let startStr = booking.serviceStartTime;
      if (booking.serviceTimer?.remainingSeconds != null && !startStr) {
        const elapsed = Math.max(0, totalSecs - Number(booking.serviceTimer.remainingSeconds));
        startStr = new Date(Date.now() - (elapsed * 1000)).toISOString();
      } else if (booking.serviceTimer?.startTime) {
        startStr = booking.serviceTimer.startTime;
      }

      if (startStr) {
        const startMs = new Date(startStr).getTime();
        if (!isNaN(startMs) && startMs > 0) {
          const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
          return Math.max(0, totalSecs - elapsed);
        }
      }
      return totalSecs;
    };

    setLiveRemaining(computeSeconds());

    const interval = setInterval(() => {
      setLiveRemaining(computeSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [isInProgress, booking.serviceStartTime, booking.createdAt, duration]);

  const formatMinSec = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}h ${remMins.toString().padStart(2, '0')}m`;
    }
    return `${remMins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

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
                ₹{booking.paymentStatus === 'partially_paid' && booking.remainingAmount != null && booking.remainingAmount > 0
                  ? booking.remainingAmount
                  : booking.totalPrice}
              </AppText>
              {booking.paymentStatus === 'partially_paid' && booking.remainingAmount != null && booking.remainingAmount > 0 && (
                <AppText size="caption" color="textMuted" style={{ fontSize: 10 }}>
                  Remaining Bal.
                </AppText>
              )}
            </View>
          )}
        </View>

        {/* SERVICE TIME & DURATION ROW */}
        <View style={styles.serviceInfoRow}>
          <View style={styles.serviceMetaItem}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <AppText size="small" color="textMuted" style={{ marginLeft: 4 }}>
              {booking.scheduleDateTime
                ? new Date(booking.scheduleDateTime).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : booking.createdAt
                ? new Date(booking.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : booking.dateLabel
                ? `${booking.dateLabel} ${booking.timeLabel || ""}`
                : "Service Time"}
            </AppText>
          </View>

          {duration > 0 && (
            <View style={styles.durationPill}>
              <Ionicons
                name={isInProgress ? "hourglass-outline" : "timer-outline"}
                size={12}
                color={isInProgress ? "#0D9488" : "#64748B"}
              />
              <AppText
                size="caption"
                weight="semibold"
                style={{
                  color: isInProgress ? "#0D9488" : "#64748B",
                  marginLeft: 3,
                  fontSize: 11,
                }}
              >
                {isInProgress ? `Working: ${duration}m` : `${duration} mins`}
              </AppText>
            </View>
          )}
        </View>

        {/* ⏱️ LIVE SYNCHRONIZED JOB SERVICE TIMER IN ONGOING TAB */}
        {isInProgress && liveRemaining != null && (
          <View style={styles.ongoingTimerCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.timerPulseDot} />
              <Ionicons name="timer-outline" size={16} color="#047857" />
              <AppText weight="bold" size="small" style={{ color: "#065F46" }}>
                Job Service Timer
              </AppText>
            </View>
            <AppText weight="bold" style={styles.ongoingTimerDigits}>
              {formatMinSec(liveRemaining)}
            </AppText>
          </View>
        )}

        <View style={styles.rowMid}>
          <AppText size="small" color="textMuted" numberOfLines={1}>
            {booking.address}
          </AppText>
        </View>

        {/* PROMINENT START SERVICE OTP BANNER (ONGOING TAB) */}
        {hasOtp && (
          <View style={styles.otpBanner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={styles.otpIconCircle}>
                <Ionicons name="key" size={14} color="#0E7490" />
              </View>
              <View>
                <AppText size="caption" color="textMuted" style={{ fontSize: 10, lineHeight: 12 }}>
                  Share with technician
                </AppText>
                <AppText size="small" weight="bold" style={{ color: "#0E7490" }}>
                  Start Service OTP
                </AppText>
              </View>
            </View>
            <View style={styles.otpCodeBadge}>
              <AppText weight="bold" style={styles.otpCodeText}>
                {booking.otp}
              </AppText>
            </View>
          </View>
        )}

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

            {booking.eta && ["provider_started_trip", "provider_on_the_way"].includes(booking.status) && (
              <View style={[styles.pill, { backgroundColor: "#CCFBF1" }]}>
                <AppText size="small" weight="bold" style={{ color: "#0F766E" }}>
                  ETA: ~{booking.eta}
                </AppText>
              </View>
            )}
          </View>

          {booking.name &&
            ![ "searching", "cancelled" ].includes(booking.status) && (
              <AppText size="small" color="textMuted">
                {booking.status === "completed" ? "By" : "With"} {booking.name}
              </AppText>
            )}
        </View>

        {/* 5 Process Stepper */}
        {booking.status !== "cancelled" && (
          <BookingProcessTracker booking={booking} compact={true} />
        )}

        {/* Rate & Review Button for Completed Bookings (only if not yet reviewed) */}
        {booking.status === "completed" && !booking.isReviewed && onReviewPress && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onReviewPress();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={14} color="#0D9488" style={{ marginRight: 6 }} />
            <AppText weight="bold" style={{ color: "#0D9488", fontSize: 13 }}>
              Rate & Review
            </AppText>
          </TouchableOpacity>
        )}

        {booking.status === "cancelled" && booking.cancelReason && (
          <AppText
            size="small"
            style={{
              color: "#991B1B",
              marginTop: 10,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: "#E2E8F0",
            }}
            numberOfLines={2}
          >
            Reason: {booking.cancelReason}
          </AppText>
        )}
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
      fontSize: 16,
    },
    serviceInfoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    serviceMetaItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    durationPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F1F5F9",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    ongoingTimerCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#ECFDF5",
      borderWidth: 1.5,
      borderColor: "#10B981",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
    },
    timerPulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#10B981",
    },
    ongoingTimerDigits: {
      fontSize: 16,
      color: "#065F46",
      letterSpacing: 1,
    },
    rowMid: {
      marginBottom: 8,
    },
    otpBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#ECFEFF",
      borderWidth: 1,
      borderColor: "#67E8F9",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
    },
    otpIconCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "#CFFAFE",
      alignItems: "center",
      justifyContent: "center",
    },
    otpCodeBadge: {
      backgroundColor: "#0891B2",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
    },
    otpCodeText: {
      color: "#FFFFFF",
      fontSize: 16,
      letterSpacing: 2,
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
    reviewBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: "#CCFBF1",
      borderWidth: 1,
      borderColor: "#99F6E4",
    },
  });