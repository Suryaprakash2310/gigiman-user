import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/src/theme/useTheme";
import AppText from "@/src/components/ui/AppText";
import { getStatusBadgeConfig, isComingSoon } from "@/src/utils/serviceStatus";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Card width calculation (2 columns)
const CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - 12) / 2;

// Icon container size (responsive & capped)
const ICON_SIZE = Math.min(CARD_WIDTH * 0.62, 120);

type Props = {
  category: {
    id: string;
    label: string;
    image: string; // base64 from backend
    status?: string;
  };
  index: number;
};

const ServiceCard: React.FC<Props> = ({ category, index }) => {
  const { theme } = useTheme();
  const s = categoryCardStyles(theme);
  const navigation = useNavigation<any>();

  const badgeConfig = getStatusBadgeConfig(category.status);
  const comingSoon = isComingSoon(category.status);

  const handlePress = () => {
    if (comingSoon) {
      Alert.alert("Coming Soon", "This service is coming soon and cannot be booked yet.");
      return;
    }
    navigation.navigate("ServiceTab", {
      serviceId: category.id,
      categoryName: category.label,
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60 + 200).springify()}
      style={{ width: CARD_WIDTH }}
    >
      <TouchableOpacity
        activeOpacity={comingSoon ? 0.9 : 0.88}
        onPress={handlePress}
      >
        <View style={s.card}>
          {badgeConfig && (
            <View
              style={[
                s.badge,
                {
                  backgroundColor: badgeConfig.bgColor,
                  borderColor: badgeConfig.borderColor,
                },
              ]}
            >
              <AppText
                weight="bold"
                style={[s.badgeText, { color: badgeConfig.textColor }]}
              >
                {badgeConfig.label}
              </AppText>
            </View>
          )}

          {/* IMAGE CONTAINER */}
          <View style={s.imageContainer}>
            <Image
              source={{ uri: category.image }}
              style={s.image}
              resizeMode="contain"
            />
          </View>

          {/* LABEL */}
          <AppText weight="semibold" style={s.label} numberOfLines={2}>
            {category.label}
          </AppText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ServiceCard;
const categoryCardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: "100%",
      paddingVertical: 18,
      paddingHorizontal: 14,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,

      // iOS shadow
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,

      // Android shadow
      elevation: 5,

      alignItems: "center",
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.colors.border,
      position: "relative",
    },

    badge: {
      position: "absolute",
      top: 8,
      right: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      zIndex: 2,
    },

    badgeText: {
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: 0.2,
    },

    imageContainer: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: ICON_SIZE / 2.6,
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,

      overflow: "hidden", // 🔥 CRITICAL LINE
    },

    image: {
      width: "100%",
      height: "100%",
    },

    label: {
      fontSize: 15,
      textAlign: "center",
      color: theme.colors.text,
    },
  });
