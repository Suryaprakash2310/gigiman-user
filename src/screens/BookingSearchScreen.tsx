import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
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
import { BookingParamList } from "../navigation/stacks/BookingStack";

type Route = RouteProp<BookingParamList, "Searching">;

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;

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
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [searchMessage, setSearchMessage] = useState("Scanning area...");

  // Cycling messages
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
  }
});
