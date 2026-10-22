import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native";
import MapView, { Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

import AppButton from "@/src/components/ui/AppButton";
import AppHeader from "@/src/components/ui/AppHeader";
import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import { getCurrentLocation, getAddressFromCoords } from "@/src/utils/location";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export default function MapPinLocationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<any>(null);
  const selectedCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);
  const [locatingCurrent, setLocatingCurrent] = useState<boolean>(false);

  const initLocation = async () => {
    try {
      if (route.params?.latitude && route.params?.longitude) {
        const lat = Number(route.params.latitude);
        const lng = Number(route.params.longitude);
        const regionData: Region = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        selectedCoordsRef.current = { latitude: lat, longitude: lng };
        setInitialRegion(regionData);
        if (route.params?.address) {
          setAddress(route.params.address);
        } else {
          reverseGeocode(lat, lng);
        }
      } else {
        const location = await getCurrentLocation();
        const regionData: Region = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        selectedCoordsRef.current = { latitude: location.latitude, longitude: location.longitude };
        setInitialRegion(regionData);
        reverseGeocode(location.latitude, location.longitude);
      }
    } catch (error) {
      console.log("Location init error:", error);
      // Fallback default coordinates if location fails
      const fallbackLat = 10.805;
      const fallbackLng = 78.6856;
      selectedCoordsRef.current = { latitude: fallbackLat, longitude: fallbackLng };
      setInitialRegion({
        latitude: fallbackLat,
        longitude: fallbackLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      reverseGeocode(fallbackLat, fallbackLng);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setLoadingAddress(true);
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            limit: 1,
          },
          headers: {
            "User-Agent": "gigi-user-app",
          },
          timeout: 5000,
        }
      );

      const place = res.data?.features?.[0];
      if (place?.place_name) {
        setAddress(place.place_name);
      } else {
        const fallback = await getAddressFromCoords(lat, lng);
        setAddress(fallback);
      }
    } catch (err) {
      console.log("Mapbox reverse geocode error, using fallback:", err);
      try {
        const fallback = await getAddressFromCoords(lat, lng);
        setAddress(fallback);
      } catch (fallbackErr) {
        console.log("Fallback geocode error:", fallbackErr);
        setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } finally {
      setLoadingAddress(false);
    }
  };

  const onRegionChangeComplete = (regionData: Region) => {
    selectedCoordsRef.current = {
      latitude: regionData.latitude,
      longitude: regionData.longitude,
    };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      reverseGeocode(regionData.latitude, regionData.longitude);
    }, 500);
  };

  const handleLocateMe = async () => {
    try {
      setLocatingCurrent(true);
      const location = await getCurrentLocation();
      selectedCoordsRef.current = { latitude: location.latitude, longitude: location.longitude };

      const newRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      mapRef.current?.animateToRegion(newRegion, 600);
      reverseGeocode(location.latitude, location.longitude);
    } catch (err) {
      console.warn("Locate me error:", err);
    } finally {
      setLocatingCurrent(false);
    }
  };

  const confirmLocation = () => {
    const coords = selectedCoordsRef.current || initialRegion;
    if (!coords) return;

    navigation.navigate({
      name: "AddEditAddress",
      params: {
        selectedAddressFromMap: {
          line1: address || `Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      },
      merge: true,
    });
  };

  useEffect(() => {
    initLocation();
  }, []);

  if (!initialRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <AppText style={{ marginTop: 12 }}>Loading map...</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Select Location" showBack={true} onBackPress={() => navigation.goBack()} />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onRegionChangeComplete={onRegionChangeComplete}
      />

      {/* CENTER PIN */}
      <View pointerEvents="none" style={styles.pinContainer}>
        <Ionicons name="location" size={40} color="#DC2626" />
        <View style={styles.pinDot} />
      </View>

      {/* ADDRESS BOX AT TOP */}
      <View style={styles.addressBox}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="navigate-circle" size={20} color={theme.colors.primary} />
          <AppText weight="bold" size="small" style={{ color: theme.colors.primary }}>
            Selected Area
          </AppText>
        </View>
        <View style={{ marginTop: 4 }}>
          {loadingAddress ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 }}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText size="small" color="textMuted">Fetching address details...</AppText>
            </View>
          ) : (
            <AppText numberOfLines={2} weight="medium" style={styles.addressText}>
              {address || "Drag map to select location"}
            </AppText>
          )}
        </View>
      </View>

      {/* LOCATE ME FLOATING BUTTON */}
      <TouchableOpacity
        style={styles.locateMeBtn}
        onPress={handleLocateMe}
        disabled={locatingCurrent}
        activeOpacity={0.8}
      >
        {locatingCurrent ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Ionicons name="locate" size={24} color={theme.colors.primary} />
        )}
      </TouchableOpacity>

      {/* CONFIRM BUTTON */}
      <View style={styles.bottom}>
        <AppButton title="Confirm Location" onPress={confirmLocation} />
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },
    map: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F8FAFC",
    },
    pinContainer: {
      position: "absolute",
      top: "50%",
      left: "50%",
      marginLeft: -20,
      marginTop: -40,
      alignItems: "center",
      justifyContent: "center",
    },
    pinDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(0,0,0,0.3)",
      marginTop: -2,
    },
    addressBox: {
      position: "absolute",
      top: 90,
      left: 16,
      right: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: "white",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },
    addressText: {
      fontSize: 13,
      color: "#0F172A",
      lineHeight: 18,
    },
    locateMeBtn: {
      position: "absolute",
      bottom: 95,
      right: 16,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },
    bottom: {
      position: "absolute",
      bottom: 24,
      left: 16,
      right: 16,
    },
  });