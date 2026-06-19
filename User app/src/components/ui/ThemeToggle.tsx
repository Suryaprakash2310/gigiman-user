import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import AppText from "./AppText";
import { useTheme } from "@/src/theme/useTheme";

const OPTIONS = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export default function ThemeToggle() {
  const { theme, mode, setMode } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {OPTIONS.map((item) => {
        const active = mode === item.value;

        return (
          <TouchableOpacity
            key={item.value}
            activeOpacity={0.8}
            style={[
              styles.option,
              active && styles.activeOption
            ]}
            onPress={() => setMode(item.value as any)}
          >
            <AppText
              weight="semibold"
              style={[
                styles.text,
                active && styles.activeText
              ]}
            >
              {item.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    option: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
    },

    activeOption: {
      backgroundColor: theme.colors.primary,
    },

    text: {
      color: theme.colors.textMuted,
      fontSize: 14,
    },

    activeText: {
      color: "#fff",
    },
  });