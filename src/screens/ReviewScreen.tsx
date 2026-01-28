import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import AppText from "@/src/components/ui/AppText";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import { submitReviewApi } from "@/src/api/review.api";
import StarRating from "../components/ui/StarRating";

type RouteParams = {
  Review: {
    bookingId: string;
  };
};

export default function ReviewScreen() {
  const route = useRoute<RouteProp<RouteParams, "Review">>();
  const navigation = useNavigation<any>();

  const { bookingId } = route.params;

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

      Alert.alert("Thank you!", "Review submitted successfully");

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
    <View style={styles.container}>
      <AppText size="h2" weight="bold">
        Rate your experience
      </AppText>

      <StarRating value={rating} onChange={setRating} />

      <AppInput
        placeholder="Write a short review (optional)"
        value={comment}
        onChangeText={setComment}
        multiline
        style={{ marginTop: 16 }}
      />

      <AppButton
        title={loading ? "Submitting..." : "Submit Review"}
        onPress={submitReview}
        disabled={loading}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
});
