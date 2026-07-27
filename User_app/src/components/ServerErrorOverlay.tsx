import React, { useState } from "react";
import { View, StyleSheet, Modal, Image, Linking, Alert } from "react-native";
import AppText from "./ui/AppText";
import AppButton from "./ui/AppButton";
import { useTheme } from "../theme/useTheme";
import api from "../api/client";

interface ServerErrorOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function ServerErrorOverlay({ visible, onDismiss }: ServerErrorOverlayProps) {
  const { theme } = useTheme();
  const [checking, setChecking] = useState(false);

  const handleTryAgain = async () => {
    try {
      setChecking(true);
      // Firing a fast lightweight request to verify backend is responding
      await api.get("/auth/services");
      
      // If it reaches here, the server is responding (no network error, no 5xx!)
      onDismiss();
    } catch (err: any) {
      // Check if it's a server down or network failure
      const isConnectionError =
        !err.response ||
        err.message === "Network Error" ||
        err.code === "ERR_NETWORK" ||
        err.response?.status >= 500;

      if (!isConnectionError) {
        // Server is reachable (responded with 401, 403, 404 etc.)
        onDismiss();
      } else {
        Alert.alert(
          "Connection Failed",
          "We still cannot reach the server. Please check your internet connection and try again.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setChecking(false);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@gigiman.in?subject=GigiMan App Support Inquiry").catch((err) => {
      console.warn("Failed to open email client:", err);
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <Image
            source={require("../../assets/images/server_error.png")}
            style={styles.image}
            resizeMode="contain"
          />

          <AppText weight="bold" size="h1" style={[styles.title, { color: theme.colors.text }]}>
            Temporary Connection Issue
          </AppText>

          <AppText color="textMuted" style={styles.subtitle}>
            We're having trouble connecting to our servers. Please check your internet connection and try again, or contact our support team.
          </AppText>

          <View style={styles.buttonContainer}>
            <AppButton
              title="Try Again"
              onPress={handleTryAgain}
              loading={checking}
              disabled={checking}
              style={styles.button}
            />
            <AppButton
              title="Contact Support"
              onPress={handleContactSupport}
              variant="outline"
              disabled={checking}
              style={{ ...styles.button, marginTop: 12 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
  },
  image: {
    width: 240,
    height: 240,
    marginBottom: 32,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 22,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    width: "100%",
  },
});
