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
      <Text style={[checkStyles.tick, { color }]}>✓</Text>
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
  tick: { fontSize: 16, fontWeight: "700" },
});

// ─── LocationStatusRow ────────────────────────────────────────────────────────
function LocationStatusRow({
  status,
  theme,
}: {
  status: LocationStatus;
  theme: any;
}) {
  const map: Record<
    LocationStatus,
    { icon: string; label: string; color: string }
  > = {
    idle: { icon: "📍", label: "Waiting...", color: theme.colors.textMuted },
    detecting: {
      icon: "📡",
      label: "Detecting location...",
      color: theme.colors.primary,
    },
    success: {
      icon: "✅",
      label: "Location Verified",
      color: theme.colors.success,
    },
    error: {
      icon: "⚠️",
      label: "Unable to detect",
      color: theme.colors.danger,
    },
    "permission-denied": {
      icon: "🚫",
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
          <Text style={{ fontSize: 13 }}>{map[status].icon}</Text>
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
    marginBottom: 16,
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
  label: { fontSize: 14, fontWeight: "600" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CompleteProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, login } = useAuthContext();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [nameFocused, setNameFocused] = useState(false);
  const [nameError, setNameError] = useState("");

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
      });

      // ✅ Preserve exact auth logic — RootNavigator auto-switches
      await login({
        user: {
          ...res.data.user,
          profileCompleted: true,
          isVerified: true,
        },
        accessToken: res.data.token,
        refreshToken: res.data.token,
      });
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

  const PRIMARY = theme.colors.primary;
  const SUCCESS = theme.colors.success;
  const DANGER = theme.colors.danger;
  const isDark = theme.dark;

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          {
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={[s.logoWrap, { backgroundColor: `${PRIMARY}18` }]}>
            <Text style={s.logoEmoji}>👤</Text>
          </View>
          <Text style={[s.title, { color: theme.colors.text }]}>
            Complete Your Profile
          </Text>
          <Text style={[s.subtitle, { color: theme.colors.textMuted }]}>
            Just one more step before you start using Gigiman.
          </Text>
        </View>

        {/* ── Card 1 – Full Name ── */}
        <View
          style={[
            s.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: nameError
                ? DANGER
                : nameFocused
                  ? PRIMARY
                  : theme.colors.border,
              borderWidth: nameFocused || !!nameError ? 1.5 : 1,
            },
          ]}
        >
          <Text style={[s.cardLabel, { color: theme.colors.textMuted }]}>
            Full Name
          </Text>
          <View style={s.inputRow}>
            <View
              style={[
                s.inputIcon,
                {
                  backgroundColor: nameFocused
                    ? `${PRIMARY}15`
                    : isDark
                      ? "#ffffff0d"
                      : "#00000009",
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>👤</Text>
            </View>
            <TextInput
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (t.trim()) setNameError("");
              }}
              placeholder="Enter your full name"
              placeholderTextColor={theme.colors.textMuted}
              onFocus={() => setNameFocused(true)}
              onBlur={() => {
                setNameFocused(false);
                if (!fullName.trim())
                  setNameError("Please enter your full name.");
              }}
              style={[s.textInput, { color: theme.colors.text }]}
              returnKeyType="done"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          {!!nameError && (
            <Text style={[s.inlineError, { color: DANGER }]}>{nameError}</Text>
          )}
        </View>

        {/* ── Card 2 – Location ── */}
        <View
          style={[
            s.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor:
                locationStatus === "success"
                  ? SUCCESS
                  : locationStatus === "error" ||
                    locationStatus === "permission-denied"
                    ? DANGER
                    : locationStatus === "detecting"
                      ? PRIMARY
                      : theme.colors.border,
              borderWidth: locationStatus !== "idle" ? 1.5 : 1,
            },
          ]}
        >
          <Text style={[s.cardLabel, { color: theme.colors.textMuted }]}>
            Current Location
          </Text>

          <LocationStatusRow status={locationStatus} theme={theme} />

          {!!locationError && locationStatus !== "success" && (
            <Text
              style={[s.inlineError, { color: DANGER, marginBottom: 12 }]}
            >
              {locationError}
            </Text>
          )}

          {/* Retry / Re-detect button */}
          {locationStatus !== "detecting" && (
            <TouchableOpacity
              onPress={detectLocation}
              activeOpacity={0.75}
              style={[
                s.retryBtn,
                {
                  borderColor:
                    locationStatus === "success" ? SUCCESS : PRIMARY,
                  backgroundColor:
                    locationStatus === "success"
                      ? `${SUCCESS}0f`
                      : `${PRIMARY}12`,
                },
              ]}
            >
              <Text
                style={[
                  s.retryBtnText,
                  {
                    color:
                      locationStatus === "success" ? SUCCESS : PRIMARY,
                  },
                ]}
              >
                {locationStatus === "success"
                  ? "📡 Re-detect Location"
                  : "🔄 Retry Location"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Card 3 – Info ── */}
        <View
          style={[
            s.infoBox,
            {
              backgroundColor: isDark ? "#ffffff08" : "#00000006",
              borderColor: isDark ? "#ffffff15" : "#00000010",
            },
          ]}
        >
          <Text style={{ fontSize: 16, marginTop: 1 }}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.infoText, { color: theme.colors.textMuted }]}>
              Your location helps us find nearby service professionals faster.
            </Text>
            <Text
              style={[
                s.infoText,
                { color: theme.colors.textMuted, marginTop: 4 },
              ]}
            >
              Your precise location is never shared publicly.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Pinned Continue Button ── */}
      <View
        style={[
          s.bottomBar,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canContinue}
          activeOpacity={0.85}
          style={[
            s.continueBtn,
            {
              backgroundColor: canContinue ? PRIMARY : theme.colors.border,
              shadowColor: canContinue ? PRIMARY : "transparent",
            },
          ]}
        >
          {submitting ? (
            <View style={s.btnContent}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.continueBtnText}>Saving...</Text>
            </View>
          ) : (
            <Text
              style={[
                s.continueBtnText,
                {
                  color: canContinue ? "#fff" : theme.colors.textMuted,
                },
              ]}
            >
              Continue
            </Text>
          )}
        </TouchableOpacity>

        {!canContinue && !submitting && (
          <Text style={[s.disabledHint, { color: theme.colors.textMuted }]}>
            {!fullName.trim() && locationStatus !== "success"
              ? "Enter your name and allow location to continue"
              : !fullName.trim()
                ? "Enter your full name to continue"
                : "Waiting for location verification…"}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: { alignItems: "flex-start", marginBottom: 28 },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 30 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    //textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },

  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 6,
  },

  inlineError: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },

  retryBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  retryBtnText: { fontSize: 14, fontWeight: "600" },

  infoBox: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  infoText: { fontSize: 13, lineHeight: 19 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 12,
  },
  continueBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  disabledHint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
