import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";

const { width } = Dimensions.get("window");

let PagerView: any = null;

if (Platform.OS !== "web") {
  PagerView = require("react-native-pager-view").default;
}

const PAGES = [
  {
    title: "Verified Cleaning Professionals",
    subtitle:
      "Trained, background-checked and committed to quality service.",
    image: require("../../assets/images/slider1.png"),
    icon: "shield-check-outline",
    sparkles: true,
  },
  {
    title: "Book Instantly",
    subtitle:
      "Schedule your cleaning service in just a few taps.",
    image: require("../../assets/images/slider2.png"),
    icon: "calendar-check-outline",
    sparkles: true,
  },
  {
    title: "Live Updates, Total Peace of Mind",
    subtitle:
      "Track your cleaner in real-time until the job is done.",
    image: require("../../assets/images/slider3.png"),
    icon: "map-marker-outline",
    sparkles: false,
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

  const renderPage = (item: any, index: number) => {
    return (
      <View key={index} style={styles.page}>
        {/* Top Image Section (Edge to Edge) */}
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} resizeMode="cover" />
        </View>

        {/* Wave Curve Divider */}
        <View style={styles.curveContainer}>
          <Svg
            height={50}
            width={width}
            viewBox={`0 0 ${width} 50`}
            preserveAspectRatio="none"
          >
            <Path
              d={`M0 0 C${width * 0.25} 35, ${width * 0.75} 35, ${width} 0 L${width} 50 L0 50 Z`}
              fill="#04392D"
            />
          </Svg>
        </View>

        {/* Bottom Content Card Panel */}
        <View style={styles.contentContainer}>
          {/* Badge */}
          <View style={styles.badgeContainer}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={36}
              color="#04392D"
            />
          </View>

          {/* Decorative Sparkles */}
          {item.sparkles && (
            <>
              <MaterialCommunityIcons
                name="creation"
                size={14}
                color="#A9C2BC"
                style={{
                  position: "absolute",
                  top: 15,
                  left: width / 2 - 65,
                }}
              />
              <MaterialCommunityIcons
                name="creation"
                size={18}
                color="#A9C2BC"
                style={{
                  position: "absolute",
                  top: 35,
                  left: width / 2 + 50,
                }}
              />
            </>
          )}

          {/* Spacer to push title below badge */}
          <View style={{ height: 45 }} />

          {/* Texts (Heading & Subtitle) */}
          <View style={styles.textContainer}>
            <AppText style={styles.title}>{item.title}</AppText>
            <AppText style={styles.subtitle}>{item.subtitle}</AppText>
          </View>

          {/* Footer containing dots and buttons */}
          <View style={styles.footerContainer}>
            {/* Pagination Dots */}
            <View style={styles.dotsRow}>
              {PAGES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    page === i ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            {/* Actions Button */}
            <TouchableOpacity
              style={
                index === PAGES.length - 1
                  ? styles.startedButton
                  : styles.nextButton
              }
              onPress={next}
              activeOpacity={0.8}
            >
              <AppText
                style={
                  index === PAGES.length - 1
                    ? styles.startedButtonText
                    : styles.nextButtonText
                }
              >
                {index === PAGES.length - 1 ? "Get Started" : "Next"}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {page < PAGES.length - 1 && (
        <TouchableOpacity
          style={styles.skip}
          onPress={completeOnboarding}
          activeOpacity={0.7}
        >
          <AppText style={styles.skipText}>Skip</AppText>
        </TouchableOpacity>
      )}

      {/* Pager */}
      {PagerView ? (
        <PagerView
          style={{ flex: 1 }}
          initialPage={0}
          ref={pagerRef}
          onPageSelected={(e: any) => setPage(e.nativeEvent.position)}
        >
          {PAGES.map(renderPage)}
        </PagerView>
      ) : (
        <View style={{ flex: 1 }}>{renderPage(PAGES[page], page)}</View>
      )}
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#04392D",
    },

    skip: {
      position: "absolute",
      right: 24,
      top: insets.top > 0 ? insets.top + 10 : 20,
      zIndex: 20,
      padding: 8,
    },

    skipText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      textShadowColor: "rgba(0, 0, 0, 0.4)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },

    page: {
      flex: 1,
      backgroundColor: "#04392D",
    },

    imageContainer: {
      flex: 1.25,
      width: "100%",
    },

    image: {
      width: "100%",
      height: "100%",
    },

    curveContainer: {
      width: "100%",
      height: 50,
      backgroundColor: "transparent",
      marginTop: -50,
      zIndex: 2,
    },

    contentContainer: {
      flex: 1,
      backgroundColor: "#04392D",
      paddingHorizontal: 24,
      justifyContent: "space-between",
      paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24,
      zIndex: 3,
    },

    badgeContainer: {
      position: "absolute",
      top: -36,
      alignSelf: "center",
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
      zIndex: 10,
    },

    textContainer: {
      alignItems: "center",
      paddingHorizontal: 12,
    },

    title: {
      color: "#FFFFFF",
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 12,
    },

    subtitle: {
      color: "#A9C2BC",
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
    },

    footerContainer: {
      width: "100%",
      alignItems: "center",
    },

    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },

    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },

    activeDot: {
      backgroundColor: "#10B981",
    },

    inactiveDot: {
      backgroundColor: "#1E4E42",
    },

    nextButton: {
      width: "100%",
      backgroundColor: "#FFFFFF",
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },

    nextButtonText: {
      color: "#04392D",
      fontWeight: "bold",
      fontSize: 16,
    },

    startedButton: {
      width: "100%",
      backgroundColor: "#10B981",
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },

    startedButtonText: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 16,
    },
  });