import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import CryptoJS from "crypto-js";
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { razorpayHTML } from "@/src/utils/razorpayTemplate";
import { injectRazorpayData } from "@/src/utils/razorpayInjector";

import { initiateMaskedCall } from "@/src/api/call.api";
import BookingDetailsCard from "@/src/components/BookingDetailsCard";
import AppCard from "@/src/components/ui/AppCard";
import AppText from "@/src/components/ui/AppText";
import AppButton from "@/src/components/ui/AppButton";
import { useBooking } from "@/src/context/BookingContext";
import { BookingParamList } from "@/src/navigation/stacks/BookingStack";
import { useTheme } from "@/src/theme/useTheme";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";
import api from "../api/client";
import AppHeader from "../components/ui/AppHeader";
import { useAuth } from "../hook/useAuth";
import { socket } from "../socket/socket";


type DetailsRoute = RouteProp<BookingParamList, "BookingDetails">;

export default function BookingOtp() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<DetailsRoute>();
  const { bookingId } = route.params;
  const { getBookingById, upsertBooking, cancelBooking, updateBookingItem } = useBooking();

  const booking = getBookingById(bookingId);
  const serviceProposal = booking?.pendingServiceProposal;
  const proposalScale = useSharedValue(0);
  const bookingRef = React.useRef(booking);


  // Payment states for Remaining Balance
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [paymentMethodType, setPaymentMethodType] = useState<'CARD' | 'UPI'>('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [showWebViewModal, setShowWebViewModal] = useState(false);

  //const currentBooking = bookingRef.current;
  useEffect(() => {
    bookingRef.current = booking;
  }, [booking]);

  const generateSignature = (orderId: string, paymentId: string) => {
    const secret = '0L67Y5DD4Ai3Ksr9xgT6bfas';
    const body = orderId + '|' + paymentId;
    return CryptoJS.HmacSHA256(body, secret).toString(CryptoJS.enc.Hex);
  };

  const resetPaymentSheetFields = () => {
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setUpiId('');
  };

  const handleBalancePaymentCash = async () => {
    Alert.alert(
      "Confirm Cash Collection",
      "Are you sure you want to record Cash payment for the remaining balance?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setPaying(true);
              const res = await api.post('/booking/payment/success', {
                bookingId: bookingId,
                paymentMethod: 'CASH'
              });
              if (res.data && res.data.success) {
                Alert.alert("Success", "Cash payment recorded. Booking finalized!");
                await fetchBooking();
              } else {
                throw new Error(res.data?.message || "Verification failed");
              }
            } catch (err: any) {
              console.error(err);
              Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to record cash payment");
            } finally {
              setPaying(false);
            }
          }
        }
      ]
    );
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView payment message received:', data);

      if (!data.success) {
        Alert.alert("Payment Cancelled", data.reason === "dismissed" ? "Payment was cancelled by user" : "Payment failed");
        setShowWebViewModal(false);
        setPaymentHtml(null);
        setPaying(false);
        return;
      }

      // 1. Send payment success details to backend
      const successRes = await api.post('/booking/payment/success', {
        bookingId: bookingId,
        paymentMethod: "RAZORPAY",
        razorpayOrderId: data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
      });

      if (successRes.data?.success) {
        Alert.alert("Success", "Online payment verified successfully! Booking finalized.");
        setShowWebViewModal(false);
        setPaymentHtml(null);
        setShowPaymentSheet(false);
        resetPaymentSheetFields();
        await fetchBooking();
      } else {
        throw new Error(successRes.data?.message || "Failed to confirm payment on backend");
      }
    } catch (err: any) {
      console.error('Error in handleWebViewMessage:', err);
      Alert.alert('Payment Error', err?.message || 'Failed to verify transaction');
      setShowWebViewModal(false);
      setPaymentHtml(null);
      setPaying(false);
    }
  };

  const handleBalancePaymentOnline = async () => {
    try {
      setPaying(true);

      // Create order via backend
      const response = await api.post(`/booking/createorder/${bookingId}`, { paymentType: "BALANCE" });
      const { keyId, orderId, amount } = response.data;

      // Inject details into local HTML
      const html = injectRazorpayData({
        htmlTemplate: razorpayHTML,
        keyId,
        amountPaise: amount,
        orderId,
        prefillName: user?.fullName,
        prefillEmail: user?.email,
        prefillContact: user?.phone,
      });

      setPaymentHtml(html);
      setShowWebViewModal(true);
    } catch (err: any) {
      console.error('Payment error:', err);
      Alert.alert(
        'Payment Failed',
        err?.response?.data?.message || err.message || 'Payment process failed. Please try again.'
      );
      setPaying(false);
    }
  };

  useEffect(() => {
    if (serviceProposal) {
      proposalScale.value = withSpring(1);
    } else {
      proposalScale.value = 0;
    }
  }, [serviceProposal]);
  const [serviceActionLoading, setServiceActionLoading] = useState(false);

  const handleApproveService = async () => {
    if (!serviceProposal || serviceActionLoading) return;
    const currentBooking = bookingRef.current;
    if (!currentBooking || !currentBooking._id) return;

    try {
      setServiceActionLoading(true);
      socket.emit("extra-service-approve", {
        bookingId,
        extraServiceId: serviceProposal?._id,
        approve: true,
        userId: user?._id,
      });
      // optimistic UI (smooth UX)
      upsertBooking({
        ...currentBooking,
        pendingServiceProposal: null,
      });
      await fetchBooking();
    } finally {
      setServiceActionLoading(false);
    }
  };

  const confirmCancelBooking = () => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      [
        { text: "No, keep it", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {

            socket.emit("user-cancel-booking", { bookingId });

            // 🟡 Optimistic UI Update & Navigation
            cancelBooking(bookingId);
            navigation.navigate("BookingsMain", { activeTab: "ongoing" });
          }
        }
      ]
    );
  };



  const handleRejectService = async () => {
    const currentBooking = bookingRef.current;
    if (!serviceProposal || serviceActionLoading) return;
    if (!currentBooking || !currentBooking._id) return;
    console.log("[SOCKET EMIT] ❌ Rejecting visit proposal:", bookingId);

    try {
      setServiceActionLoading(true);
      socket.emit("extra-service-approve", {
        bookingId,
        extraServiceId: serviceProposal?._id,
        approve: false,
        userId: user?._id,
      });

      upsertBooking({
        ...currentBooking,
        pendingServiceProposal: null,
      });
      await fetchBooking();
    } finally {
      setServiceActionLoading(false);
    }
    // const proposalScale = useSharedValue(0);

    // useEffect(() => {
    //   if (serviceProposal) {
    //     proposalScale.value = withSpring(1);
    //   }
    // }, [serviceProposal]);
  };

  // Fetch full booking from API to ensure technician name is available
  const fetchBooking = async () => {
    try {
      const res = await api.get(`/booking/${bookingId}`);
      if (res.data?.booking) {
        const mapped = mapBookingToBookingItem(res.data.booking);
        const currentBooking = bookingRef.current;
        upsertBooking({
          ...mapped,
          otp: mapped.otp ?? currentBooking?.otp   // 🔑 PRESERVE OTP
        });
      }
    } catch (err) {
      console.warn("Failed to fetch booking details:", err);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);


  // useEffect(() => {
  //   const onExtraResponse = (data: any) => {
  //     console.log("[SOCKET RECEIVE] 📥 extra-service-response:", data);
  //     if (data.bookingId !== bookingId) return;

  //     if (data.status === "APPROVED") {
  //       upsertBooking({
  //         ...booking!,
  //         pendingServiceProposal: null,
  //         totalPrice: data.totalPrice,  // backend already summed
  //       });
  //       fetchBooking();
  //     }

  //     if (data.status === "REJECTED") {
  //       upsertBooking({
  //         ...booking!,
  //         pendingServiceProposal: null,
  //       });
  //     }
  //   };

  //   socket.on("extra-service-response", onExtraResponse);

  //   return () => {
  //     socket.off("extra-service-response", onExtraResponse);
  //   };
  // }, [bookingId]);
  // useEffect(() => {
  //   const onExtraServiceProposed = (data: any) => {
  //     console.log("[SOCKET RECEIVE] 🔥 USER received extra-service-proposed:", data);

  //     if (data.bookingId !== bookingId) return;

  //     upsertBooking({
  //       ...booking!,
  //       pendingServiceProposal: data.extraService,
  //     });
  //   };

  //   socket.on("extra-service-proposed", onExtraServiceProposed);

  //   return () => {
  //     socket.off("extra-service-proposed", onExtraServiceProposed);
  //   };
  // }, [bookingId, booking]);
  useEffect(() => {
    const onExtraResponse = (data: any) => {
      if (data.bookingId !== bookingId) return;

      const currentBooking = bookingRef.current;
      if (!currentBooking) return;

      if (data.status === "APPROVED") {
        upsertBooking({
          ...currentBooking,
          pendingServiceProposal: null,
          totalPrice: data.totalPrice,
        });
        fetchBooking();
      }

      if (data.status === "REJECTED") {
        upsertBooking({
          ...currentBooking,
          pendingServiceProposal: null,
        });
      }
    };

    socket.on("extra-service-response", onExtraResponse);

    return () => {
      socket.off("extra-service-response", onExtraResponse);
    };
  }, [bookingId]);
  useEffect(() => {
    const onExtraServiceProposed = (data: any) => {
      if (data.bookingId !== bookingId) return;

      const currentBooking = bookingRef.current;
      if (!currentBooking) return;

      upsertBooking({
        ...currentBooking,
        pendingServiceProposal: data.extraService,
      });
    };

    socket.on("extra-service-proposed", onExtraServiceProposed);

    return () => {
      socket.off("extra-service-proposed", onExtraServiceProposed);
    };
  }, [bookingId]);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  //part socket 
  const [requestQueue, setRequestQueue] = useState<any[]>([]);
  const PendingRequest = requestQueue.length > 0 ? requestQueue[0] : null;
  const [partActionLoading, setPartActionLoading] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    scale.value = 0;
    opacity.value = 0;
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withDelay(300, withSpring(1));
  }, [booking?.status, booking?.isManuallyAssigned, opacity, scale]);

  // part socket
  useEffect(() => {
    const onToolRequested = (payload: any) => {
      console.log("[SOCKET RECEIVE] 🧰 tool-request received:", payload);
      setRequestQueue((prev) => {
        if (prev.some(req => req.requestId === payload.requestId)) return prev;
        return [...prev, payload];
      });
    };

    // Technician requested parts
    socket.on("tool-requested", onToolRequested);
    socket.on("tool-request-created", onToolRequested);

    return () => {
      socket.off("tool-requested", onToolRequested);
      socket.off("tool-request-created", onToolRequested);
    };
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      navigation.navigate("BookingsMain", { activeTab: "ongoing" });
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [navigation]);



  //   if (PendingRequest && !PendingRequest.parts) {
  //   return null; // or loader
  // }
  // if (PendingRequest && !Array.isArray(PendingRequest.parts)) {
  //   return <Text>Loading parts...</Text>;
  // }








  // useEffect(() => {
  //   const onBookingCompleted = ({ bookingId: completedId }: any) => {
  //     if (completedId !== bookingId) return;

  //     console.log("✅ Booking completed, redirecting to review");

  //     navigation.replace("Review", 
  //       {
  //       bookingId: completedId,
  //     }
  //     );
  //   };


  //   socket.on("booking-completed", onBookingCompleted);

  //   return () => {
  //     socket.off("booking-completed", onBookingCompleted);
  //   };
  // }, [bookingId]);




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
    if (!PendingRequest || partActionLoading) return;

    try {
      setPartActionLoading(true);

      console.log("Approving request:", PendingRequest.requestId);

      await api.post(`/booking/approve/${PendingRequest.requestId}`);

      setRequestQueue((prev) => prev.slice(1));
      fetchBooking();

    } catch (err) {
      console.log("❌ Approve failed", err);
      Alert.alert("Error", "Failed to approve request");
    } finally {
      setPartActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!PendingRequest || partActionLoading) return;

    try {
      setPartActionLoading(true);

      const reqId = PendingRequest.requestId;
      console.log("Rejecting request:", reqId);

      // Optimistic UI update: Hide it instantly for a smooth experience
      setRequestQueue((prev) => prev.slice(1));

      // Dual-send: Emit the socket event (original mechanism)
      socket.emit("tool-permission-rejected", {
        requestId: reqId,
      });

      // API call (newer mechanism)
      await api.post(`/booking/reject/${reqId}`)
        .catch(err => console.log("API reject endpoint fell back:", err.message));

      fetchBooking();

    } catch (err) {
      console.log("❌ Reject failed", err);
      Alert.alert("Error", "Failed to reject request properly");
    } finally {
      setPartActionLoading(false);
    }
  };

  const [calling, setCalling] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(0);

  const handleMaskedCall = async () => {
    if (!bookingId) return;

    // Cooldown: 30 sec
    if (Date.now() - lastCallTime < 30000) {
      Alert.alert("Please wait", "Please wait at least 30 seconds before calling again.");
      return;
    }

    try {
      setCalling(true);
      setLastCallTime(Date.now());
      Vibration.vibrate(100);

      console.log("[API CALL] 📞 Mask call:", bookingId);

      await initiateMaskedCall(bookingId);

      Alert.alert(
        "Connecting...",
        "You will receive a call shortly. Please keep your phone reachable."
      );

    } catch (err: any) {
      console.log("❌ Call failed:", err?.response?.data);

      Alert.alert(
        "Call Failed",
        err?.response?.data?.message || "Unable to connect call. Please try again later."
      );
    } finally {
      setCalling(false);
    }
  };

  const handleCallPress = () => {
    Alert.alert(
      "Call Technician",
      "This will connect you via a secure masked number to protect your privacy.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call Now", onPress: handleMaskedCall }
      ]
    );
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <AppText>No booking found.</AppText>
      </View>
    );
  }
  // if (!PendingRequest) {
  //   return <Text> no pending request</Text>; // or loader
  // }




  const handleBack = () => {
    navigation.navigate("BookingsMain", { activeTab: "ongoing" });
  };

  return (
    <View style={[styles.container, { backgroundColor: "#F8FAFC" }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          showBack={true}
          onBackPress={handleBack}
        />

        {PendingRequest && !Array.isArray(PendingRequest.parts) && (
          <Text>Loading parts...</Text>
        )}
        {/* Header Section */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.checkCircle,
              {
                backgroundColor: ((booking.assignmentStatus === 'FAILED' || booking.status === 'manual_assign') && !booking.isManuallyAssigned)
                  ? theme.colors.danger + '30'
                  : ['pending', 'confirmed', 'searching'].includes(booking.status)
                  ? theme.colors.primary + '30'
                  : brightCyan
              },
              animatedCircleStyle,
            ]}
          >
            <Ionicons
              name={
                booking.status === 'completed'
                  ? 'checkmark-done-outline'
                  : ((booking.assignmentStatus === 'FAILED' || booking.status === 'manual_assign') && !booking.isManuallyAssigned)
                  ? 'alert-circle-outline'
                  : ['pending', 'confirmed', 'searching'].includes(booking.status)
                  ? 'search-outline'
                  : 'person-outline'
              }
              size={32}
              color={
                ((booking.assignmentStatus === 'FAILED' || booking.status === 'manual_assign') && !booking.isManuallyAssigned)
                  ? theme.colors.danger
                  : ['pending', 'confirmed', 'searching'].includes(booking.status)
                  ? theme.colors.primary
                  : "#0F172A"
              }
            />
          </Animated.View>
          <AppText size="h3" weight="bold" style={styles.headerTitle}>
            {booking.status === 'completed'
              ? 'Service Completed!'
              : booking.status === 'in_progress'
              ? 'Service in Progress'
              : (booking.status === 'assigned' || booking.status === 'otp')
              ? 'Technician Assigned!'
              : ((booking.assignmentStatus === 'FAILED' || booking.status === 'manual_assign') && !booking.isManuallyAssigned)
              ? 'Awaiting Manual Assignment'
              : 'Searching Technician...'}
          </AppText>
        </View>

        <Animated.View style={animatedContentStyle}>


          {/* Remaining Balance Payment Section */}
          {booking.paymentType === 'ADVANCE' && booking.paymentStatus === 'partially_paid' && ['in_progress', 'completed'].includes(booking.status) && (
            <AppCard style={styles.balancePaymentCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="card-outline" size={24} color={theme.colors.primary} />
                <AppText weight="bold" size="h3" style={{ marginLeft: 10 }}>
                  Pay Remaining Balance
                </AppText>
              </View>
              
              <AppText size="small" color="textMuted" style={{ marginBottom: 16 }}>
                You paid 18% advance. The remaining 82% balance amount is due now.
              </AppText>

              <View style={[styles.priceBox, { backgroundColor: theme.colors.background }]}>
                <View style={styles.priceRow}>
                  <AppText>Total Price</AppText>
                  <AppText weight="medium">₹{booking.totalPrice}</AppText>
                </View>
                <View style={styles.priceRow}>
                  <AppText>Advance Paid (18%)</AppText>
                  <AppText weight="medium" style={{ color: theme.colors.success }}>-₹{booking.advanceAmount}</AppText>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <AppText weight="bold">Remaining Balance (82%)</AppText>
                  <AppText weight="bold" size="h3" style={{ color: theme.colors.primary }}>
                    ₹{booking.remainingAmount}
                  </AppText>
                </View>
              </View>

              <View style={styles.balanceActionRow}>
                <TouchableOpacity
                  style={[styles.balanceBtn, { backgroundColor: theme.colors.border }]}
                  onPress={handleBalancePaymentCash}
                  disabled={paying}
                >
                  <AppText weight="bold" style={{ color: theme.colors.text }}>
                    Pay Cash
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.balanceBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setShowPaymentSheet(true)}
                  disabled={paying}
                >
                  <AppText weight="bold" style={{ color: '#fff' }}>
                    Pay Online
                  </AppText>
                </TouchableOpacity>
              </View>
            </AppCard>
          )}

          {/* Technician Card */}
          {booking.name && (['assigned', 'otp', 'in_progress', 'completed'].includes(booking.status) || booking.assignmentStatus === 'FAILED' || booking.status === 'manual_assign') && (
            <BookingDetailsCard
              name={booking.name ?? "Assigned Technician"}
              role={booking.serviceCategoryName}
              image={booking.image}
              eta={booking.eta}
              phone={booking.phone}
              onCallPress={handleCallPress}
            />
          )}

          {/* OTP Section */}
          {booking.rawStatus?.toLowerCase() === 'accepted' && booking.otp && (
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
          )}

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
                  disabled={partActionLoading}
                >
                  <AppText weight="bold" style={{ color: "#DC2626" }}>
                    Reject
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.partBtn, styles.approveBtn]}
                  onPress={handleApprove}
                  disabled={partActionLoading}
                >
                  <AppText weight="bold" style={{ color: "#065F46" }}>
                    {partActionLoading ? "Approving..." : "Approve"}
                  </AppText>
                </TouchableOpacity>
              </View>
            </AppCard>
          )}

          {serviceProposal && (
            <AppCard style={styles.serviceApprovalCard}>
              <AppText weight="bold" size="h3" style={{ marginBottom: 10 }}>
                Additional Service Recommended
              </AppText>

              <AppText style={{ marginBottom: 8, color: "#475569" }}>
                Technician identified an additional issue.
              </AppText>

              <View style={styles.partRow}>
                <AppText>Service</AppText>
                <AppText>{serviceProposal.serviceCategoryName || serviceProposal.serviceName}</AppText>
              </View>

              <View style={styles.partRow}>
                <AppText>Duration</AppText>
                <AppText>{serviceProposal.durationInMinutes} mins</AppText>
              </View>

              <View style={styles.partDivider} />

              <View style={styles.partTotalRow}>
                <AppText weight="bold">New Total</AppText>
                <AppText weight="bold">₹{serviceProposal.price}</AppText>
              </View>

              <View style={styles.partActionRow}>
                <TouchableOpacity
                  style={[styles.partBtn, styles.rejectBtn]}
                  onPress={handleRejectService}
                >
                  <AppText weight="bold" style={{ color: "#DC2626" }}>
                    Reject
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.partBtn, styles.approveBtn]}
                  onPress={handleApproveService}
                >
                  <AppText weight="bold" style={{ color: "#065F46" }}>
                    Approve & Continue
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
          {booking.rawStatus?.toLowerCase() === 'accepted' && (
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

              <View style={{ paddingHorizontal: 20 }}>
                <TouchableOpacity
                  style={[styles.callButton, calling && { opacity: 0.6 }]}
                  onPress={handleCallPress}
                  disabled={calling}
                >
                  <AppText style={styles.callText}>
                    {calling ? "Connecting..." : "📞 Call Technician"}
                  </AppText>
                </TouchableOpacity>
              </View>
            </AppCard>
          )}

          {/* Summary */}
          <AppCard style={styles.arrivalCard}>
            <View style={styles.summaryContainer}>
              <AppText
                weight="bold"
                size="h3"
                style={[styles.summaryTitle, { marginTop: 20 }]}
              >
                Booking Summary
              </AppText>

              {booking.cartItems && booking.cartItems.length > 0 ? (
                booking.cartItems.map((item, index) => (
                  <View key={`${item._id || item.serviceCategoryId || index}-${index}`} style={styles.summaryRow}>
                    <AppText style={{ color: "#475569" }}>
                      {item.serviceCategoryName} {item.quantity > 1 ? `(x${item.quantity})` : ""}
                    </AppText>
                    <AppText style={{ color: "#0F172A" }}>
                      ₹{item.price * (item.quantity || 1)}
                    </AppText>
                  </View>
                ))
              ) : (
                <View style={styles.summaryRow}>
                  <AppText style={{ color: "#475569" }}>Service</AppText>
                  <AppText style={{ color: "#0F172A" }}>
                    {booking.serviceCategoryName}
                  </AppText>
                </View>
              )}

              {booking.extraServices?.filter(s => s.status === "APPROVED").map((extra, index) => (
                <View key={`${extra._id || index}-${index}`} style={styles.summaryRow}>
                  <AppText style={{ color: "#475569" }}>+ {extra.serviceName}</AppText>
                  <AppText style={{ color: "#0F172A" }}>
                    ₹{extra.price}
                  </AppText>
                </View>
              ))}

              <View style={styles.divider} />
              {booking.paymentType === 'ADVANCE' && booking.paymentStatus === 'partially_paid' ? (
                <>
                  <View style={styles.summaryRow}>
                    <AppText style={{ color: "#475569" }}>Total Price</AppText>
                    <AppText style={{ color: "#0F172A" }}>
                      ₹{booking.totalPrice}
                    </AppText>
                  </View>
                  <View style={styles.summaryRow}>
                    <AppText style={{ color: "#475569" }}>Advance Paid (18%)</AppText>
                    <AppText style={{ color: "#0F172A" }} weight="medium">
                      -₹{booking.advanceAmount}
                    </AppText>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <AppText style={{ color: "#0F172A" }} weight="bold">Remaining Balance</AppText>
                    <AppText style={{ color: "#0F172A" }} weight="bold" size="h3">
                      ₹{booking.remainingAmount}
                    </AppText>
                  </View>
                </>
              ) : (
                <View style={styles.summaryRow}>
                  <AppText style={{ color: "#0F172A" }} weight="bold">Total Price</AppText>
                  <AppText style={{ color: "#0F172A" }} weight="bold">
                    ₹{booking.totalPrice}
                  </AppText>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={primaryTeal}
                  style={styles.detailIcon}
                />
                <View style={{ flex: 1 }}>
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
                    Duration
                  </AppText>
                  <AppText weight="medium" style={styles.detailText}>
                    {booking.durationInMinutes != null ? `${booking.durationInMinutes} mins` : "N/A"}
                  </AppText>
                </View>
              </View>
            </View>
            </AppCard>

          </Animated.View>
      </ScrollView>



      {/* Simulated Payment Sheet Modal for Balance Payment */}
      <Modal
        visible={showPaymentSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!paying) {
            setShowPaymentSheet(false);
            resetPaymentSheetFields();
          }
        }}
      >
        <View style={styles.paymentSheetOverlay}>
          <View style={[styles.paymentSheetContent, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <View style={styles.paymentSheetHeader}>
              <AppText weight="bold" size="h3">Remaining Balance Checkout</AppText>
              {!paying && (
                <TouchableOpacity
                  onPress={() => {
                    setShowPaymentSheet(false);
                    resetPaymentSheetFields();
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* Price Details */}
            <View style={[styles.paymentSheetPriceBox, { backgroundColor: theme.colors.background }]}>
              <AppText size="small" color="textMuted">Amount to Pay Now</AppText>
              <AppText weight="bold" size="h1" style={{ color: theme.colors.primary }}>
                ₹{booking.remainingAmount}
              </AppText>
              <AppText size="caption" color="textMuted" style={{ marginTop: 2 }}>
                Remaining 82% balance amount
              </AppText>
            </View>

            {/* Payment Info */}
            <View style={{ marginTop: 20, marginBottom: 10, alignItems: 'center', paddingHorizontal: 16 }}>
              <Ionicons name="shield-checkmark-outline" size={48} color={theme.colors.primary} />
              <AppText weight="semibold" size="body" style={{ marginTop: 12, textAlign: 'center', color: theme.colors.text }}>
                Secure Payment with Razorpay
              </AppText>
              <AppText size="small" color="textMuted" style={{ marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
                You will be redirected to Razorpay&apos;s secure checkout. Supports Cards, UPI, Netbanking, and popular wallets.
              </AppText>
            </View>

            {/* Action Buttons */}
            <View style={{ marginTop: 24, paddingBottom: Platform.OS === 'ios' ? 24 : 12 }}>
              <AppButton
                title={paying ? "Processing Secure Payment..." : `Pay Balance ₹${booking.remainingAmount}`}
                onPress={handleBalancePaymentOnline}
                loading={paying}
                disabled={paying}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Client-Side WebView Modal for Razorpay Checkout */}
      <Modal
        visible={showWebViewModal}
        animationType="fade"
        transparent={false}
        onRequestClose={() => {
          setShowWebViewModal(false);
          setPaymentHtml(null);
          setPaying(false);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#1e293b',
            borderBottomWidth: 1,
            borderBottomColor: '#334155'
          }}>
            <AppText weight="bold" size="body" style={{ color: '#f8fafc' }}>Payment Checkout</AppText>
            <TouchableOpacity
              onPress={() => {
                setShowWebViewModal(false);
                setPaymentHtml(null);
                setPaying(false);
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={24} color="#f1f5f9" />
            </TouchableOpacity>
          </View>
          {paymentHtml && (
            <WebView
              originWhitelist={["*"]}
              source={{ html: paymentHtml }}
              javaScriptEnabled
              domStorageEnabled
              onMessage={handleWebViewMessage}
              startInLoadingState
              renderLoading={() => (
                <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: '#0f172a' }}>
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
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
  serviceApprovalCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0F2FE",
    backgroundColor: "#F0F9FF",
  },
  callButton: {
    backgroundColor: "#0D9488",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  callText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  timelineCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 18,
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  timelineIndicator: {
    alignItems: "center",
    marginRight: 14,
    width: 24,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  balancePaymentCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  priceBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 8,
  },
  balanceActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  balanceBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  paymentSheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  paymentSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  paymentSheetPriceBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  paymentMethodTabs: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },
  paymentMethodTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  paymentMethodTabActive: {
    // dynamically set via active border bottom
  },
  paymentInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#F8FAFC",
  },

});
