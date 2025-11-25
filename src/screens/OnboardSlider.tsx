import React from "react";
import { Image, StyleSheet, View } from "react-native";
import AppText from "../components/ui/AppText";
import OnboardingCard from "../components/ui/OnboardCard";
import { useTheme } from "../theme/useTheme";
export default function OnboardingScreen() {
  const { theme } = useTheme();
  const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    gap: 40, // more breathable modern spacing
    padding:20,
    paddingBottom:20
  },
  image: {
    width: "100%",
    height: '50%',
  },
});

  return (
    <View style={styles.container}>
      
      {/* Logo */}
      <View style={{marginTop:28}}>
        <AppText size="h1" weight='bold'>GIGIMAN</AppText>

      </View>
       

      {/* Onboarding Illustration */}
      <Image
        source={require("../../assets/images/onboardImage.png")} // replace with your image
        style={styles.image}
        resizeMode="contain"
      />

      {/* Card with text + CTA */}
      <OnboardingCard
        title="Instant Help, Right When You Need It."
        subtitle="Book trusted home service experts in seconds — fast, reliable, hassle-free."
        buttonLabel="Next"
      />
    </View>
  );
}

