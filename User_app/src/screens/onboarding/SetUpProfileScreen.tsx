import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import type { AppTheme } from "@/src/theme";

import { useTheme } from "@/src/theme/useTheme";
import { useAuthContext } from "@/src/context/AuthContext";
import { completeProfileAPI } from "@/src/api/auth";

// ✅ No native-only libraries — expo-location + Linking works in Expo Go

// ─── Types ───────────────────────────────────────────────────────────────────
type LocationStatus =
  | "idle"
  | "detecting"
  | "success"
  | "error"
  | "permission-denied";

interface Coords {
  latitude: number;
  longitude: number;
}

// ─── SpinnerRing ─────────────────────────────────────────────────────────────
function SpinnerRing({ color }: { color: string }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        spinStyles.ring,
        { borderTopColor: color, transform: [{ rotate }] },
      ]}
    />
  );
}

const spinStyles = StyleSheet.create({
  ring: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: "transparent",
  },
});

// ─── SuccessCheck ─────────────────────────────────────────────────────────────
function SuccessCheck({ color }: { color: string }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={[
        checkStyles.circle,
        {
          backgroundColor: `${color}22`,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Ionicons name="checkmark" size={16} color={color} />
    </Animated.View>
  );
}

const checkStyles = StyleSheet.create({
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── LocationStatusRow ────────────────────────────────────────────────────────
function LocationStatusRow({
  status,
  theme,
}: {
  status: LocationStatus;
  theme: AppTheme;
}) {
  const map: Record<
    LocationStatus,
    { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }
  > = {
    idle: { icon: "location-outline", label: "Waiting...", color: theme.colors.textMuted },
    detecting: {
      icon: "locate-outline",
      label: "Detecting location...",
      color: theme.dark ? theme.colors.primaryDark : theme.colors.primary,
    },
    success: {
      icon: "checkmark",
      label: "Location Verified",
      color: theme.colors.primaryDark,
    },
    error: {
      icon: "alert-circle-outline",
      label: "Unable to detect",
      color: theme.colors.danger,
    },
    "permission-denied": {
      icon: "ban-outline",
      label: "Permission denied",
      color: theme.colors.danger,
    },
  };

  const { label, color } = map[status];

  return (
    <View style={locStyles.row}>
      {status === "detecting" ? (
        <View style={locStyles.spinWrap}>
          <SpinnerRing color={color} />
        </View>
      ) : status === "success" ? (
        <SuccessCheck color={color} />
      ) : (
        <View
          style={[locStyles.iconCircle, { backgroundColor: `${color}18` }]}
        >
          <Ionicons name={map[status].icon} size={16} color={color} />
        </View>
      )}
      <Text style={[locStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const locStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  spinWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flexShrink: 1, fontSize: 13, fontWeight: "600" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CompleteProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, login } = useAuthContext();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [nameFocused, setNameFocused] = useState(false);
  const [nameError, setNameError] = useState("");

  const [referralCode, setReferralCode] = useState("");
  const [referralCodeFocused, setReferralCodeFocused] = useState(false);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationError, setLocationError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const canContinue =
    fullName.trim().length > 0 &&
    locationStatus === "success" &&
    !submitting;

  // ── Location ─────────────────────────────────────────────────────────────
  const detectLocation = useCallback(async () => {
    setLocationStatus("detecting");
    setLocationError("");
    setCoords(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationStatus("permission-denied");
        setLocationError(
          "Location permission is required. Please allow it and retry."
        );
        return;
      }

      // Check if GPS/location services are on (works on both Android & iOS)
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationStatus("error");
        setLocationError(
          "Location services are off. Tap 'Open Settings' to enable them."
        );
        // Show a native alert offering to open device settings
        Alert.alert(
          "Location Services Off",
          "Please turn on Location Services so we can find nearby professionals for you.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (!loc?.coords) throw new Error("Unable to read coordinates.");

      setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocationStatus("success");
      setLocationError("");
    } catch (err: any) {
      setLocationStatus("error");
      setLocationError(
        err?.message || "Could not detect location. Please retry."
      );
    }
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    detectLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setNameError("Please enter your full name.");
      return;
    }
    if (locationStatus !== "success" || !coords) {
      setLocationError("Please enable your location to continue.");
      if (locationStatus === "idle" || locationStatus === "error") {
        detectLocation();
      }
      return;
    }

    try {
      setSubmitting(true);
      const res = await completeProfileAPI({
        fullName: fullName.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        referralCode: referralCode.trim() || undefined,
      });

  
      if (res.data.couponCode) {
        Alert.alert(
          "Referral Applied!",
          `Congratulations! You've received a 5% discount coupon for your first booking: ${res.data.couponCode}`,
          [
            {
              text: "OK",
              onPress: async () => {
                await login({
                  user: {
                    ...res.data.user,
                    profileCompleted: true,
                    isVerified: true,
                  },
                  accessToken: res.data.token,
                  refreshToken: res.data.token,
                });
              },
            },
          ]
        );
      } else {
        await login({
          user: {
            ...res.data.user,
            profileCompleted: true,
            isVerified: true,
          },
          accessToken: res.data.token,
          refreshToken: res.data.token,
        });
      }
    } catch (err: any) {
      Alert.alert(
        "Something went wrong",
        err.response?.data?.message ||
        "Profile update failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const primary = theme.colors.primary;
  const brandText = theme.dark ? theme.colors.primaryDark : primary;
  const { background, surface, border, text, textMuted, danger } = theme.colors;

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scroll,
          {
            paddingTop: insets.top + 16,
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.content}>
          <View style={s.header}>
            <View style={s.brandRow}>
              <View style={[s.profileIcon, { backgroundColor: primary }]}>
                <Ionicons name="person-outline" size={22} color="#fff" />
              </View>
              <Text style={[s.wordmark, { color: brandText }]}>GIGIMAN</Text>
            </View>
            <Text style={[s.title, { color: text }]}>Complete Your Profile</Text>
            <Text style={[s.subtitle, { color: textMuted }]}>
              Just one more step before you start using Gigiman.
            </Text>
          </View>

          <View style={s.field}>
            <Text style={[s.fieldLabel, { color: text }]}>Full Name</Text>
            <View
              style={[
                s.inputRow,
                {
                  backgroundColor: surface,
                  borderColor: nameError ? danger : nameFocused ? brandText : border,
                },
              ]}
            >
              <Ionicons name="person-outline" size={18} color={nameFocused ? brandText : textMuted} />
              <TextInput
                accessibilityLabel="Full Name"
                value={fullName}
                onChangeText={(t) => {
                  setFullName(t);
                  if (t.trim()) setNameError("");
                }}
                placeholder="Enter your full name"
                placeholderTextColor={textMuted}
                onFocus={() => setNameFocused(true)}
                onBlur={() => {
                  setNameFocused(false);
                  if (!fullName.trim())
                    setNameError("Please enter your full name.");
                }}
                style={[s.textInput, { color: text }]}
                returnKeyType="done"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {!!nameError && (
              <Text style={[s.inlineError, { color: danger }]}>{nameError}</Text>
            )}
          </View>

          <View style={[s.locationCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[s.fieldLabel, { color: text }]}>Current Location</Text>
            <LocationStatusRow status={locationStatus} theme={theme} />

            {!!locationError && locationStatus !== "success" && (
              <Text style={[s.inlineError, { color: danger }]}>{locationError}</Text>
            )}

            {locationStatus !== "detecting" && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={detectLocation}
                activeOpacity={0.75}
                style={[s.retryBtn, { borderColor: border, backgroundColor: background }]}
              >
                <Ionicons name="refresh-outline" size={16} color={brandText} />
                <Text style={[s.retryBtnText, { color: brandText }]}>
                  {locationStatus === "success" ? "Re-detect Location" : "Retry Location"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.field}>
            <Text style={[s.fieldLabel, { color: text }]}>
              Referral Code <Text style={{ color: textMuted, fontWeight: "400" }}>(Optional)</Text>
            </Text>
            <View
              style={[
                s.inputRow,
                { backgroundColor: surface, borderColor: referralCodeFocused ? brandText : border },
              ]}
            >
              <Ionicons name="pricetag-outline" size={18} color={referralCodeFocused ? brandText : textMuted} />
              <TextInput
                accessibilityLabel="Referral Code (Optional)"
                value={referralCode}
                onChangeText={(t) => setReferralCode(t)}
                placeholder="Enter referral code"
                placeholderTextColor={textMuted}
                onFocus={() => setReferralCodeFocused(true)}
                onBlur={() => setReferralCodeFocused(false)}
                style={[s.textInput, { color: text }]}
                returnKeyType="done"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={[s.infoBox, { backgroundColor: `${brandText}0D`, borderColor: border }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={brandText} />
            <View style={s.infoCopy}>
              <Text style={[s.infoText, { color: textMuted }]}>
                Your location helps us find nearby service professionals faster.
              </Text>
              <Text style={[s.infoText, { color: textMuted }]}>
                Your precise location is never shared publicly.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          s.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16,
            backgroundColor: surface,
            borderTopColor: border,
          },
        ]}
      >
        <View style={[s.content, s.footerContent]}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={!canContinue}
            activeOpacity={0.85}
            style={[
              s.continueBtn,
              { backgroundColor: canContinue || submitting ? primary : border },
            ]}
          >
            {submitting ? (
              <View style={s.btnContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[s.continueBtnText, { color: "#fff" }]}>Saving...</Text>
              </View>
            ) : (
              <Text style={[s.continueBtnText, { color: canContinue ? "#fff" : textMuted }]}>
                Continue
              </Text>
            )}
          </TouchableOpacity>

          {!canContinue && !submitting && (
            <Text style={[s.disabledHint, { color: textMuted }]}>
              {!fullName.trim() && locationStatus !== "success"
                ? "Enter your name and allow location to continue"
                : !fullName.trim()
                  ? "Enter your full name to continue"
                  : "Waiting for location verification…"}
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingBottom: 16 },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 16,
  },
  header: { gap: 6 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: { fontSize: 14, fontWeight: "800", letterSpacing: 1.5, flexShrink: 1 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    paddingVertical: 10,
  },
  locationCard: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inlineError: { fontSize: 13, fontWeight: "500" },
  retryBtn: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryBtnText: { flexShrink: 1, fontSize: 13, fontWeight: "600" },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  infoCopy: { flex: 1, gap: 4 },
  infoText: { fontSize: 13 },
  bottomBar: {
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerContent: { gap: 8 },
  continueBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  continueBtnText: { flexShrink: 1, fontSize: 16, fontWeight: "700", textAlign: "center" },
  disabledHint: { fontSize: 12, textAlign: "center" },
});
