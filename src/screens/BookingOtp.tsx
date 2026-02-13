import React, { useEffect, useState } from "react";
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import AppText from "@/src/components/ui/AppText";
import AppCard from "@/src/components/ui/AppCard";
import BookingDetailsCard from "@/src/components/BookingDetailsCard";
import { useTheme } from "@/src/theme/useTheme";
import { useBooking } from "@/src/context/BookingContext";
import { BookingParamList } from "@/src/navigation/stacks/BookingStack";
import AppHeader from "../components/ui/AppHeader";
import { socket } from "../socket/socket";
import api from "../api/client";



type DetailsRoute = RouteProp<BookingParamList, "BookingDetails">;

export default function BookingOtp() {
  const { theme } = useTheme();
  const route = useRoute<DetailsRoute>();
  const { bookingId } = route.params;
  const { getBookingById } = useBooking();

  const booking = getBookingById(bookingId);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  //part socket 
  const [PendingRequest, setPendingRequest] = useState<any | null>(null);
  const [partActionLoading, setPartActionLoading] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withDelay(300, withSpring(1));
  }, []);

//   if (PendingRequest && !PendingRequest.parts) {
//   return null; // or loader
// }
  if (PendingRequest && !Array.isArray(PendingRequest.parts)) {
  return <Text>Loading parts...</Text>;
}





  useEffect(() => {
    socket.on("tool-request-created", payload => {
      setPendingRequest(payload);
      console.log("🧰 Tool request created:", payload);
    });

    return () => {
      socket.off("tool-request-created");
    };
  }, []);

  // part socket
  useEffect(() => {
    // Technician requested parts
    socket.on("tool-requested", (payload) => {
      console.log("🧰 Part request received:", payload);
      setPendingRequest(payload);
    });

    return () => {
      socket.off("tool-requested");
    };
  }, []);

  


useEffect(() => {
  const onBookingCompleted = ({ bookingId: completedId }: any) => {
    if (completedId !== bookingId) return;

    console.log("✅ Booking completed, redirecting to review");

    navigation.replace("Review", 
      {
      bookingId: completedId,
    }
    );
  };
  

  socket.on("booking-completed", onBookingCompleted);

  return () => {
    socket.off("booking-completed", onBookingCompleted);
  };
}, [bookingId]);




  // const handleApproveParts = () => {
  //   if (!partRequest) return;

  //   setPartActionLoading(true);

  //   socket.emit("tool-permission-approved", {
  //     requestId: partRequest.requestId,
  //   });

  //   setTimeout(() => {
  //     setPartRequest(null);
  //     setPartActionLoading(false);
  //   }, 500);
  // };
  const handleApprove = async () => {
  if (!PendingRequest) return;

  console.log("Approving request:", PendingRequest.requestId);

  await api.post(
    `/booking/approve/${PendingRequest.requestId}`
  );

  // ❌ DO NOT emit socket from frontend
  setPendingRequest(null);
};

const handleReject = async () => {
  if (!PendingRequest) return;

  console.log("Rejecting request:", PendingRequest.requestId);

  await api.post(
    `/reject/${PendingRequest.requestId}`
  );

  // ❌ DO NOT emit socket from frontend
  setPendingRequest(null);
};






// const handleRejectParts = () => {
//   if (!PendingRequest) return;

//   socket.emit("tool-permission-rejected", {
//     requestId: PendingRequest.requestId,
//   });

//   setPendingRequest(null);
// };




const animatedCircleStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const animatedContentStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ translateY: (1 - opacity.value) * 20 }],
}));

const brightCyan = "#67E8F9";
const otpBg = "#A5F3FC";
const primaryTeal = "#0D9488";

console.log("🧪 ---------Booking from context:", booking);
console.log("-------pendingRequest:", PendingRequest);

if (!booking) {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <AppText>No booking found.</AppText>
    </SafeAreaView>
  );
}
// if (!PendingRequest) {
//   return <Text> no pending request</Text>; // or loader
// }


return (
  <SafeAreaView style={[styles.container, { backgroundColor: "#F8FAFC" }]}>
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader showBack={true} />
      {/* Header Section */}
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.checkCircle,
            { backgroundColor: brightCyan },
            animatedCircleStyle,
          ]}
        >
          <Ionicons name="checkmark" size={32} color="#0F172A" />
        </Animated.View>
        <AppText size="h3" weight="bold" style={styles.headerTitle}>
          Technician Assigned!
        </AppText>
      </View>

      <Animated.View style={animatedContentStyle}>
        {/* Technician Card */}
        <BookingDetailsCard
          name={booking.technicianName ?? "Assigned Technician"}
          role={booking.serviceCategoryName}
          experience="5 years exp"
          rating={booking.technicianRating ?? 4.9}
          reviews={845}
          image="https://randomuser.me/api/portraits/men/32.jpg"
        />

        {/* OTP Section */}
        <View
          style={[
            styles.otpContainer,
            { backgroundColor: otpBg, borderColor: brightCyan },
          ]}
        >
          <AppText weight="bold" style={styles.otpLabel}>
            Your Booking OTP
          </AppText>
          <AppText size="h1" weight="bold" style={styles.otpValue}>
            {booking.otp ?? "----"}
          </AppText>
          <AppText size="small" style={styles.otpInstruction}>
            Share this code with the technician
          </AppText>
        </View>

        {/* ===============================
    PART APPROVAL SECTION (NEW)
================================ */}
        {PendingRequest && (
          <AppCard style={styles.partApprovalCard}>
            <AppText weight="bold" size="h3" style={{ marginBottom: 10 }}>
              Parts Required
            </AppText>

            {(() => {
              interface Part {
                partName: string;
                quantity: number;
                price: number;
              }

              const parts = PendingRequest.parts as Part[];

              return parts.map((p: Part, index: number) => (
                <View key={index} style={styles.partRow}>
                  <AppText>{p.partName}</AppText>
                  <AppText>
                    {p.quantity} × ₹{p.price}
                  </AppText>
                </View>
              ));
            })()}

            <View style={styles.partDivider} />

            <View style={styles.partTotalRow}>
              <AppText weight="bold">Total</AppText>
              <AppText weight="bold">₹{PendingRequest.totalCost}</AppText>
            </View>

            <View style={styles.partActionRow}>
              <TouchableOpacity
                style={[styles.partBtn, styles.rejectBtn]}
                onPress={handleReject}
                //disabled={partActionLoading}
              >
                <AppText weight="bold" style={{ color: "#DC2626" }}>
                  Reject
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.partBtn, styles.approveBtn]}
                onPress={handleApprove}
                //disabled={partActionLoading}
              >
                <AppText weight="bold" style={{ color: "#065F46" }}>
                  {partActionLoading ? "Approving..." : "Approve"}
                </AppText>
              </TouchableOpacity>
            </View>
          </AppCard>
        )}

        {/* 
        {pendingRequest && (
  <View style={styles.approvalBox}>
    <Text style={styles.title}>Parts Required</Text>

    {pendingRequest.parts.map((p, i) => (
      <Text key={i}>
        {p.partsname} x{p.quantity} – ₹{p.price}
      </Text>
    ))}

    <Text style={styles.total}>
      Total: ₹{pendingRequest.totalCost}
    </Text>

    <View style={{ flexDirection: "row", gap: 12 }}>
      <TouchableOpacity
        style={styles.approve}
        onPress={handleApprove}
      >
        <Text style={{ color: "#fff" }}>Approve</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.reject}
        onPress={handleReject}
      >
        <Text style={{ color: "#fff" }}>Reject</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

        */}



        {/* Arrival & Summary */}
        <AppCard style={styles.arrivalCard}>
          <View style={styles.arrivalHeader}>
            <View
              style={[styles.iconCircle, { backgroundColor: primaryTeal }]}
            >
              <Ionicons name="chevron-down" size={20} color="white" />
            </View>
            <AppText size="h3" weight="bold" style={styles.arrivalText}>
              Arriving soon
            </AppText>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: brightCyan }]}
            >
              <Ionicons
                name="call"
                size={20}
                color="#0F172A"
                style={{ marginRight: 8 }}
              />
              <AppText weight="bold" style={{ color: "#0F172A" }}>
                Call
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#CCFBF1",
                },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={primaryTeal}
                style={{ marginRight: 8 }}
              />
              <AppText weight="bold" style={{ color: primaryTeal }}>
                Chat
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <AppText
              weight="bold"
              size="h3"
              style={styles.summaryTitle}
            >
              Booking Summary
            </AppText>

            <View style={styles.summaryRow}>
              <AppText style={{ color: "#475569" }}>Service</AppText>
              <AppText style={{ color: "#475569" }}>
                {booking.serviceCategoryName}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText style={{ color: "#475569" }}>Price</AppText>
              <AppText style={{ color: "#475569" }}>
                ₹{booking.totalPrice}
              </AppText>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Ionicons
                name="location-outline"
                size={20}
                color={primaryTeal}
                style={styles.detailIcon}
              />
              <View>
                <AppText color="textMuted" size="small">
                  Address
                </AppText>
                <AppText weight="medium" style={styles.detailText}>
                  {booking.address}
                </AppText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons
                name="time-outline"
                size={20}
                color={primaryTeal}
                style={styles.detailIcon}
              />
              <View>
                <AppText color="textMuted" size="small">
                  Scheduled
                </AppText>
                <AppText weight="medium" style={styles.detailText}>
                  {booking.dateLabel}, {booking.timeLabel}
                </AppText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons
                name="card-outline"
                size={20}
                color={primaryTeal}
                style={styles.detailIcon}
              />
              <View>
                <AppText color="textMuted" size="small">
                  Payment
                </AppText>
                <AppText weight="medium" style={styles.detailText}>
                  Cash on Delivery
                </AppText>
              </View>
            </View>
          </View>
        </AppCard>
      </Animated.View>
    </ScrollView>

    {/* Footer */}
    <View style={[styles.footer, { backgroundColor: "#F8FAFC" }]}>
      <TouchableOpacity
        style={[styles.trackButton, { backgroundColor: brightCyan }]}
      >
        <AppText weight="bold" size="h3" style={{ color: "#0F172A" }}>
          Track Technician
        </AppText>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  checkCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#67E8F9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    textAlign: "center",
    color: "#0F172A",
  },
  otpContainer: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 4,
  },
  otpLabel: {
    marginBottom: 6,
    color: "#0F172A",
  },
  otpValue: {
    color: "#0F766E",
    marginBottom: 6,
    letterSpacing: 3,
  },
  otpInstruction: {
    opacity: 0.7,
    color: "#0F172A",
  },
  arrivalCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 4,
    marginBottom: 20,
    backgroundColor: "white",
  },
  arrivalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  arrivalText: {
    flex: 1,
    color: "#0F172A",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryContainer: {
    padding: 20,
    paddingTop: 0,
  },
  summaryTitle: {
    marginBottom: 16,
    color: "#0F172A",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailText: {
    marginTop: 2,
    lineHeight: 20,
    color: "#0F172A",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  trackButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#67E8F9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  partApprovalCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 18,
  },

  partRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },

  partDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },

  partTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  partActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  partBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  approveBtn: {
    backgroundColor: "#D1FAE5",
  },

  rejectBtn: {
    backgroundColor: "#FEE2E2",
  },

});
