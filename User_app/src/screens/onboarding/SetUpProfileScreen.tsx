import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import { useAuthContext } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme/useTheme";
import { getCurrentLocation } from "@/src/utils/location";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { completeProfileAPI } from "@/src/api/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export default function CompleteProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme);
  const { user, setUser } = useAuthContext();
  const { accessToken, refreshToken, login } = useAuthContext();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const detectLocation = async () => {
    try {
      setLocLoading(true);
      const location = await getCurrentLocation();
      setCoords(location);
      Alert.alert("Location detected");
    } catch (err: any) {
      Alert.alert("Location Error", err.message);
    } finally {
      setLocLoading(false);
    }
  };

  const submitProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    try {
      setLoading(true);

      const res = await completeProfileAPI({
        fullName,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      await login({
        user: res.data.user,
        accessToken: res.data.token,
        refreshToken: res.data.token,
      });


      // ❌ No navigation here
      // RootNavigator will switch automatically

    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Profile update failed"
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppText size="h2" weight="bold">Complete Profile</AppText>

      <AppText weight="semibold">Full Name</AppText>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        placeholder="Your full name"
      />

      <AppButton
        title={locLoading ? "Detecting location..." : "Use Current Location"}
        onPress={detectLocation}
        disabled={locLoading}
        style={{ marginTop: 20 }}
      />

      {coords && (
        <AppText color="textMuted" style={{ marginTop: 8 }}>
          Location captured ✔
        </AppText>
      )}

      <AppButton
        title={loading ? "Saving..." : "Continue"}
        onPress={submitProfile}
        disabled={loading}
        style={{ marginTop: 30 }}
      />

      {(loading || locLoading) && (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={{ marginTop: 12 }}
        />
      )}
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    input: {
      borderWidth: 1.2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    },
  });
