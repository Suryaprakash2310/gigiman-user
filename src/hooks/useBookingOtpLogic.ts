import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useTheme } from "@/src/theme/useTheme";
import { useBooking } from "@/src/context/BookingContext";
import { useAuth } from "@/src/hook/useAuth";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";
import api from "@/src/api/client";
import { socket } from "@/src/socket/socket";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";
import { RouteProp } from "@react-navigation/native";
import { BookingParamList } from "@/src/navigation/stacks/BookingStack";

export function useBookingOtpLogic() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<RouteProp<BookingParamList, "BookingDetails">>();
  const { bookingId } = route.params;
  const { getBookingById, upsertBooking } = useBooking();
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
    socket.emit("extra-service-approve", {
      bookingId,
      extraServiceId: booking.serviceCategoryName,
      approve: true,
      userId: user?._id,
    });
    upsertBooking({
      ...booking!,
      pendingServiceProposal: null,
      totalPrice: serviceProposal.price + (booking?.totalPrice ?? 0),
    });
  };
  const handleRejectService = () => {
    if (!serviceProposal) return;
    socket.emit("extra-service-approve", {
      bookingId,
      approve: false,
    });
    upsertBooking({
      ...booking!,
      pendingServiceProposal: null,
    });
  };

  // Approve/Reject Parts
  const handleApprove = async () => {
    if (!PendingRequest) return;
    setPartActionLoading(true);
    await api.post(`/booking/approve/${PendingRequest.requestId}`);
    setPendingRequest(null);
    setPartActionLoading(false);
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
      if (data.bookingId !== bookingId) return;
      if (data.status === "APPROVED") {
        upsertBooking({
          ...booking!,
          pendingServiceProposal: null,
          totalPrice: data.totalPrice,
        });
      }
      if (data.status === "REJECTED") {
        upsertBooking({
          ...booking!,
          pendingServiceProposal: null,
        });
      }
    };
    socket.on("extra-service-response", onExtraResponse);
    return () => {
      socket.off("extra-service-response", onExtraResponse);
    };
  }, [bookingId, booking]);

  useEffect(() => {
    const onExtraServiceProposed = (data: any) => {
      if (data.bookingId !== bookingId) return;
      upsertBooking({
        ...booking!,
        pendingServiceProposal: data.extraService,
      });
    };
    socket.on("extra-service-proposed", onExtraServiceProposed);
    return () => {
      socket.off("extra-service-proposed", onExtraServiceProposed);
    };
  }, [bookingId, booking]);

  useEffect(() => {
    socket.on("tool-request-created", payload => {
      setPendingRequest(payload);
    });
    return () => {
      socket.off("tool-request-created");
    };
  }, []);

  useEffect(() => {
    socket.on("tool-requested", (payload) => {
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
