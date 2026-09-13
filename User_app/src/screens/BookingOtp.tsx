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

import { ServiceAPI, CategoryService } from "@/src/api/service.api";
import { initiateMaskedCall } from "@/src/api/call.api";
import BookingDetailsCard from "@/src/components/BookingDetailsCard";
import BookingProcessTracker from "@/src/components/BookingProcessTracker";
import LiveTrackingMap from "@/src/components/LiveTrackingMap";
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
import CancellationModal from "@/src/components/CancellationModal";
import { socket } from "../socket/socket";
import { FEES } from "@/src/utils/enums/Fees";


type DetailsRoute = RouteProp<BookingParamList, "BookingDetails">;

export default function BookingOtp() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<DetailsRoute>();
  const { bookingId, activeTab } = route.params;
  const { getBookingById, upsertBooking, cancelBooking, updateBookingItem } = useBooking();

  const [loading, setLoading] = useState(true);
  const booking = getBookingById(bookingId);
  
  const fee = booking?.convenienceFee ?? FEES.CONVENIENCE_FEE;
  
  const paymentAmount = booking
    ? booking.paymentStatus === 'partially_paid' && booking.remainingAmount && booking.remainingAmount > 0
      ? booking.remainingAmount
      : ((booking.totalPrice ?? 0) + fee)
    : 0;

  const paymentLabel = booking
    ? booking.paymentStatus === 'partially_paid'
      ? 'Remaining Balance'
      : 'Total Amount'
    : '';

  const isScheduledBooking = !!(booking && (booking.isScheduled || booking.status === 'scheduled' || booking.scheduleDateTime));

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

  // Ongoing Extra Service booking state
  const [showAddExtraModal, setShowAddExtraModal] = useState(false);
  const [availableExtras, setAvailableExtras] = useState<CategoryService[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, { service: CategoryService; quantity: number }>>({});
  const [submittingExtra, setSubmittingExtra] = useState(false);
  const [extraSearchQuery, setExtraSearchQuery] = useState("");
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const handleOpenAddExtraModal = async () => {
    setShowAddExtraModal(true);
    if (availableExtras.length === 0) {
      try {
        setLoadingExtras(true);
        let list: CategoryService[] = [];
        if (booking?.domainService) {
          const data: any = await ServiceAPI.getSubServicesByDomainId(booking.domainService);
          if (data?.services && Array.isArray(data.services)) {
            list = data.services.flatMap((s: any) => s.serviceCategory || []);
          } else if (data?.categoriesservices && Array.isArray(data.categoriesservices)) {
            list = data.categoriesservices as CategoryService[];
          }
        }
        
        // Fallback: Fetch all domain services and combine their subcategories to avoid 404 endpoint
        if (list.length === 0) {
          try {
            const domainData = await ServiceAPI.getServicesAPI();
            if (domainData?.services && Array.isArray(domainData.services)) {
              for (const dom of domainData.services) {
                if (dom._id) {
                  const subRes = await ServiceAPI.getSubServicesByDomainId(dom._id);
                  if (subRes?.services && Array.isArray(subRes.services)) {
                    const subList = subRes.services.flatMap((s: any) => s.serviceCategory || []);
                    list = [...list, ...subList];
                  }
                }
              }
            }
          } catch (fallbackErr) {
            console.warn("Fallback to all subservices failed:", fallbackErr);
          }
        }
        setAvailableExtras(list);
      } catch (err) {
        console.warn("Failed to load extra services:", err);
      } finally {
        setLoadingExtras(false);
      }
    }
  };

  const handleToggleExtraQuantity = (service: CategoryService, delta: number) => {
    const serviceId = service._id || service.serviceCategoryName;
    setSelectedExtras(prev => {
      const currentQty = prev[serviceId]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return {
        ...prev,
        [serviceId]: { service, quantity: newQty }
      };
    });
  };

  const selectedExtrasList = Object.values(selectedExtras);
  const totalExtraPrice = selectedExtrasList.reduce((acc, item) => acc + ((item.service.price || 0) * item.quantity), 0);
  const totalExtraDuration = selectedExtrasList.reduce((acc, item) => acc + ((item.service.durationInMinutes || 15) * item.quantity), 0);

  const filteredAvailableExtras = availableExtras.filter(item => {
    if (!extraSearchQuery.trim()) return true;
    const name = (item.serviceCategoryName || item.parentServiceName || "").toLowerCase();
    return name.includes(extraSearchQuery.trim().toLowerCase());
  });

  const handleAddExtraServicesSubmit = async () => {
    if (selectedExtrasList.length === 0 || submittingExtra || !booking?._id) return;
    try {
      setSubmittingExtra(true);

      const rawBookingId = String(booking._id);

      const itemsToSubmit = selectedExtrasList
        .map(item => {
          const categoryId = item.service._id || item.service.domainServiceId;
          if (!categoryId) {
            console.warn(`[Flow Step 1 Warn] Skipping extra service item without valid ID:`, item);
            return null;
          }
          return {
            serviceCategoryId: String(categoryId),
            serviceName: String(item.service.serviceCategoryName || item.service.parentServiceName || "Extra Service"),
            price: Number(item.service.price || 0),
            durationInMinutes: Number(item.service.durationInMinutes || 15),
            quantity: Number(item.quantity || 1),
            status: "APPROVED"
          };
        })
        .filter(Boolean) as Array<{
          serviceCategoryId: string;
          serviceName: string;
          price: number;
          durationInMinutes: number;
          quantity: number;
          status: string;
        }>;

      // 1. API Call to backend (/booking/extra/propose and /booking/extra/approve)
      for (const item of itemsToSubmit) {
        const proposePayload = {
          bookingId: rawBookingId,
          serviceCategoryId: item.serviceCategoryId,
        };

        const proposeRes = await api.post(`/booking/extra/propose`, proposePayload);

        const extraService = proposeRes.data?.extraService;
        if (extraService && extraService._id) {
          const approvePayload = {
            bookingId: rawBookingId,
            extraServiceId: String(extraService._id),
            approve: true,
          };

          const approveRes = await api.post(`/booking/extra/approve`, approvePayload);
        }
      }



      // 3. Optimistic local update in BookingContext
      const existingExtras = Array.isArray(booking.extraServices) ? booking.extraServices : [];
      const newExtrasFormatted = itemsToSubmit.map(it => ({
        _id: String(it.serviceCategoryId || Date.now() + Math.random()),
        serviceName: it.serviceName,
        price: Number(it.price) * Number(it.quantity),
        status: "APPROVED",
        quantity: Number(it.quantity)
      }));
      const updatedExtras = [...existingExtras, ...newExtrasFormatted];

      const addedTotalPrice = itemsToSubmit.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0);
      const addedDuration = itemsToSubmit.reduce((sum, it) => sum + (Number(it.durationInMinutes) * Number(it.quantity)), 0);

      const updatedPrice = Number(booking.totalPrice || 0) + addedTotalPrice;
      const updatedDuration = Number(booking.durationInMinutes || 0) + addedDuration;

      let updatedRemainingAmount = booking.remainingAmount;
      if (booking.paymentStatus === 'partially_paid' || (booking.advanceAmount != null && booking.advanceAmount > 0)) {
        const advance = Number(booking.advanceAmount || 0);
        updatedRemainingAmount = Math.max(0, updatedPrice - advance);
      }

      updateBookingItem(rawBookingId, {
        extraServices: updatedExtras,
        totalPrice: updatedPrice,
        remainingAmount: updatedRemainingAmount,
        durationInMinutes: updatedDuration,
      });

      // 4. Refetch booking details from server
      await fetchBooking();

      setShowAddExtraModal(false);
      setSelectedExtras({});
      Alert.alert("Success", "Extra service added to your ongoing booking!");
    } catch (error: any) {
      console.error("[Flow Error] Error adding extra service:", error);
      Alert.alert("Error", error?.message || "Failed to add extra service. Please try again.");
    } finally {
      setSubmittingExtra(false);
    }
  };

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


  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);


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
      const payType = booking && booking.paymentStatus === 'partially_paid' ? 'BALANCE' : 'FULL';
      const response = await api.post(`/booking/createorder/${bookingId}`, { paymentType: payType });
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

  const handleCancelPress = () => {
    if (!booking) return;

    const scheduleTimeStr = booking.scheduleDateTime;

    if (isScheduledBooking && scheduleTimeStr) {
      const scheduledTime = new Date(scheduleTimeStr).getTime();
      const currentTime = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      if (scheduledTime - currentTime < oneDayInMs) {
        Alert.alert(
          "Cannot Cancel Booking",
          "Scheduled bookings can only be cancelled at least 24 hours (1 day) before the scheduled time.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    setCancelModalVisible(true);
  };

  const handleCancelConfirm = (reason: string) => {
    socket.emit("user-cancel-booking", { bookingId, cancelReason: reason });
    cancelBooking(bookingId, reason);
    setCancelModalVisible(false);
    navigation.navigate("BookingsMain", { activeTab: "history" });
  };



  const handleRejectService = async () => {
    const currentBooking = bookingRef.current;
    if (!serviceProposal || serviceActionLoading) return;
    if (!currentBooking || !currentBooking._id) return;

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
      setLoading(true);
      const res = await api.get(`/booking/${bookingId}`);

      const rawBooking = res.data?.booking || res.data?.data || res.data;
      if (rawBooking && (rawBooking._id || rawBooking.id)) {
        const mapped = mapBookingToBookingItem(rawBooking);

        const currentBooking = bookingRef.current;
        upsertBooking({
          ...mapped,
          otp: mapped.otp ?? currentBooking?.otp   // 🔑 PRESERVE OTP
        });
      } else {
        console.warn(`[Flow Step 6 Warn] Unexpected backend response shape:`, res.data);
      }
    } catch (err: any) {
      console.warn("Failed to fetch booking details:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    if (bookingId) {
      socket.emit("join-tracking", { bookingId });
      socket.emit("join-booking", { bookingId });
      socket.emit("join", { bookingId });
      socket.emit("join", bookingId);
      socket.emit("join-room", bookingId);
      socket.emit("join-service-timer", { bookingId });
    }
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;

    const handleTripOrArrival = (data: any) => {
      const incomingId = String(data?.bookingId || data?.id || data?._id || "");
      if (incomingId && incomingId !== String(bookingId)) return;

      console.log("📍 [BookingOtp] Received trip/arrival/status socket update:", data);
      
      // Immediate local update for faster UI response
      if (data?.status || data?.eta || data?.latitude || data?.otp) {
        updateBookingItem(String(bookingId), {
          ...(data.status ? { status: data.status } : {}),
          ...(data.eta ? { eta: data.eta } : {}),
          ...(data.otp ? { otp: String(data.otp) } : {}),
          ...(data.latitude && data.longitude ? {
            providerCoordinates: { latitude: Number(data.latitude), longitude: Number(data.longitude) }
          } : {})
        });
      }
      
      fetchBooking();
    };

    socket.on("provider-started-trip", handleTripOrArrival);
    socket.on("servicer-started-trip", handleTripOrArrival);
    socket.on("trip-started", handleTripOrArrival);
    socket.on("technician-started-trip", handleTripOrArrival);
    socket.on("start-trip", handleTripOrArrival);
    socket.on("provider-on-the-way", handleTripOrArrival);
    socket.on("servicer-on-the-way", handleTripOrArrival);
    socket.on("on-the-way", handleTripOrArrival);
    socket.on("provider-arrived", handleTripOrArrival);
    socket.on("servicer-arrived", handleTripOrArrival);
    socket.on("technician-arrived", handleTripOrArrival);
    socket.on("arrived", handleTripOrArrival);
    socket.on("otp-generated", handleTripOrArrival);
    socket.on("start-service-otp", handleTripOrArrival);
    socket.on("otp-verified", handleTripOrArrival);
    socket.on("service-started", handleTripOrArrival);
    socket.on("in-progress", handleTripOrArrival);
    socket.on("service-in-progress", handleTripOrArrival);

    return () => {
      socket.off("provider-started-trip", handleTripOrArrival);
      socket.off("servicer-started-trip", handleTripOrArrival);
      socket.off("trip-started", handleTripOrArrival);
      socket.off("technician-started-trip", handleTripOrArrival);
      socket.off("start-trip", handleTripOrArrival);
      socket.off("provider-on-the-way", handleTripOrArrival);
      socket.off("servicer-on-the-way", handleTripOrArrival);
      socket.off("on-the-way", handleTripOrArrival);
      socket.off("provider-arrived", handleTripOrArrival);
      socket.off("servicer-arrived", handleTripOrArrival);
      socket.off("technician-arrived", handleTripOrArrival);
      socket.off("arrived", handleTripOrArrival);
      socket.off("otp-generated", handleTripOrArrival);
      socket.off("start-service-otp", handleTripOrArrival);
      socket.off("otp-verified", handleTripOrArrival);
      socket.off("service-started", handleTripOrArrival);
      socket.off("in-progress", handleTripOrArrival);
      socket.off("service-in-progress", handleTripOrArrival);
    };
  }, [bookingId]);


  useEffect(() => {
    const onExtraResponse = (data: any) => {
      if (!data || String(data.bookingId) !== String(bookingId)) return;

      const currentBooking = bookingRef.current;
      if (!currentBooking) return;

      if (data.status === "APPROVED" || data.status === "approved") {
        const updatedPrice = data.totalPrice != null ? Number(data.totalPrice) : currentBooking.totalPrice;
        const updatedDuration = data.durationInMinutes != null ? Number(data.durationInMinutes) : currentBooking.durationInMinutes;
        
        updateBookingItem(String(bookingId), {
          pendingServiceProposal: null,
          totalPrice: updatedPrice,
          durationInMinutes: updatedDuration,
        });
        fetchBooking();
      }

      if (data.status === "REJECTED" || data.status === "rejected") {
        updateBookingItem(String(bookingId), {
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
      if (!data || String(data.bookingId) !== String(bookingId)) return;

      const currentBooking = bookingRef.current;
      if (!currentBooking) return;

      upsertBooking({
        ...currentBooking,
        pendingServiceProposal: data.extraService || data.proposal || null,
      });
    };

    socket.on("extra-service-proposed", onExtraServiceProposed);

    return () => {
      socket.off("extra-service-proposed", onExtraServiceProposed);
    };
  }, [bookingId]);

  const handleNavigateToReview = () => {
    navigation.navigate("BookingTab", {
      screen: "Review",
      params: { bookingId: String(bookingId) },
    });
  };

  useEffect(() => {
    const onBookingCompleted = (payload: any) => {
      const id = String(
        payload?.bookingId ||
        payload?.id ||
        payload?._id ||
        payload?.booking?._id ||
        payload?.booking?.id ||
        payload?.data?.bookingId ||
        (typeof payload === "string" ? payload : "")
      );
      if (!id || String(id) !== String(bookingId)) return;

      updateBookingItem(String(bookingId), { status: "completed" });
      fetchBooking();
      navigation.navigate("BookingTab", {
        screen: "Review",
        params: { bookingId: String(bookingId) },
      });
    };

    socket.on("booking-completed", onBookingCompleted);
    socket.on("service-completed", onBookingCompleted);
    socket.on("booking-complete", onBookingCompleted);
    socket.on("service-complete", onBookingCompleted);
    socket.on("service-finished", onBookingCompleted);

    return () => {
      socket.off("booking-completed", onBookingCompleted);
      socket.off("service-completed", onBookingCompleted);
      socket.off("booking-complete", onBookingCompleted);
      socket.off("service-complete", onBookingCompleted);
      socket.off("service-finished", onBookingCompleted);
    };
  }, [bookingId]);

  // ===============================
  // TIME-BASED SERVICE TIMER STATE
  // ===============================
  // ===============================
  // TIME-BASED SERVICE TIMER STATE
  // ===============================
  const [timerData, setTimerData] = useState<{
    isTimeBased?: boolean;
    timerStatus?: string;
    remainingSeconds?: number;
    extraRemainingSeconds?: number;
    overtimeSeconds?: number;
    totalDurationMinutes?: number;
    startTime?: string | number;
  } | null>(null);

  // Helper to parse timer data and accurately calculate remaining time from backend startTime
  const parseAndSyncTimer = (raw: any, fallbackDuration: number = 60) => {
    if (!raw) return null;
    const data = raw.timerStatus || raw.timer || raw.serviceTimer || raw.data || raw;
    const durationMins = Number(
      data.totalDurationMinutes ||
      data.durationInMinutes ||
      raw.totalDurationMinutes ||
      raw.durationInMinutes ||
      bookingRef.current?.durationInMinutes ||
      fallbackDuration
    );
    const totalSecs = durationMins * 60;
    let startStr =
      data.startTime ||
      data.startedAt ||
      data.serviceStartedAt ||
      raw.serviceStartTime ||
      raw.startedAt ||
      bookingRef.current?.serviceStartTime;

    let remainingSecs = data.remainingSeconds != null ? Number(data.remainingSeconds) : undefined;
    let timerStatus = data.timerStatus || data.status || "RUNNING";
    let overtimeSecs = Number(data.overtimeSeconds || 0);

    // If remainingSeconds was directly provided from server/socket, infer startTime to synchronize clock
    if (remainingSecs != null && !startStr) {
      const elapsed = Math.max(0, totalSecs - remainingSecs);
      startStr = new Date(Date.now() - (elapsed * 1000)).toISOString();
    }

    if (startStr) {
      const startMs = new Date(startStr).getTime();
      if (!isNaN(startMs) && startMs > 0) {
        const elapsedSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        if (elapsedSecs < totalSecs) {
          remainingSecs = totalSecs - elapsedSecs;
          timerStatus = "RUNNING";
        } else if (elapsedSecs < totalSecs + 600) {
          remainingSecs = (totalSecs + 600) - elapsedSecs;
          timerStatus = "EXTRA_TIME_RUNNING";
        } else {
          remainingSecs = 0;
          timerStatus = "OVERTIME_RUNNING";
          overtimeSecs = elapsedSecs - (totalSecs + 600);
        }
      }
    }

    if (remainingSecs == null) {
      remainingSecs = totalSecs;
    }

    return {
      isTimeBased: true,
      timerStatus,
      remainingSeconds: Math.max(0, Number(remainingSecs)),
      extraRemainingSeconds: timerStatus === "EXTRA_TIME_RUNNING" ? Math.max(0, Number(remainingSecs)) : 600,
      overtimeSeconds: overtimeSecs,
      totalDurationMinutes: durationMins,
      startTime: startStr,
    };
  };

  useEffect(() => {
    const fetchTimerStatus = async () => {
      try {
        const res = await api.get(`/booking/${bookingId}/timer-status`);
        const synced = parseAndSyncTimer(res.data, booking?.durationInMinutes || 60);
        if (synced) {
          setTimerData(synced);
        }
      } catch (err) {
        // If timer-status endpoint not available, fallback to booking's own timestamps
        if (booking) {
          const synced = parseAndSyncTimer(booking, booking.durationInMinutes || 60);
          if (synced) setTimerData(synced);
        }
      }
    };

    if (['in_progress', 'otp_verified'].includes(booking?.status || '')) {
      fetchTimerStatus();
    }

    const onTimerStatus = (data: any) => {
      if (!data) return;
      const incomingId = String(data.bookingId || data.id || data._id || "");
      if (incomingId && incomingId !== String(bookingId)) return;
      const synced = parseAndSyncTimer(data, booking?.durationInMinutes || 60);
      if (synced) {
        setTimerData(synced);
      }
    };

    socket.on("service-timer-started", onTimerStatus);
    socket.on("booking-timer-status", onTimerStatus);
    socket.on("timer-status", onTimerStatus);
    socket.on("timer-update", onTimerStatus);
    socket.on("timer-tick", onTimerStatus);
    socket.on("service-timer", onTimerStatus);
    socket.on("extra-timer-extended", (data: any) => {
      const synced = parseAndSyncTimer(data, booking?.durationInMinutes || 60);
      if (synced) {
        setTimerData(synced);
      }
    });

    return () => {
      socket.off("service-timer-started", onTimerStatus);
      socket.off("booking-timer-status", onTimerStatus);
      socket.off("timer-status", onTimerStatus);
      socket.off("timer-update", onTimerStatus);
      socket.off("timer-tick", onTimerStatus);
      socket.off("service-timer", onTimerStatus);
      socket.off("extra-timer-extended");
    };
  }, [bookingId, booking?.status, booking?.durationInMinutes, booking?.serviceStartTime]);

  // Real-time 1-second countdown tick with timestamp reconciliation
  useEffect(() => {
    if (!['in_progress', 'otp_verified'].includes(booking?.status || '')) {
      return;
    }

    const interval = setInterval(() => {
      setTimerData((prev: any) => {
        if (!prev) {
          if (booking?.status === 'in_progress') {
            return parseAndSyncTimer(booking, booking.durationInMinutes || 60);
          }
          return null;
        }

        // If we have startTime, recalculate with exact system clock
        if (prev.startTime) {
          const startMs = new Date(prev.startTime).getTime();
          if (!isNaN(startMs) && startMs > 0) {
            const durationMins = prev.totalDurationMinutes || 60;
            const totalSecs = durationMins * 60;
            const elapsedSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));

            if (elapsedSecs < totalSecs) {
              return {
                ...prev,
                timerStatus: 'RUNNING',
                remainingSeconds: totalSecs - elapsedSecs,
              };
            } else if (elapsedSecs < totalSecs + 600) {
              return {
                ...prev,
                timerStatus: 'EXTRA_TIME_RUNNING',
                remainingSeconds: 0,
                extraRemainingSeconds: (totalSecs + 600) - elapsedSecs,
              };
            } else {
              return {
                ...prev,
                timerStatus: 'OVERTIME_RUNNING',
                remainingSeconds: 0,
                extraRemainingSeconds: 0,
                overtimeSeconds: elapsedSecs - (totalSecs + 600),
              };
            }
          }
        }

        // Fallback decrement if startTime not provided
        if (prev.timerStatus === 'RUNNING') {
          if (prev.remainingSeconds > 1) {
            return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
          } else {
            return {
              ...prev,
              timerStatus: 'EXTRA_TIME_RUNNING',
              remainingSeconds: 0,
              extraRemainingSeconds: 600,
            };
          }
        }

        if (prev.timerStatus === 'EXTRA_TIME_RUNNING') {
          if (prev.extraRemainingSeconds > 1) {
            return { ...prev, extraRemainingSeconds: prev.extraRemainingSeconds - 1 };
          } else {
            return {
              ...prev,
              timerStatus: 'OVERTIME_RUNNING',
              extraRemainingSeconds: 0,
              overtimeSeconds: 1,
            };
          }
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [booking?.status]);

  const formatTimerSeconds = (totalSecs: number = 0) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}h ${remMins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${remMins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };
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
      if (activeTab) {
        navigation.navigate("BookingsMain", { activeTab });
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("BookingsMain", { activeTab: "ongoing" });
      }
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [navigation, activeTab]);




  const handleApprove = async () => {
    if (!PendingRequest || partActionLoading) return;

    try {
      setPartActionLoading(true);

      await api.post(`/booking/approve/${PendingRequest.requestId}`);

      setRequestQueue((prev) => prev.slice(1));
      fetchBooking();

    } catch (err) {
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


      await initiateMaskedCall(bookingId);

      Alert.alert(
        "Connecting...",
        "You will receive a call shortly. Please keep your phone reachable."
      );

    } catch (err: any) {
      //console.log("❌ Call failed:", err?.response?.data);

      Alert.alert(
        "Call Failed",
        "Unable to connect call. Please try again later."
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


  if (!booking && loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <AppText style={{ marginTop: 12 }}>Loading booking details...</AppText>
      </View>
    );
  }

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
    if (activeTab) {
      navigation.navigate("BookingsMain", { activeTab });
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("BookingsMain", { activeTab: "ongoing" });
    }
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
          rightIcon={
            booking && !['completed', 'cancelled', 'in_progress'].includes(booking.status)
              ? 'information-circle-outline'
              : undefined
          }
          onRightPress={handleCancelPress}
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
                backgroundColor: booking.status === 'cancelled'
                  ? '#FEE2E2'
                  : booking.status === 'scheduled'
                    ? '#E0E7FF'
                    : ((booking.assignmentStatus === 'FAILED' || booking.status === 'manual_assign') && !booking.isManuallyAssigned)
                      ? theme.colors.primary + '30'
                      : ['pending', 'confirmed', 'searching'].includes(booking.status)
                        ? theme.colors.primary + '30'
                        : ['provider_arrived', 'otp_verified', 'completed'].includes(booking.status)
                          ? '#D1FAE5'
                          : ['provider_started_trip', 'provider_on_the_way'].includes(booking.status)
                            ? '#CCFBF1'
                            : brightCyan
              },
              animatedCircleStyle,
            ]}
          >
            <Ionicons
              name={
                booking.status === 'completed'
                  ? 'checkmark-done-outline'
                  : booking.status === 'cancelled'
                    ? 'close-circle-outline'
                    : booking.status === 'scheduled'
                      ? 'calendar-outline'
                      : ((booking.assignmentStatus === 'FAILED' || booking.status === 'manual_assign') && !booking.isManuallyAssigned)
                        ? 'alert-circle-outline'
                        : ['pending', 'confirmed', 'searching'].includes(booking.status)
                          ? 'search-outline'
                          : ['provider_started_trip', 'provider_on_the_way'].includes(booking.status)
                            ? 'navigate-outline'
                            : booking.status === 'provider_arrived'
                              ? 'location-outline'
                              : booking.status === 'otp'
                                ? 'key-outline'
                                : booking.status === 'otp_verified'
                                  ? 'checkmark-circle-outline'
                                  : booking.status === 'in_progress'
                                    ? 'construct-outline'
                                    : 'person-outline'
              }
              size={32}
              color={
                booking.status === 'cancelled'
                  ? '#DC2626'
                  : booking.status === 'scheduled'
                    ? '#3730A3'
                    : ((booking.assignmentStatus === 'FAILED' || booking.status === 'manual_assign') && !booking.isManuallyAssigned)
                      ? theme.colors.primary
                      : ['pending', 'confirmed', 'searching'].includes(booking.status)
                        ? theme.colors.primary
                        : ['provider_arrived', 'otp_verified', 'completed'].includes(booking.status)
                          ? '#059669'
                          : ['provider_started_trip', 'provider_on_the_way'].includes(booking.status)
                            ? '#0D9488'
                            : "#0F172A"
              }
            />
          </Animated.View>
          <AppText size="h3" weight="bold" style={styles.headerTitle}>
            {booking.status === 'completed'
              ? 'Service Completed!'
              : booking.status === 'cancelled'
                ? 'Booking Cancelled'
                : booking.status === 'scheduled'
                  ? 'Upcoming Service'
                  : booking.status === 'in_progress'
                    ? 'Service in Progress'
                    : booking.status === 'otp_verified'
                      ? 'OTP Verified!'
                      : booking.status === 'otp'
                        ? 'Start Service OTP'
                        : booking.status === 'provider_arrived'
                          ? 'Technician Arrived!'
                          : booking.status === 'provider_on_the_way'
                            ? 'Technician On The Way!'
                            : booking.status === 'provider_started_trip'
                              ? 'Technician Started Trip!'
                              : (booking.status === 'accepted' || booking.status === 'assigned')
                                ? 'Technician Assigned!'
                                : ((booking.assignmentStatus === 'FAILED' || booking.status === 'manual_assign') && !booking.isManuallyAssigned)
                                  ? 'Awaiting Manual Assignment'
                                  : 'Searching Technician...'}
          </AppText>
        </View>

        <Animated.View style={animatedContentStyle}>

          {/* Completed Banner */}
          {booking.status === 'completed' && (
            <AppCard style={styles.completedCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7', width: 48, height: 48, borderRadius: 24, marginRight: 0 }]}>
                  <Ionicons name="checkmark-done-circle" size={30} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size="body" style={{ color: "#065F46", fontSize: 16 }}>
                    Service Completed!
                  </AppText>
                  <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
                    {booking.isReviewed
                      ? "Thank you for your rating and feedback!"
                      : "Your service has been completed successfully. Please share your rating and feedback."}
                  </AppText>
                </View>
              </View>

              {booking.isReviewed && booking.userRating ? (
                <View style={styles.reviewedBadgeRow}>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= (booking.userRating || 0) ? "star" : "star-outline"}
                        size={18}
                        color="#F59E0B"
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                  <AppText size="small" weight="bold" style={{ color: "#047857" }}>
                    Your Rating: {booking.userRating}/5
                  </AppText>
                </View>
              ) : null}

              {!booking.isReviewed && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={handleNavigateToReview}
                  activeOpacity={0.85}
                >
                  <Ionicons name="star" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <AppText weight="bold" style={{ color: "#FFFFFF", fontSize: 15 }}>
                    Rate & Review Service
                  </AppText>
                </TouchableOpacity>
              )}
            </AppCard>
          )}

          {/* Cancelled Banner */}
          {booking.status === 'cancelled' && (
            <AppCard style={styles.cancelledCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2', width: 44, height: 44, borderRadius: 22, marginRight: 0 }]}>
                  <Ionicons name="close-circle" size={26} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size="body" style={{ color: "#991B1B", fontWeight: '700' }}>
                    Booking Cancelled
                  </AppText>
                  <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
                    This service request has been cancelled.
                  </AppText>
                </View>
              </View>
              {booking.cancelReason && (
                <View style={[styles.cancelReasonBox, { backgroundColor: theme.colors.background }]}>
                  <AppText weight="semibold" size="small" style={{ color: "#7F1D1D", marginBottom: 4 }}>
                    Cancellation Reason:
                  </AppText>
                  <AppText style={{ color: "#B91C1C", fontSize: 13, lineHeight: 18 }}>
                    {booking.cancelReason}
                  </AppText>
                </View>
              )}
            </AppCard>
          )}



          {/* 4 Process Booking Tracker */}
          {booking.status !== 'cancelled' && (booking.paymentStatus !== 'pending' && booking.paymentStatus !== 'unpaid') && (
            <BookingProcessTracker booking={booking} />
          )}

          {/* ⏱️ TIME-BASED SERVICE COUNTDOWN & EXTRA BUFFER TIMER CARD */}
          {timerData?.isTimeBased && ['in_progress', 'otp_verified'].includes(booking?.status || '') && (
            <AppCard style={{
              marginHorizontal: 16,
              marginVertical: 10,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: timerData.timerStatus === 'EXTRA_TIME_RUNNING'
                ? '#FFFBEB'
                : timerData.timerStatus === 'OVERTIME_RUNNING'
                  ? '#FAF5FF'
                  : '#ECFDF5',
              borderWidth: 1.5,
              borderColor: timerData.timerStatus === 'EXTRA_TIME_RUNNING'
                ? '#F59E0B'
                : timerData.timerStatus === 'OVERTIME_RUNNING'
                  ? '#A855F7'
                  : '#10B981',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: timerData.timerStatus === 'EXTRA_TIME_RUNNING' ? "#F59E0B" : timerData.timerStatus === 'OVERTIME_RUNNING' ? "#A855F7" : "#059669",
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="time" size={16} color="#FFFFFF" />
                  </View>
                  <Ionicons
                    name="timer-outline"
                    size={18}
                    color={timerData.timerStatus === 'EXTRA_TIME_RUNNING' ? "#D97706" : timerData.timerStatus === 'OVERTIME_RUNNING' ? "#9333EA" : "#059669"}
                  />
                  <AppText weight="bold" style={{
                    color: timerData.timerStatus === 'EXTRA_TIME_RUNNING' ? "#B45309" : timerData.timerStatus === 'OVERTIME_RUNNING' ? "#7E22CE" : "#065F46",
                    fontSize: 16,
                  }}>
                    Job Service Timer
                  </AppText>
                </View>

                <AppText weight="bold" style={{
                  fontSize: 24,
                  letterSpacing: 1,
                  color: timerData.timerStatus === 'EXTRA_TIME_RUNNING' ? "#B45309" : timerData.timerStatus === 'OVERTIME_RUNNING' ? "#7E22CE" : "#065F46",
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                }}>
                  {timerData.timerStatus === 'RUNNING' && formatTimerSeconds(timerData.remainingSeconds)}
                  {timerData.timerStatus === 'EXTRA_TIME_RUNNING' && formatTimerSeconds(timerData.extraRemainingSeconds)}
                  {timerData.timerStatus === 'OVERTIME_RUNNING' && `+${formatTimerSeconds(timerData.overtimeSeconds)}`}
                </AppText>
              </View>

              <AppText size="small" style={{
                color: timerData.timerStatus === 'EXTRA_TIME_RUNNING' ? "#92400E" : timerData.timerStatus === 'OVERTIME_RUNNING' ? "#6B21A8" : "#047857",
                marginTop: 6,
                fontSize: 12,
              }}>
                {timerData.timerStatus === 'RUNNING' && "Countdown synchronized with user in real time."}
                {timerData.timerStatus === 'EXTRA_TIME_RUNNING' && "Initial service duration completed. 10-minute extra grace period active."}
                {timerData.timerStatus === 'OVERTIME_RUNNING' && "Your service is ongoing in extended overtime mode."}
              </AppText>
            </AppCard>
          )}

          {/* Remaining Balance / Unpaid Payment */}
          {booking && !['paid', 'completed'].includes(booking.paymentStatus || '') && paymentAmount > 0 && (
            <AppCard style={styles.balancePaymentCard}>
              <AppText weight="bold" size="h3" style={{ marginBottom: 12 }}>
                {paymentLabel} Payment
              </AppText>
              <View style={[styles.priceBox, { backgroundColor: theme.colors.background }]}>
                <View style={styles.priceRow}>
                  <AppText color="textMuted">{paymentLabel}</AppText>
                  <AppText weight="bold" style={{ color: theme.colors.text }}>
                    ₹{paymentAmount}
                  </AppText>
                </View>
              </View>

              <View style={styles.balanceActionRow}>
                <TouchableOpacity
                  style={[styles.balanceBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setShowPaymentSheet(true)}
                  disabled={paying}
                >
                  <AppText weight="semibold" style={{ color: '#fff' }}>
                    Pay Online
                  </AppText>
                </TouchableOpacity>
              </View>
            </AppCard>
          )}

          {/* 🗺️ LIVE MAP: Active ONLY during provider_started_trip, provider_on_the_way, and provider_arrived */}
          {['provider_started_trip', 'provider_on_the_way', 'provider_arrived'].includes(booking.status) && (
            <LiveTrackingMap
              bookingId={booking._id}
              status={booking.status}
              customerCoordinates={booking.customerCoordinates}
              customerAddress={booking.address}
              initialProviderCoordinates={booking.providerCoordinates}
              initialEta={booking.eta}
              providerName={booking.name || "Technician"}
              providerPhone={booking.phone}
            />
          )}

          {/* Stage 2: Provider Accepted Confirmation Banner (No Map, No OTP) */}
          {(booking.status === 'accepted' || (booking.status === 'assigned' && !booking.isManuallyAssigned)) && (
            <AppCard style={styles.acceptedBannerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE', width: 44, height: 44, borderRadius: 22 }]}>
                  <Ionicons name="checkmark-circle" size={26} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size="body" style={{ color: "#0369A1" }}>
                    Service Provider Accepted!
                  </AppText>
                  <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
                    {booking.name || "Technician"} has accepted your booking. You will be able to track their live location once they start the trip.
                  </AppText>
                </View>
              </View>
            </AppCard>
          )}

          {/* Stage 5: Provider Arrived Alert Banner */}
          {booking.status === 'provider_arrived' && (
            <AppCard style={styles.arrivedBannerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5', width: 44, height: 44, borderRadius: 22 }]}>
                  <Ionicons name="location" size={26} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size="body" style={{ color: "#065F46" }}>
                    Technician Arrived!
                  </AppText>
                  <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
                    Your technician has reached your address. Please meet them to begin the service.
                  </AppText>
                </View>
              </View>
            </AppCard>
          )}

          {/* Stage 7: OTP Verified Success Transition Banner */}
          {booking.status === 'otp_verified' && (
            <AppCard style={styles.otpVerifiedCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7', width: 44, height: 44, borderRadius: 22 }]}>
                  <Ionicons name="shield-checkmark" size={26} color="#166534" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size="body" style={{ color: "#166534" }}>
                    OTP Verified Successfully!
                  </AppText>
                  <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
                    Technician is starting your service now.
                  </AppText>
                </View>
              </View>
            </AppCard>
          )}

          {/* Technician Profile Card */}
          {booking.name &&
            ([
              'accepted',
              'assigned',
              'provider_started_trip',
              'provider_on_the_way',
              'provider_arrived',
              'otp',
              'otp_verified',
              'in_progress',
              'completed',
            ].includes(booking.status) ||
              booking.assignmentStatus === 'FAILED' ||
              booking.status === 'manual_assign') && (
              <BookingDetailsCard
                name={booking.name ?? "Assigned Technician"}
                role={booking.serviceCategoryName}
                image={booking.image}
                eta={booking.eta}
                phone={booking.phone}
                onCallPress={handleCallPress}
              />
            )}

          {/* Stage 6: START SERVICE OTP (Share OTP with servicer) */}
          {booking.otp && !['completed', 'cancelled', 'otp_verified', 'in_progress'].includes(booking.status) && (
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
                Share this code with the technician to begin service
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





          {/* Ongoing Service Extra Booking Card */}
          {booking &&
            [
              'accepted',
              'assigned',
              'provider_started_trip',
              'provider_on_the_way',
              'provider_arrived',
              'otp',
              'otp_verified',
              'in_progress',
              'manual_assign',
            ].includes(booking.status) && (
            <AppCard style={styles.addExtraCard}>
              <View style={styles.addExtraHeader}>
                <View style={[styles.iconCircle, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="sparkles" size={22} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" size="h3" style={{ color: "#0F172A" }}>
                    Need Extra Services?
                  </AppText>
                  <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
                    Add extra tasks or services to your ongoing booking
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addExtraBtn}
                onPress={handleOpenAddExtraModal}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <AppText weight="bold" style={{ color: "#FFFFFF", fontSize: 15 }}>
                  + Add Extra Service
                </AppText>
              </TouchableOpacity>
            </AppCard>
          )}



          {/* Summary */}
          {booking.status !== 'cancelled' && (
            <AppCard style={styles.arrivalCard}>
              <View style={styles.summaryContainer}>
                <AppText
                  weight="bold"
                  size="h3"
                  style={[styles.summaryTitle, { marginTop: 20 }]}
                >
                  Booking Summary
                </AppText>

                <View style={styles.summaryRow}>
                  <AppText style={{ color: "#475569" }}>Service Time</AppText>
                  <AppText style={{ color: "#0F172A" }} weight="medium">
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
                      : (booking.dateLabel ? `${booking.dateLabel} ${booking.timeLabel || ""}` : "Immediate")}
                  </AppText>
                </View>

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

                {(Array.isArray(booking.extraServices) ? booking.extraServices : []).filter(s => s && String(s.status).toUpperCase() === "APPROVED").map((extra, index) => (
                  <View key={`${extra._id || index}-${index}`} style={styles.summaryRow}>
                    <AppText style={{ color: "#475569" }}>+ {extra.serviceName || "Extra Service"}</AppText>
                    <AppText style={{ color: "#0F172A" }}>
                      ₹{extra.price ?? 0}
                    </AppText>
                  </View>
                ))}

                {(booking.convenienceFee ?? FEES.CONVENIENCE_FEE) > 0 && (
                  <View style={styles.summaryRow}>
                    <AppText style={{ color: "#475569" }}>Convenience Fee</AppText>
                    <AppText style={{ color: "#0F172A" }}>
                      ₹{booking.convenienceFee ?? FEES.CONVENIENCE_FEE}
                    </AppText>
                  </View>
                )}

                <View style={styles.divider} />
                {booking.paymentStatus === 'partially_paid' && (booking.remainingAmount ?? 0) > 0 ? (
                  <>
                    <View style={styles.summaryRow}>
                      <AppText style={{ color: "#475569" }}>Total Price</AppText>
                      <AppText style={{ color: "#0F172A" }}>
                        ₹{(booking.totalPrice ?? 0) + (booking.convenienceFee ?? FEES.CONVENIENCE_FEE)}
                      </AppText>
                    </View>
                    <View style={styles.summaryRow}>
                      <AppText style={{ color: "#475569" }}>
                        {booking.paymentType === 'ADVANCE' ? 'Advance Paid (18%)' : 'Amount Paid'}
                      </AppText>
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
                    <View style={[styles.summaryRow, { marginTop: 6, alignItems: "center" }]}>
                      <AppText style={{ color: "#475569" }} weight="medium">Payment Status</AppText>
                      <View style={{ backgroundColor: "#E0F2FE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                        <AppText size="small" weight="bold" style={{ color: "#0369A1" }}>
                          Partially Paid ℹ️
                        </AppText>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.summaryRow}>
                      <AppText style={{ color: "#0F172A" }} weight="bold">Total Price</AppText>
                      <AppText style={{ color: "#0F172A" }} weight="bold">
                        ₹{(booking.totalPrice ?? 0) + (booking.convenienceFee ?? FEES.CONVENIENCE_FEE)}
                      </AppText>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 6, alignItems: "center" }]}>
                      <AppText style={{ color: "#475569" }} weight="medium">Payment Status</AppText>
                      {booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed' ? (
                        <View style={{ backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                          <AppText size="small" weight="bold" style={{ color: "#166534" }}>
                            Full Payment Paid ✅
                          </AppText>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                          <AppText size="small" weight="bold" style={{ color: "#B45309" }}>
                            Pending / Unpaid ⏳
                          </AppText>
                        </View>
                      )}
                    </View>
                  </>
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

                {isScheduledBooking && (
                  <>
                    <View style={styles.divider} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                      <Ionicons name="information-circle-outline" size={20} color="#0F766E" />
                      <AppText weight="bold" style={{ color: "#0F766E", fontSize: 14 }}>
                        Cancellation Policy
                      </AppText>
                    </View>
                    <AppText size="small" color="textMuted" style={{ marginTop: 6, lineHeight: 18 }}>
                      Scheduled bookings can only be cancelled at least 24 hours (1 day) before the service time.
                    </AppText>
                  </>
                )}
              </View>
            </AppCard>
          )}

          {/* Completed Bottom Review Button */}
          {booking.status === 'completed' && !booking.isReviewed && (
            <TouchableOpacity
              style={styles.bottomReviewBtn}
              onPress={handleNavigateToReview}
              activeOpacity={0.85}
            >
              <Ionicons name="star" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <AppText weight="bold" style={{ color: "#FFFFFF", fontSize: 16 }}>
                Rate & Review Service
              </AppText>
            </TouchableOpacity>
          )}

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
              <AppText weight="bold" size="h3">{paymentLabel} Checkout</AppText>
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
                ₹{paymentAmount}
              </AppText>
              <AppText size="caption" color="textMuted" style={{ marginTop: 2 }}>
                {booking && booking.paymentStatus === 'partially_paid' ? 'Remaining 82% balance amount' : 'Full payment amount'}
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
                title={paying ? "Processing Secure Payment..." : `Pay ${paymentLabel} ₹${paymentAmount}`}
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
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0'
          }}>
            <AppText weight="bold" size="body" style={{ color: '#0F172A' }}>Payment Checkout</AppText>
            <TouchableOpacity
              onPress={() => {
                setShowWebViewModal(false);
                setPaymentHtml(null);
                setPaying(false);
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={24} color="#0F172A" />
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
                <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: '#ffffff' }}>
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal for Booking Extra Services During Ongoing Service */}
      <Modal
        visible={showAddExtraModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!submittingExtra) setShowAddExtraModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <AppText weight="bold" size="h2" style={{ color: theme.colors.text }}>
                  Book Extra Services
                </AppText>
                <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
                  Select additional services for this ongoing booking
                </AppText>
              </View>
              {!submittingExtra && (
                <TouchableOpacity
                  onPress={() => setShowAddExtraModal(false)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Input */}
            <View style={styles.extraSearchBox}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search extra services..."
                placeholderTextColor="#94A3B8"
                value={extraSearchQuery}
                onChangeText={setExtraSearchQuery}
                style={styles.extraSearchInput}
              />
              {extraSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setExtraSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Service List */}
            {loadingExtras ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <AppText style={{ marginTop: 12 }} color="textMuted">
                  Fetching available services...
                </AppText>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                {filteredAvailableExtras.length === 0 ? (
                  <View style={styles.emptyExtrasBox}>
                    <Ionicons name="layers-outline" size={40} color="#CBD5E1" />
                    <AppText style={{ marginTop: 8, color: "#64748B" }}>
                      No extra services found
                    </AppText>
                  </View>
                ) : (
                  filteredAvailableExtras.map((item, index) => {
                    const serviceId = item._id || item.serviceCategoryName || String(index);
                    const selectedQty = selectedExtras[serviceId]?.quantity || 0;
                    const price = item.price || 0;

                    return (
                      <View key={serviceId + index} style={styles.extraItemCard}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <AppText weight="semibold" size="body" style={{ color: "#0F172A" }}>
                            {item.serviceCategoryName || item.parentServiceName}
                          </AppText>
                          <AppText size="caption" color="textMuted" style={{ marginTop: 2 }}>
                            Staff: {item.employeeCount || 1} {(item.employeeCount || 1) === 1 ? 'pro' : 'pros'}
                          </AppText>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 12 }}>
                            <AppText weight="bold" style={{ color: theme.colors.primary }}>
                              ₹{price}
                            </AppText>
                            {item.durationInMinutes ? (
                              <AppText size="caption" color="textMuted">
                                ⏱ Time: {item.durationInMinutes} mins
                              </AppText>
                            ) : null}
                          </View>
                        </View>

                        {/* Quantity Controller */}
                        {selectedQty === 0 ? (
                          <TouchableOpacity
                            style={styles.addQtyBtn}
                            onPress={() => handleToggleExtraQuantity(item, 1)}
                          >
                            <AppText weight="bold" style={{ color: "#0D9488", fontSize: 13 }}>
                              + ADD
                            </AppText>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.qtyRow}>
                            <TouchableOpacity
                              style={styles.qtyControlBtn}
                              onPress={() => handleToggleExtraQuantity(item, -1)}
                            >
                              <Ionicons name="remove" size={16} color="#0D9488" />
                            </TouchableOpacity>
                            <AppText weight="bold" style={{ marginHorizontal: 8, color: "#0F172A" }}>
                              {selectedQty}
                            </AppText>
                            <TouchableOpacity
                              style={styles.qtyControlBtn}
                              onPress={() => handleToggleExtraQuantity(item, 1)}
                            >
                              <Ionicons name="add" size={16} color="#0D9488" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Footer / Confirmation */}
            {selectedExtrasList.length > 0 && (
              <View style={styles.modalFooter}>
                <View style={styles.extraSummaryBar}>
                  <View>
                    <AppText size="small" color="textMuted">
                      Selected ({selectedExtrasList.reduce((a, b) => a + b.quantity, 0)} items)
                    </AppText>
                    <AppText weight="bold" size="h2" style={{ color: theme.colors.primary }}>
                      + ₹{totalExtraPrice}
                    </AppText>
                  </View>

                  <TouchableOpacity
                    style={[styles.confirmExtraBtn, submittingExtra && { opacity: 0.7 }]}
                    onPress={handleAddExtraServicesSubmit}
                    disabled={submittingExtra}
                  >
                    {submittingExtra ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <AppText weight="bold" style={{ color: "#FFFFFF", fontSize: 15 }}>
                        Book Extra Services
                      </AppText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <CancellationModal
        visible={cancelModalVisible}
        isScheduled={booking.isScheduled}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelModalVisible(false)}
      />
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
  addExtraCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E7FF",
    backgroundColor: "#F5F3FF",
  },
  addExtraHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  addExtraBtn: {
    backgroundColor: "#0D9488",
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  extraSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  extraSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  loaderBox: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyExtrasBox: {
    paddingVertical: 30,
    alignItems: "center",
  },
  extraItemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addQtyBtn: {
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  qtyControlBtn: {
    padding: 4,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 16,
    marginTop: 10,
  },
  extraSummaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmExtraBtn: {
    backgroundColor: "#0D9488",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  policyCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0F2FE",
    backgroundColor: "#F0F9FF",
    marginHorizontal: 4,
  },
  cancelBookingButton: {
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: '#FFF5F5',
    marginHorizontal: 4,
  },
  cancelledCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    marginHorizontal: 4,
  },
  cancelReasonBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  acceptedBannerCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    backgroundColor: "#F0F9FF",
    marginHorizontal: 4,
  },
  arrivedBannerCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
    marginHorizontal: 4,
  },
  otpVerifiedCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
    marginHorizontal: 4,
  },
  completedCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
    marginHorizontal: 4,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewButton: {
    backgroundColor: "#0D9488",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomReviewBtn: {
    backgroundColor: "#0D9488",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    marginBottom: 20,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#A7F3D0",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
