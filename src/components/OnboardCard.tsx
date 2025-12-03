//import { useTheme } from "@/src/theme/useTheme";
import { useTheme } from '@/src/theme/useTheme';
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
//import { useTheme } from '../theme/useTheme';

type PromoCardProps = {
  title: string;
  subtitle: string;
  buttonLabel: string;
};

export default function OnboardingCard({ title, subtitle, buttonLabel }: PromoCardProps) {

  const { theme } = useTheme();

  const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background,
    padding: 20,
    borderRadius: 20,
    gap: theme.spacing.md,
    zIndex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  heading: {
    fontSize: theme.typography.h2,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  subtext: {
    fontSize: theme.typography.body,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 8,
    backgroundColor: theme.colors.button,
    padding: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: theme.typography.body,
  },
});
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>

      <Text style={styles.subtext}>{subtitle}</Text>

      <TouchableOpacity style={styles.ctaButton}>
        <Text style={styles.ctaText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}


