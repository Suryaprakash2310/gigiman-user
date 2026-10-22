// src/utils/location.ts
import * as Location from "expo-location";
import { Platform } from "react-native";

export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number }> => {
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
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      }
    );
  }

  // 📱 MOBILE (Android / iOS)
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission denied. Please allow location access in settings.");
  }

  // 🚨 Check if GPS is ON
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      // Prompt or attempt fallback
      console.warn("Location services disabled");
    }
  } catch (e) {
    console.warn("Error checking location services:", e);
  }

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    if (location?.coords) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }
  } catch (err) {
    console.warn("getCurrentPositionAsync failed, trying last known position:", err);
    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown?.coords) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
    }
    throw new Error("Unable to fetch GPS location. Please check your GPS settings.");
  }

  throw new Error("Unable to fetch location");
};

export const getAddressFromCoords = async (latitude: number, longitude: number): Promise<string> => {
  // 1. Try Native Reverse Geocoding (iOS / Android)
  if (Platform.OS !== "web") {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const res = results[0];
        const parts: string[] = [];

        if (res.name && res.name !== res.street) parts.push(res.name);
        if (res.street) parts.push(res.street);
        if (res.district && !parts.includes(res.district)) parts.push(res.district);
        if (res.city && !parts.includes(res.city)) parts.push(res.city);
        if (res.region && !parts.includes(res.region)) parts.push(res.region);
        if (res.postalCode) parts.push(res.postalCode);

        const joined = parts.filter(Boolean).join(", ").trim();
        if (joined.length > 3) {
          return joined;
        }
      }
    } catch (nativeErr) {
      console.warn("Native reverse geocoding error, falling back to OSM Nominatim:", nativeErr);
    }
  }

  // 2. Network Reverse Geocoding Fallback via OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "GigiManUserApp/1.0",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    const data = await response.json();
    if (data?.display_name) {
      const addr = data.address;
      if (addr) {
        const parts = [
          addr.road || addr.street || addr.neighbourhood || addr.suburb,
          addr.suburb || addr.city_district || addr.district,
          addr.city || addr.town || addr.village || addr.county,
          addr.state,
          addr.postcode,
        ].filter(Boolean);

        // Remove adjacent duplicates
        const uniqueParts = parts.filter((item, index) => parts.indexOf(item) === index);
        if (uniqueParts.length > 0) {
          return uniqueParts.join(", ");
        }
      }
      return data.display_name;
    }
  } catch (err) {
    console.error("OSM Reverse geocoding failed:", err);
  }

  // 3. Last fallback
  return `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
};
