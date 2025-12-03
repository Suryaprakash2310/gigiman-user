import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/useTheme";

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme, mode } = useTheme();

  const isDark = mode === "dark"; // if you don’t have mode, this is still ok with any

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom || 8,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark
              ? "rgba(20,20,20,0.98)"
              : theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const iconName = {
            HomeTab: "home",
            ServiceTab: "grid",
            BookingTab: "receipt-outline",
            ProfileTab: "person-circle-outline",
          }[route.name];

          const label =
            route.name === "HomeTab"
              ? "Home"
              : route.name === "ServiceTab"
              ? "Services"
              : route.name === "BookingTab"
              ? "Bookings"
              : "Profile";

          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.85}
              style={styles.tabItem}
            >
              <Ionicons
                name={iconName as any}
                size={24}
                color={isFocused ? theme.colors.primary : theme.colors.textMuted}
                style={{
                  marginBottom: 2,
                  transform: [{ scale: isFocused ? 1.1 : 1 }],
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: isFocused
                    ? theme.colors.primary
                    : theme.colors.textMuted,
                  fontWeight: isFocused ? "600" : "400",
                }}
              >
                {label}
              </Text>

              {/* tiny dot indicator below label */}
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginTop: 4,
                  opacity: isFocused ? 1 : 0,
                  backgroundColor: theme.colors.primary,
                }}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // no absolute, we let React Navigation place it
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 4,
    borderRadius: 18,
    borderTopWidth: Platform.OS === "android" ? 0 : StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 8,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
});
