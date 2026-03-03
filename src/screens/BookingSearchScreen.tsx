import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppHeader from '../components/ui/AppHeader';
import AppText from "@/src/components/ui/AppText";
import { useBooking } from "@/src/context/BookingContext";
import { BookingParamList } from "@/src/navigation/stacks/BookingStack";
import { socket } from "@/src/socket/socket";
import { useTheme } from "@/src/theme/useTheme";
import api from "../api/client";
import { mapBookingToBookingItem } from "../utils/mapBooking";

type Route = RouteProp<BookingParamList, "Searching">;

const { width } = Dimensions.get('window');

// Reusable Orbit Ring Component
const OrbitRing = ({
  size,
  direction = 'cw',
  duration = 10000,
  children,
  delay = 0
}: {
  size: number;
  direction?: 'cw' | 'ccw';
  duration?: number;
  children?: React.ReactNode;
  delay?: number;
}) => {
  const rotation = useSharedValue(0);
  const { theme } = useTheme();

  useEffect(() => {
    rotation.value = withDelay(delay, withRepeat(
      withTiming(direction === 'cw' ? 360 : -360, {
        duration,
        easing: Easing.linear
      }),
      -1,
      false
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  return (
    <View style={[
      styles.ringContainer,
      { width: size, height: size, borderRadius: size / 2 }
    ]}>
     
      <View style={[
        styles.ringBorder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.colors.border
        }
      ]} />

      <Animated.View style={[
        StyleSheet.absoluteFillObject,
        { justifyContent: 'center', alignItems: 'center' },
        animatedStyle
      ]}>
        {children}
      </Animated.View>
    </View>
  );
};

// Reusable Satellite Icon (The orbiting elements)
const Satellite = ({ icon, color, offset, iconSize = 24 }: { icon: any; color: string; offset: number, iconSize?: number }) => {
  return (
    <View style={[styles.satellite, { transform: [{ translateY: -offset }] }]}>
      <View style={[styles.satelliteInner, { backgroundColor: color }]}>
        <Ionicons name={icon} size={iconSize} color="white" />
      </View>
    </View>
  );
};

// Center Pulse Core
const PulseCore = ({ icon, color }: { icon: any; color: string }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[styles.core, { backgroundColor: color }, style]}>
      <Ionicons name={icon} size={40} color="white" />
    </Animated.View>
  );
};

export default function BookingSearchScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const { bookingId } = route.params;
  const { upsertBooking, updateStatus, bookings } = useBooking();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [searchMessage, setSearchMessage] = useState("Scanning nearby area...");




  /* 🔁 FETCH BOOKING */
  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        const res = await api.get(`/booking/${bookingId}`);
        if (res.data?.booking) {
          const mapped = mapBookingToBookingItem(res.data.booking);
          upsertBooking(mapped);
        }
      } catch {
        console.log("Waiting for booking to be assigned...");
      }
    };

    fetchBooking();
  }, [bookingId]);


  useEffect(() => {
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) return;

    if (booking.status === "otp") {
      navigation.replace("BookingDetails", { bookingId });
    }

  }, [bookings]);

  /* 🔌 SOCKET */
  useEffect(() => {
    // const onAccepted = ({ booking, otp }: any) => {
    //   const mapped = mapBookingToBookingItem(booking, otp);


    //   console.log("📦 ----Booking stored in context:", booking, otp);
    //   upsertBooking(mapped);

    //   //socket.on("servicer-accepted", onAccepted);
    //   navigation.replace("BookingDetails", {
    //     bookingId: booking._id,
    //   });
    // };

    const onNoProvider = () => {
      Alert.alert("No technicians available");
      //navigation.goBack();
    };

    //socket.on("servicer-accepted", onAccepted);
    socket.on("no-servicer-available", onNoProvider);

    return () => {
      //socket.off("servicer-accepted", onAccepted);
      socket.off("no-servicer-available", onNoProvider);
    };
  }, []);

  // useEffect(() => {
  //   const onTeamAssigned = (booking: any) => {
  //     console.log("🟢 TEAM ASSIGNED TO USER:", booking);
  //
  //     const mapped = mapBookingToBookingItem(booking);
  //     upsertBooking(mapped);
  //
  //     navigation.replace("BookingDetails", {
  //       bookingId: booking._id,
  //     });
  //   };
  //
  //   const onNoTeamAvailable = () => {
  //     Alert.alert("No teams available");
  //     navigation.goBack();
  //   };
  //
  //   socket.on("team-assigned", onTeamAssigned);
  //   socket.on("no-team-available", onNoTeamAvailable);
  //
  //   return () => {
  //     socket.off("team-assigned", onTeamAssigned);
  //     socket.off("no-team-available", onNoTeamAvailable);
  //   };
  // }, []);

  useEffect(() => {
    const onOtpGenerated = ({ bookingId, otp }: any) => {
      console.log("🟢 OTP RECEIVED:", bookingId, otp);

      // Only update status & OTP — don't overwrite existing booking data
      // (serviceCategoryName, address, name, etc. from servicer-accepted)
      updateStatus(bookingId, "otp");
      upsertBooking({
        _id: bookingId,
        serviceCategoryName: bookings.find(b => b._id === bookingId)?.serviceCategoryName || "",
        address: bookings.find(b => b._id === bookingId)?.address || "",
        status: "otp",
        otp: String(otp),
      });

      navigation.replace("BookingDetails", { bookingId });
    };

    socket.on("otp-generated", onOtpGenerated);

    return () => {
      socket.off("otp-generated", onOtpGenerated);
    };
  }, []);



  /* ⏳ ANIMATION */
  useEffect(() => {
    const messages = [
      "Scanning nearby area...",
      "Locating best experts...",
      "Checking availability...",
      "Matching your requirements..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setSearchMessage(messages[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
       <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 12 }]}
        onPress={() => navigation.navigate("BookingsMain")}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.orbitContainer}>
        {/* Outer Ring - Slow */}
        <OrbitRing size={width * 0.85} duration={15000} direction="ccw">
          <Satellite icon="build" color="#8B5CF6" offset={width * 0.425} />
          <Satellite icon="color-palette" color="#EC4899" offset={-(width * 0.425)} />
        </OrbitRing>

        {/* Middle Ring - Medium */}
        <OrbitRing size={width * 0.6} duration={10000} direction="cw" delay={1000}>
          <Satellite icon="construct" color="#F59E0B" offset={width * 0.3} />
        </OrbitRing>

        {/* Inner Ring - Fast */}
        <OrbitRing size={width * 0.35} duration={6000} direction="ccw" delay={2000}>
          <Satellite icon="flash" color="#10B981" offset={width * 0.175} iconSize={18} />
          <Satellite icon="water" color="#3B82F6" offset={-(width * 0.175)} iconSize={18} />
        </OrbitRing>

        {/* Core */}
        <PulseCore icon="search" color={theme.colors.primary} />
      </View>

      <View style={styles.textContainer}>
        <AppText weight="bold" size="h2" style={{ textAlign: 'center', marginBottom: 8, color: theme.colors.text }}>
          {searchMessage}
        </AppText>
        <AppText color="textMuted" style={{ textAlign: 'center' }}>
          Please wait while we connect you to GigiMan network
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: 'hidden',
  },
  orbitContainer: {
    width: width,
    height: width,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBorder: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.2, // Subtle rings
    borderStyle: 'dashed',
  },
  satellite: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  satelliteInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  core: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  textContainer: {
    marginTop: 60,
    paddingHorizontal: 30,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
