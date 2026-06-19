import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";

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

export default function OnboardSlider({ navigation }: any) {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isDesktop = windowWidth >= 600;

  // Responsive sizes inside the device mockup container or full screen
  const containerWidth = isDesktop ? 400 : windowWidth;
  const containerHeight = isDesktop ? Math.min(820, windowHeight - 40) : windowHeight;

  const next = () => {
    if (page < PAGES.length - 1) {
      setPage(page + 1);
    } else {
      navigation.replace("PhoneLogin");
    }
  };

  const skip = () => {
    navigation.replace("PhoneLogin");
  };

  const item = PAGES[page];
  const styles = createStyles(theme, isDesktop, containerWidth, containerHeight);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.deviceFrame}>
        {/* Skip Button */}
        {page < PAGES.length - 1 && (
          <TouchableOpacity style={styles.skip} onPress={skip} activeOpacity={0.7}>
            <AppText style={styles.skipText}>Skip</AppText>
          </TouchableOpacity>
        )}

        {/* Slide Page Content */}
        <View style={styles.page}>
          {/* Top Image Section (Edge to Edge) */}
          <View style={styles.imageContainer}>
            <Image source={item.image} style={styles.image} resizeMode="cover" />
          </View>

          {/* Wave Curve Divider */}
          <View style={styles.curveContainer}>
            <Svg
              height={50}
              width={containerWidth}
              viewBox={`0 0 ${containerWidth} 50`}
              preserveAspectRatio="none"
            >
              <Path
                d={`M0 0 C${containerWidth * 0.25} 35, ${containerWidth * 0.75} 35, ${containerWidth} 0 L${containerWidth} 50 L0 50 Z`}
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
                    left: containerWidth / 2 - 65,
                  }}
                />
                <MaterialCommunityIcons
                  name="creation"
                  size={18}
                  color="#A9C2BC"
                  style={{
                    position: "absolute",
                    top: 35,
                    left: containerWidth / 2 + 50,
                  }}
                />
              </>
            )}

            {/* Spacer to push title below badge */}
            <View style={{ height: 45 }} />

            {/* Texts */}
            <View style={styles.textContainer}>
              <AppText style={styles.title}>{item.title}</AppText>
              <AppText style={styles.subtitle}>{item.subtitle}</AppText>
            </View>

            {/* Footer with dots and button */}
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

              {/* Action Button */}
              <TouchableOpacity
                style={
                  page === PAGES.length - 1
                    ? styles.startedButton
                    : styles.nextButton
                }
                onPress={next}
                activeOpacity={0.8}
              >
                <AppText
                  style={
                    page === PAGES.length - 1
                      ? styles.startedButtonText
                      : styles.nextButtonText
                  }
                >
                  {page === PAGES.length - 1 ? "Get Started" : "Next"}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (
  theme: any,
  isDesktop: boolean,
  containerWidth: number,
  containerHeight: number
) =>
  StyleSheet.create({
    outerContainer: {
      flex: 1,
      backgroundColor: isDesktop ? "#011E16" : "#04392D",
      justifyContent: "center",
      alignItems: "center",
    },

    deviceFrame: {
      width: containerWidth,
      height: containerHeight,
      backgroundColor: "#04392D",
      borderRadius: isDesktop ? 24 : 0,
      overflow: "hidden",
      position: "relative",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },

    skip: {
      position: "absolute",
      right: 24,
      top: 24,
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
      paddingBottom: 32,
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