import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

type PromoCardProps = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress?: () => void;
};

export default function OnboardingCard({
  title,
  subtitle,
  buttonLabel,
  onPress,
}: PromoCardProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      padding: 24,
      borderRadius: 26,
      gap: 14,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },

    heading: {
      fontSize: theme.typography.h2,
      fontWeight: "bold",
      color: theme.colors.text,
      textAlign: "center",
    },

    subtext: {
      fontSize: theme.typography.body,
      color: theme.colors.textMuted,
      textAlign: "center",
      lineHeight: 22,
    },

    button: {
      marginTop: 12,
      backgroundColor: theme.colors.button,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
    },

    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
  });

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>

      <Text style={styles.subtext}>{subtitle}</Text>

      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}