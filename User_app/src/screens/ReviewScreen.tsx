import { submitReviewApi } from "@/src/api/review.api";
import AppButton from "@/src/components/ui/AppButton";
import AppHeader from "@/src/components/ui/AppHeader";
import AppInput from "@/src/components/ui/AppInput";
import AppText from "@/src/components/ui/AppText";
import { useBooking } from "@/src/context/BookingContext";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

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
  const { getBookingById, refreshBookings, updateBookingItem } = useBooking();

  const { bookingId } = route.params || {};
  const booking = bookingId ? getBookingById(bookingId) : null;
  const insets = useSafeAreaInsets();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("BookingTab", {
        screen: "BookingsMain",
        params: { activeTab: "history" },
      });
    }
  };

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating before submitting.");
      return;
    }

    if (!bookingId) {
      Alert.alert("Error", "Missing booking ID for review.");
      return;
    }

    try {
      setLoading(true);

      await submitReviewApi({
        bookingId,
        rating,
        comment,
      });

      // Update local booking state immediately
      updateBookingItem(String(bookingId), {
        isReviewed: true,
        userRating: rating,
        userReview: comment,
      });

      Alert.alert("Thank you!", "Your feedback has been submitted successfully.");
      refreshBookings?.();

      navigation.navigate("BookingTab", {
        screen: "BookingsMain",
        params: { activeTab: "history" },
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
          paddingTop: insets.top,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <AppHeader
        title="Review Service"
        showBack={true}
        onBackPress={handleGoBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* BOOKING INFO CARD */}
        {booking && (
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.infoIconBox}>
              <Ionicons name="checkmark-done-circle" size={24} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" size="body" style={{ color: "#0F172A" }}>
                {booking.serviceCategoryName || "Home Service"}
              </AppText>
              {booking.name ? (
                <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
                  Serviced by {booking.name}
                </AppText>
              ) : null}
            </View>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.titleSection}>
          <AppText size="h2" weight="bold" style={styles.title}>
            How was your service?
          </AppText>
          <AppText
            size="small"
            style={[styles.subtitle, { color: theme.colors.textMuted }]}
          >
            Your feedback helps us maintain high quality standards
          </AppText>
        </View>

        {/* STAR RATING */}
        <View style={styles.ratingWrap}>
          <StarRating value={rating} onChange={setRating} size={38} />
          <AppText
            size="small"
            style={{ marginTop: 10, color: theme.colors.textMuted }}
          >
            {rating === 0
              ? "Tap a star to rate"
              : rating === 5
              ? "Excellent! ⭐⭐⭐⭐⭐"
              : rating === 4
              ? "Very Good! ⭐⭐⭐⭐"
              : rating === 3
              ? "Good ⭐⭐⭐"
              : rating === 2
              ? "Fair ⭐⭐"
              : "Poor ⭐"}
          </AppText>
        </View>

        {/* COMMENT */}
        <View style={styles.inputWrap}>
          <AppText weight="semibold" style={styles.label}>
            Additional comments (optional)
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

        {/* SKIP BUTTON */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleGoBack}
          disabled={loading}
          activeOpacity={0.7}
        >
          <AppText size="body" color="textMuted" weight="medium">
            Skip for now
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  ratingWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  inputWrap: {
    marginBottom: 28,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  button: {
    marginBottom: 12,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
});

