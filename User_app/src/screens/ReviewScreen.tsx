import { submitReviewApi } from "@/src/api/review.api";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import AppText from "@/src/components/ui/AppText";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import StarRating from "../components/ui/StarRating";

type RouteParams = {
  Review: {
    bookingId: string;
  };
};

export default function ReviewScreen() {
  const route = useRoute<RouteProp<RouteParams, "Review">>();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  const { bookingId } = route.params;
  const insets = useSafeAreaInsets();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    try {
      setLoading(true);

      await submitReviewApi({
        bookingId,
        rating,
        comment,
      });

      Alert.alert("Thank you!", "Your feedback helps us improve.");

      navigation.reset({
        index: 0,
        routes: [{ name: "HomeTab" }],
      });
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to submit review"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 16,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {/* HEADER */}
      <AppText size="h2" weight="bold" style={styles.title}>
        How was your service?
      </AppText>

      <AppText
        size="small"
        style={[styles.subtitle, { color: theme.colors.textMuted }]}
      >
        Your feedback helps us improve the experience
      </AppText>

      {/* STAR RATING */}
      <View style={styles.ratingWrap}>
        <StarRating value={rating} onChange={setRating} size={32} />
        <AppText
          size="small"
          style={{ marginTop: 8, color: theme.colors.textMuted }}
        >
          Tap a star to rate
        </AppText>
      </View>

      {/* COMMENT */}
      <View style={styles.inputWrap}>
        <AppText weight="semibold" style={styles.label}>
          Additional comments
        </AppText>

        <AppInput
          placeholder="What went well? What can be improved?"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          style={styles.input}
        />
      </View>

      {/* SUBMIT */}
      <AppButton
        title={loading ? "Submitting..." : "Submit Review"}
        onPress={submitReview}
        disabled={loading}
        style={styles.button}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  title: {
    marginBottom: 6,
  },

  subtitle: {
    marginBottom: 24,
  },

  ratingWrap: {
    alignItems: "center",
    marginBottom: 28,
  },

  inputWrap: {
    marginBottom: 32,
  },

  label: {
    marginBottom: 8,
  },

  input: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  button: {
    marginTop: "auto",
    marginBottom: 16,
  },
});

