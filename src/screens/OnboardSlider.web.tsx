import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/src/theme/useTheme";
import AppText from "@/src/components/ui/AppText";
import OnboardingCard from "@/src/components/OnboardCard";
const { width } = Dimensions.get("window");

const PAGES = [
  {
    title: "Find Trusted Services",
    subtitle:
      "Discover electricians, plumbers, cleaners and more — all verified.",
    image: require("../../assets/images/onboard_booking.png"),
  },
  {
    title: "Book Instantly",
    subtitle:
      "Choose your service and schedule instantly in just a few taps.",
    image: require("../../assets/images/onboard_booking.png"),
  },
  {
    title: "Track Your Service",
    subtitle:
      "Get live updates and know exactly when your service partner arrives.",
    image: require("../../assets/images/onboard_booking.png"),
  },
];

const AnimatedOnboardImage = ({ source, isActive, style }: { source: any; isActive: boolean; style: any }) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Idle floating animation
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 10,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();

      return () => loop.stop();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
      floatAnim.setValue(0);
    }
  }, [isActive, source, floatAnim, opacityAnim, scaleAnim]);

  return (
    <Animated.Image
      source={source}
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: floatAnim },
          ],
        },
      ]}
    />
  );
};

export default function OnboardSlider({ navigation }: any) {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);

  const next = () => {
    if (page < PAGES.length - 1) {
      setPage(page + 1);
    } else {
      navigation.replace("PhoneLogin");
    }
  };

  const styles = createStyles(theme);

  const item = PAGES[page];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.gradient}
      >
        <AppText size="h1" weight="bold" style={styles.logo}>
          GIGIMAN
        </AppText>

        <View style={styles.page}>
          <AnimatedOnboardImage source={item.image} isActive={true} style={styles.image} />

          <OnboardingCard
            title={item.title}
            subtitle={item.subtitle}
            buttonLabel={page === PAGES.length - 1 ? "Get Started" : "Next"}
            onPress={next}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1, paddingTop: 60 },
    logo: { color: "#fff", textAlign: "center", marginBottom: 20 },
    page: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    image: {
      width: width * 0.75,
      height: width * 0.75,
      resizeMode: "contain",
    },
  });