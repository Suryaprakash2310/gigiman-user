import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "./AppText";
import { useTheme } from "@/src/theme/useTheme";
import { useNavigation } from "@react-navigation/native";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  rightIcon?: string;
  onRightPress?: () => void;
  style?: StyleProp<ViewStyle>;
  showShadow?: boolean;
}

export default function AppHeader({
  title,
  showBack = true,
  rightIcon,
  onRightPress,
  style,
  showShadow = false,
}: AppHeaderProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: showShadow ? theme.colors.cardShadow : "transparent",
        },
        showShadow && styles.shadow,
        style,
      ]}
    >
      {/* LEFT AREA - BACK */}
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.iconBtn, { backgroundColor: theme.colors.background }]}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* TITLE */}
      <View style={styles.center}>
        {title && (
          <AppText weight="bold" size="h3" style={{ color: theme.colors.text }}>
            {title}
          </AppText>
        )}
      </View>

      {/* RIGHT ACTION */}
      <View style={styles.right}>
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightPress}
            style={[styles.iconBtn, { backgroundColor: theme.colors.background }]}
          >
            <Ionicons name={rightIcon as any} size={22} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  left: {
    width: 40,
    justifyContent: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
  },

  right: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  shadow: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});
