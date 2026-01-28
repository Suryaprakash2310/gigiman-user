import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { wp } from "@/src/utils/responsive";

type Props = {
  value: number;
  onChange?: (val: number) => void;
  maxStars?: number;
  size?: number;
  editable?: boolean;
  style?: ViewStyle | any;
};

const StarRating: React.FC<Props> = ({
  value = 0,
  onChange,
  maxStars = 5,
  size,
  editable = true,
  style,
}) => {
  const starSize = size ?? wp(8);
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <View style={[styles.container, style]}>
      {stars.map((s) => {
        const filled = s <= Math.round(value);

        return (
          <TouchableOpacity
            key={s}
            onPress={() => editable && onChange && onChange(s)}
            activeOpacity={0.7}
            accessibilityRole={editable ? "button" : "image"}
            accessibilityLabel={`${s} star${s > 1 ? "s" : ""}`}
            style={styles.touch}
            disabled={!editable}
          >
            <Text
              style={[
                styles.star,
                { fontSize: starSize, color: filled ? "#FFB300" : "#E0E0E0" },
              ]}
            >
              {filled ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  touch: {
    marginHorizontal: 6,
  },
  star: {
    textShadowColor: "rgba(0,0,0,0.08)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

export default StarRating;
