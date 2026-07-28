import React, { useState } from "react";
import { ActivityIndicator, Image as RNImage, StyleSheet, View, ImageStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/src/config/env";

let ExpoImageComponent: any = null;
try {
  const expoImageModule = require("expo-image");
  ExpoImageComponent = expoImageModule.Image;
} catch (e) {
  ExpoImageComponent = null;
}

export const getImageUrl = (rawUri?: string | null): string | null => {
  if (!rawUri || typeof rawUri !== "string") return null;
  const trimmed = rawUri.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  if (trimmed.startsWith("/")) {
    return `${serverOrigin}${trimmed}`;
  }
  return `${serverOrigin}/${trimmed}`;
};

export const prefetchImages = async (urls: string[]) => {
  const validUrls = urls
    .map((url) => getImageUrl(url))
    .filter((url): url is string => Boolean(url));

  if (validUrls.length === 0) return;

  try {
    if (ExpoImageComponent && typeof ExpoImageComponent.prefetch === "function") {
      await ExpoImageComponent.prefetch(validUrls);
      return;
    }
  } catch (e) {
    // Fall back to RN Image prefetch
  }

  try {
    await Promise.all(validUrls.map((url) => RNImage.prefetch(url).catch(() => false)));
  } catch (e) {
    console.log("Error prefetching images:", e);
  }
};

interface OptimizedImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  transition?: number;
  placeholderText?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  contentFit = "contain",
  transition = 300,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const finalUrl = getImageUrl(uri);

  if (!finalUrl || error) {
    return (
      <View style={[styles.placeholderContainer, style]}>
        <Ionicons name="image-outline" size={24} color="#94A3B8" />
      </View>
    );
  }

  if (ExpoImageComponent) {
    return (
      <View style={[styles.imageWrapper, style]}>
        <ExpoImageComponent
          source={{ uri: finalUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit={contentFit}
          transition={transition}
          cachePolicy="disk"
          onLoad={() => setLoading(false)}
          onError={(err: any) => {
            console.log("[OptimizedImage] expo-image failed to load:", finalUrl, err?.error);
            setLoading(false);
            setError(true);
          }}
        />
        {loading && (
          <View style={[StyleSheet.absoluteFillObject, styles.loaderOverlay]}>
            <ActivityIndicator size="small" color="#2F6B63" />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.imageWrapper, style]}>
      <RNImage
        source={{ uri: finalUrl }}
        style={StyleSheet.absoluteFillObject}
        resizeMode={contentFit === "contain" ? "contain" : "cover"}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          console.log("[OptimizedImage] RNImage failed to load:", finalUrl, e.nativeEvent?.error);
          setLoading(false);
          setError(true);
        }}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, styles.loaderOverlay]}>
          <ActivityIndicator size="small" color="#2F6B63" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageWrapper: {
    position: "relative",
    overflow: "hidden",
  },
  loaderOverlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(243, 239, 255, 0.4)",
  },
  placeholderContainer: {
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
});

export default OptimizedImage;

