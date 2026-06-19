import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";

import AppButton from "@/src/components/ui/AppButton";
import AppHeader from "@/src/components/ui/AppHeader";
import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import { getCurrentLocation } from "@/src/utils/location";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function MapPinLocationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const debounceRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const mapContainerId = "leaflet-map-container";

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState<string>("");

  const initLocation = async () => {
    try {
      if (route.params?.latitude && route.params?.longitude) {
        const regionData: Region = {
          latitude: route.params.latitude,
          longitude: route.params.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(regionData);
        reverseGeocode(regionData.latitude, regionData.longitude);
      } else {
        const location = await getCurrentLocation();
        const regionData: Region = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(regionData);
        reverseGeocode(location.latitude, location.longitude);
      }
    } catch (error) {
      console.log("Location error:", error);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            limit: 1
          },
          headers: {
            "User-Agent": "gigi-user-app"
          }
        }
      );
      const place = res.data.features?.[0];
      if (place) {
        setAddress(place.place_name);
      }
    } catch (err) {
      console.log("Reverse geocode error", err);
    }
  };

  const onRegionChangeComplete = (regionData: Region) => {
    setRegion((prevRegion) => {
      if (!prevRegion) return regionData;
      const latDiff = Math.abs(regionData.latitude - prevRegion.latitude);
      const lngDiff = Math.abs(regionData.longitude - prevRegion.longitude);

      if (latDiff < 0.0001 && lngDiff < 0.0001) {
        return prevRegion;
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        reverseGeocode(regionData.latitude, regionData.longitude);
      }, 600);

      return regionData;
    });
  };

  const confirmLocation = () => {
    if (!region) return;
    navigation.navigate({
      name: "AddEditAddress",
      params: {
        selectedAddressFromMap: {
          line1: address,
          latitude: region.latitude,
          longitude: region.longitude
        }
      },
      merge: true
    });
  };

  useEffect(() => {
    initLocation();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadLeaflet = async () => {
      if ((window as any).L) {
        if (isMounted) setLeafletLoaded(true);
        return;
      }

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          if (isMounted) setLeafletLoaded(true);
        };
        script.onerror = () => {
          console.error("Failed to load Leaflet script");
        };
        document.head.appendChild(script);
      } else {
        const checkL = setInterval(() => {
          if ((window as any).L) {
            clearInterval(checkL);
            if (isMounted) setLeafletLoaded(true);
          }
        }, 100);
      }
    };

    loadLeaflet();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !region || mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const timer = setTimeout(() => {
      const container = document.getElementById(mapContainerId);
      if (!container) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(container, {
        zoomControl: false,
      }).setView([region.latitude, region.longitude], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      mapRef.current = map;

      map.on("moveend", () => {
        const center = map.getCenter();
        const newRegion: Region = {
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        onRegionChangeComplete(newRegion);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, region === null]);

  if (!region || !leafletLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <AppText style={{ marginTop: 10 }}>Loading map...</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Select Location" showBack={true} onBackPress={() => navigation.goBack()} />

      <View
        nativeID={mapContainerId}
        style={styles.map}
      />

      <View pointerEvents="none" style={styles.pinContainer}>
        <AppText style={styles.pin}>📍</AppText>
      </View>

      <View style={styles.addressBox}>
        <AppText numberOfLines={2}>{address || "Fetching address..."}</AppText>
      </View>

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
      position: "relative"
    },
    map: {
      flex: 1,
      width: "100%",
      height: "100%"
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    pinContainer: {
      position: "absolute",
      top: "50%",
      left: "50%",
      marginLeft: -12,
      marginTop: -24,
      zIndex: 1000
    },
    pin: {
      fontSize: 28
    },
    addressBox: {
      position: "absolute",
      top: 100,
      left: 16,
      right: 16,
      padding: 12,
      borderRadius: 10,
      backgroundColor: "white",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      zIndex: 1000
    },
    bottom: {
      position: "absolute",
      bottom: 30,
      left: 16,
      right: 16,
      zIndex: 1000
    }
  });
