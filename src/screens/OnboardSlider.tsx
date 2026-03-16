import React, { useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import AppText from "@/src/components/ui/AppText";
import OnboardingCard from "@/src/components/OnboardCard";
const { width } = Dimensions.get("window");

let PagerView: any = null;

if (Platform.OS !== "web") {
  PagerView = require("react-native-pager-view").default;
}

const PAGES = [
  {
    title: "Find Trusted Services",
    subtitle:
      "Discover electricians, plumbers, cleaners and more — all verified.",
    image: require("../../assets/images/onboardImage.png"),
  },
  {
    title: "Book Instantly",
    subtitle:
      "Choose your service and schedule instantly in just a few taps.",
    image: require("../../assets/images/onboardImage.png"),
  },
  {
    title: "Track Your Service",
    subtitle:
      "Get live updates and know exactly when your service partner arrives.",
    image: require("../../assets/images/onboardImage.png"),
  },
];

export default function OnboardingFlow({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const pagerRef = useRef<any>(null);
  const [page, setPage] = useState(0);

  const styles = createStyles(theme, insets);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    navigation.replace("PhoneLogin");
  };

  const next = async () => {
    if (page < PAGES.length - 1) {
      pagerRef.current?.setPage(page + 1);
    } else {
      completeOnboarding();
    }
  };

  const renderPage = (item: any, index: number) => (
    <View key={index} style={styles.page}>
      <Image source={item.image} style={styles.image} />

      <OnboardingCard
        title={item.title}
        subtitle={item.subtitle}
        buttonLabel={index === PAGES.length - 1 ? "Get Started" : "Next"}
        onPress={next}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.gradient}
      >
        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skip}
          onPress={completeOnboarding}
        >
          <AppText style={{ color: "#fff" }}>Skip</AppText>
        </TouchableOpacity>

        {/* Logo */}
        <AppText size="h1" weight="bold" style={styles.logo}>
          GIGIMAN
        </AppText>

        {/* Pager */}
        {PagerView ? (
          <PagerView
            style={{ flex: 1 }}
            initialPage={0}
            ref={pagerRef}
            onPageSelected={(e: any) =>
              setPage(e.nativeEvent.position)
            }
          >
            {PAGES.map(renderPage)}
          </PagerView>
        ) : (
          <View style={{ flex: 1 }}>
            {renderPage(PAGES[page], page)}
          </View>
        )}

        {/* Pagination */}
        <View style={styles.pagination}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                page === i && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    gradient: {
      flex: 1,
      paddingTop: insets.top + 10,
    },

    skip: {
      position: "absolute",
      right: 20,
      top: insets.top + 10,
      zIndex: 10,
    },

    logo: {
      color: "#fff",
      textAlign: "center",
      marginBottom: 10,
      letterSpacing: 2,
    },

    page: {
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

    pagination: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 30,
      gap: 8,
    },

    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "rgba(255,255,255,0.4)",
    },

    activeDot: {
      width: 20,
      backgroundColor: "#fff",
    },
  });