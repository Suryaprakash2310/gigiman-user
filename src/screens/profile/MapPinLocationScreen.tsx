import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Region } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";

import AppHeader from "@/src/components/ui/AppHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import { getCurrentLocation } from "@/src/utils/location";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export default function MapPinLocationScreen() {

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<any>(null);

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

    if (!region) return;

    const latDiff = Math.abs(regionData.latitude - region.latitude);
    const lngDiff = Math.abs(regionData.longitude - region.longitude);

    if (latDiff < 0.0001 && lngDiff < 0.0001) {
      return;
    }

    setRegion(regionData);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      reverseGeocode(regionData.latitude, regionData.longitude);
    }, 600);
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

  if (!region) {

    return (
      <View style={styles.loadingContainer}>
        <AppText>Loading map...</AppText>
      </View>
    );

  }

  return (
    <View style={styles.container}>

      <AppHeader title="Select Location" showBack />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        initialRegion={region}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={(e) => {

          const { latitude, longitude } = e.nativeEvent.coordinate;

          const newRegion: Region = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          };

          setRegion(newRegion);
          reverseGeocode(latitude, longitude);

        }}
      />

      <View pointerEvents="none" style={styles.pinContainer}>
        <AppText style={styles.pin}>📍</AppText>
      </View>

      <View style={styles.addressBox}>
        <AppText numberOfLines={2}>{address}</AppText>
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
      flex: 1
    },

    map: {
      flex: 1
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
      marginTop: -24
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
      elevation: 3
    },

    bottom: {
      position: "absolute",
      bottom: 30,
      left: 16,
      right: 16
    }

  });