// src/utils/location.ts
import * as Location from "expo-location";
import { Platform } from "react-native";

export const getCurrentLocation = async () => {
  // 🌐 WEB fallback
  if (Platform.OS === "web") {
    return new Promise<{ latitude: number; longitude: number }>(
      (resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          (err) => {
            reject(new Error("Location access denied in browser"));
          },
          { enableHighAccuracy: true }
        );
      }
    );
  }

  // 📱 MOBILE (Android / iOS)
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  // 🚨 Check if GPS is ON
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error("Please turn ON location services");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  if (!location?.coords) {
    throw new Error("Unable to fetch location");
  }

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};

export const getAddressFromCoords = async (latitude: number, longitude: number): Promise<string> => {
  try {
    if (Platform.OS === "web") {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      return data.display_name || "Current Location";
    }
    const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (result) {
      const parts = [
        result.name,
        result.street,
        result.district,
        result.city,
        result.region,
        result.postalCode,
        result.country,
      ].filter(Boolean);
      return parts.join(", ");
    }
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
  }
  return "Current Location";
};
