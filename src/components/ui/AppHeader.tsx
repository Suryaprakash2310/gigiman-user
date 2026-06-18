import { useTheme } from "@/src/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import AppText from "./AppText";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  style?: StyleProp<ViewStyle>;
  showShadow?: boolean;
}

export default function AppHeader({
  title,
  showBack = true,
  onBackPress,
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
            onPress={onBackPress || (() => navigation.goBack())}
            style={[
              styles.iconBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={theme.colors.text}
              style={{ marginRight: 2 }}
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
            style={[
              styles.iconBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons name={rightIcon as any} size={20} color={theme.colors.text} />
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },

  shadow: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});
