import api from "@/src/api/client";
import { useBooking } from "@/src/context/BookingContext";
import { useAuth } from "@/src/hook/useAuth";
import { BookingParamList } from "@/src/navigation/stacks/BookingStack";
import { socket } from "@/src/socket/socket";
import { useTheme } from "@/src/theme/useTheme";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";

export function useBookingOtpLogic() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<RouteProp<BookingParamList, "BookingDetails">>();
  const { bookingId } = route.params;
  const { getBookingById, upsertBooking, updateBookingItem } = useBooking();
  const booking = getBookingById(bookingId);
  const serviceProposal = booking?.pendingServiceProposal;
  const navigation = useNavigation<any>();

  // Animation
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 20 }],
  }));

  // Colors
  const brightCyan = "#67E8F9";
  const otpBg = "#A5F3FC";
  const primaryTeal = "#0D9488";

  // Part approval
  const [PendingRequest, setPendingRequest] = useState<any | null>(null);
  const [partActionLoading, setPartActionLoading] = useState(false);

  // Approve/Reject Service Proposal
  const handleApproveService = () => {
    if (!serviceProposal) return;
    console.log("[SOCKET EMIT] 📤 extra-service-approve (true):", bookingId);
    socket.emit("extra-service-approve", {
      bookingId,
      extraServiceId: serviceProposal._id,
      approve: true,
      userId: user?._id,
    });
    updateBookingItem(bookingId, {
      pendingServiceProposal: null,
      totalPrice: serviceProposal.price + (booking?.totalPrice ?? 0),
      durationInMinutes: serviceProposal.durationInMinutes + (booking?.durationInMinutes ?? 0),
    });
  };
  const handleRejectService = () => {
    if (!serviceProposal) return;
    console.log("[SOCKET EMIT] 📤 extra-service-approve (false):", bookingId);
    socket.emit("extra-service-approve", {
      bookingId,
      extraServiceId: serviceProposal._id,
      approve: false,
      userId: user?._id,
    });
    updateBookingItem(bookingId, {
      pendingServiceProposal: null,
    });
  };

  // Approve/Reject Parts
  const handleApprove = async () => {
    if (!PendingRequest) return;
    setPartActionLoading(true);
    try {
      await api.post(`/booking/approve/${PendingRequest.requestId}`);

      // Refetch booking after approving parts to ensure totalPrice updates reflect
      const res = await api.get(`/booking/${bookingId}`);
      if (res.data?.booking) {
        upsertBooking(mapBookingToBookingItem(res.data.booking));
      }
    } catch (error) {
      console.warn("Failed to approve part or refetch:", error);
    } finally {
      setPendingRequest(null);
      setPartActionLoading(false);
    }
  };
  const handleReject = async () => {
    if (!PendingRequest) return;
    setPartActionLoading(true);
    await api.post(`/reject/${PendingRequest.requestId}`);
    setPendingRequest(null);
    setPartActionLoading(false);
  };

  // Effects
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withDelay(300, withSpring(1));
  }, []);

  useEffect(() => {
    if (!booking?.name) {
      api.get(`/booking/${bookingId}`).then(res => {
        if (res.data?.booking) {
          const mapped = mapBookingToBookingItem(res.data.booking);
          upsertBooking(mapped);
        }
      }).catch(err => {
        console.warn("Failed to fetch booking details:", err);
      });
    }
  }, [bookingId]);

  useEffect(() => {
    const onExtraResponse = (data: any) => {
      console.log("[SOCKET RECEIVE] 📥 extra-service-response:", data);
      if (data.bookingId !== bookingId) return;
      if (data.status === "APPROVED") {
        updateBookingItem(bookingId, {
          pendingServiceProposal: null,
          totalPrice: data.totalPrice,
          durationInMinutes: data.durationInMinutes ?? booking?.durationInMinutes,
        });

        // Refetch booking fully to populate updated `extraServices` arrays
        api.get(`/booking/${bookingId}`).then(res => {
          if (res.data?.booking) {
            upsertBooking(mapBookingToBookingItem(res.data.booking));
          }
        }).catch(err => console.warn(err));

      }
      if (data.status === "REJECTED") {
        updateBookingItem(bookingId, {
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
      console.log("[SOCKET RECEIVE] 📥 extra-service-proposed:", data);
      if (data.bookingId !== bookingId) return;
      updateBookingItem(bookingId, {
        pendingServiceProposal: data.extraService,
      });
    };
    socket.on("extra-service-proposed", onExtraServiceProposed);
    return () => {
      socket.off("extra-service-proposed", onExtraServiceProposed);
    };
  }, [bookingId]);

  useEffect(() => {
    socket.on("tool-request-created", payload => {
      console.log("[SOCKET RECEIVE] 🧰 tool-request-created:", payload);
      setPendingRequest(payload);
    });
    return () => {
      socket.off("tool-request-created");
    };
  }, []);

  useEffect(() => {
    socket.on("tool-requested", (payload) => {
      console.log("[SOCKET RECEIVE] 🧰 tool-requested:", payload);
      setPendingRequest(payload);
    });
    return () => {
      socket.off("tool-requested");
    };
  }, []);

  return {
    booking,
    serviceProposal,
    PendingRequest,
    partActionLoading,
    handleApproveService,
    handleRejectService,
    handleApprove,
    handleReject,
    animatedCircleStyle,
    animatedContentStyle,
    brightCyan,
    otpBg,
    primaryTeal,
    navigation,
    bookingId,
  };
}