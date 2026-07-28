import React, { useState } from "react";
import { ActivityIndicator, Image as RNImage, StyleSheet, View, ImageStyle, StyleProp } from "react-native";

let ExpoImageComponent: any = null;
try {
  const expoImageModule = require("expo-image");
  ExpoImageComponent = expoImageModule.Image;
} catch (e) {
  ExpoImageComponent = null;
}

export const prefetchImages = async (urls: string[]) => {
  const validUrls = urls.filter((url) => Boolean(url && typeof url === "string"));
  if (validUrls.length === 0) return;

  try {
    if (ExpoImageComponent && typeof ExpoImageComponent.prefetch === "function") {
      await ExpoImageComponent.prefetch(validUrls);
      return;
    }
  } catch (e) {
    // Fall back to RN Image prefetch
  }

  // Fallback to RN Image.prefetch
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
  placeholderText = "G",
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!uri || error) {
    return (
      <View style={[styles.placeholderContainer, style]}>
        <View style={styles.initialBadge}>
          <RNImage
            source={{ uri: "https://via.placeholder.com/150" }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </View>
    );
  }

  if (ExpoImageComponent) {
    return (
      <ExpoImageComponent
        source={{ uri }}
        style={style}
        contentFit={contentFit}
        transition={transition}
        cachePolicy="disk"
      />
    );
  }

  return (
    <View style={styles.imageWrapper}>
      <RNImage
        source={{ uri }}
        style={style}
        resizeMode={contentFit === "contain" ? "contain" : "cover"}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
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
  initialBadge: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default OptimizedImage;
