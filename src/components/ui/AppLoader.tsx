import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

type Props = {
  visible?: boolean;
  size?: number | "small" | "large";
  text?: string;
};

export default function AppLoader({ visible = true, size = "large", text }: Props) {
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={[styles.box, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size={size} color={theme.colors.primary} />
        {text ? <Text style={[styles.text, { color: theme.colors.text }]}>{text}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  box: {
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
  },
});
