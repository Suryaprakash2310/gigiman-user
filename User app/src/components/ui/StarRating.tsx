import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/useTheme";
import { wp } from "@/src/utils/responsive";

type Props = {
  value?: number;              // e.g. 4.5
  onChange?: (val: number) => void;
  maxStars?: number;
  size?: number;
  editable?: boolean;
  style?: ViewStyle;
};

const StarRating: React.FC<Props> = ({
  value = 0,
  onChange,
  maxStars = 5,
  size,
  editable = true,
  style,
}) => {
  const { theme } = useTheme();
  const starSize = size ?? wp(5.5);

  const renderStar = (index: number) => {
    const rating = value;
    const starValue = index + 1;

    let iconName: any = "star-outline";

    if (rating >= starValue) {
      iconName = "star";
    } else if (rating >= starValue - 0.5) {
      iconName = "star-half";
    }

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={editable ? 0.7 : 1}
        disabled={!editable}
        onPress={() => editable && onChange?.(starValue)}
        style={styles.touch}
        accessibilityRole={editable ? "button" : "image"}
        accessibilityLabel={`${starValue} star`}
      >
        <Ionicons
          name={iconName}
          size={starSize}
          color={
            iconName === "star-outline"
              ? theme.colors.border
              : "#FFB300"
          }
          style={styles.star}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: maxStars }).map((_, i) =>
        renderStar(i)
      )}
    </View>
  );
};

export default StarRating;


const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  touch: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  star: {
    textShadowColor: "rgba(0,0,0,0.12)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
