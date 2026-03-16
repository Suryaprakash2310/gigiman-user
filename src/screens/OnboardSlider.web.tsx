import React, { useState } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
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
          <Image source={item.image} style={styles.image} />

          <OnboardingCard
            title={item.title}
            subtitle={item.subtitle}
            buttonLabel={page === 2 ? "Get Started" : "Next"}
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