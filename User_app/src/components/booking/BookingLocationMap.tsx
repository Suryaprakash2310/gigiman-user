import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppCard from "@/src/components/ui/AppCard";
import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";

// Conditionally require react-native-maps on native platforms to prevent web crash
let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (err) {
    console.warn("Could not load react-native-maps in BookingLocationMap:", err);
  }
}

/**
 * Universal helper to open location coordinates or address in Google Maps
 */
export const openLocationInGoogleMaps = (
  coords?: { latitude: number; longitude: number } | null,
  address?: string
) => {
  if (coords?.latitude && coords?.longitude) {
    const lat = coords.latitude;
    const lng = coords.longitude;
    const label = encodeURIComponent(address || "Booking Location");
    const universalUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    if (Platform.OS === "android") {
      const geoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
      Linking.canOpenURL(geoUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(geoUrl);
          } else {
            Linking.openURL(universalUrl);
          }
        })
        .catch(() => Linking.openURL(universalUrl));
      return;
    }

    if (Platform.OS === "ios") {
      const gmapsIos = `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}`;
      Linking.canOpenURL(gmapsIos)
        .then((supported) => {
          if (supported) {
            Linking.openURL(gmapsIos);
          } else {
            Linking.openURL(universalUrl);
          }
        })
        .catch(() => Linking.openURL(universalUrl));
      return;
    }

    Linking.openURL(universalUrl).catch((err) =>
      console.warn("Error opening Google Maps:", err)
    );
  } else if (address) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch((err) =>
      console.warn("Error opening Google Maps with address:", err)
    );
  }
};

interface BookingLocationMapProps {
  coordinates?: { latitude: number; longitude: number } | null;
  address?: string;
  addressTitle?: string;
  serviceName?: string;
  height?: number;
  showCardWrapper?: boolean;
}

export default function BookingLocationMap({
  coordinates,
  address,
  addressTitle,
  serviceName,
  height = 190,
  showCardWrapper = true,
}: BookingLocationMapProps) {
  const { theme } = useTheme();
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const hasCoords =
    coordinates?.latitude != null &&
    coordinates?.longitude != null &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    (coordinates.latitude !== 0 || coordinates.longitude !== 0);

  const handleOpenGoogleMaps = () => {
    openLocationInGoogleMaps(coordinates, address);
  };

  const handleRecenter = () => {
    if (mapRef.current && hasCoords && coordinates) {
      mapRef.current.animateToRegion(
        {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        500
      );
    }
  };

  const content = (
    <View style={styles.innerContainer}>
      {/* Header Row: Title + "Open in Google Maps" Button */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="location" size={18} color="#0D9488" />
          </View>
          <View style={{ flex: 1 }}>
            {serviceName ? (
              <AppText weight="bold" size="body" style={{ color: "#0F172A" }}>
                {serviceName}
              </AppText>
            ) : null}
            <AppText
              weight={serviceName ? "medium" : "bold"}
              size={serviceName ? "caption" : "body"}
              style={{ color: serviceName ? "#64748B" : "#0F172A" }}
            >
              {addressTitle || "Service Location"}
            </AppText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openGmapsBtn}
          onPress={handleOpenGoogleMaps}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={14} color="#0D9488" style={{ marginRight: 5 }} />
          <AppText weight="bold" size="caption" style={{ color: "#0D9488" }}>
            Google Maps
          </AppText>
          <Ionicons name="open-outline" size={12} color="#0D9488" style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>

      {/* Address Text */}
      {address ? (
        <View style={styles.addressBox}>
          <AppText size="small" weight="medium" style={{ color: "#334155", lineHeight: 20 }}>
            {address}
          </AppText>
        </View>
      ) : null}

      {/* Google Map View */}
      {hasCoords && coordinates ? (
        <View style={[styles.mapWrapper, { height }]}>
          {Platform.OS !== "web" && MapView ? (
            <>
              <MapView
                ref={mapRef}
                provider="google"
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                }}
                onMapReady={() => setMapReady(true)}
                showsUserLocation={false}
                showsCompass={false}
                showsScale={false}
                showsMyLocationButton={false}
              >
                <Marker
                  coordinate={{
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                  }}
                  title={serviceName ? `${serviceName} Location` : "Service Location"}
                  description={address || "Service destination"}
                >
                  <View style={styles.markerOuter}>
                    <View style={styles.markerInner}>
                      <Ionicons name="home" size={13} color="#FFFFFF" />
                    </View>
                    <View style={styles.markerTail} />
                  </View>
                </Marker>
              </MapView>

              {/* Floating Action Buttons on Map */}
              <View style={styles.mapActionsOverlay}>
                <TouchableOpacity
                  style={styles.mapActionIconBtn}
                  onPress={handleRecenter}
                  activeOpacity={0.8}
                >
                  <Ionicons name="locate" size={16} color="#0D9488" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mapActionGmapsPill}
                  onPress={handleOpenGoogleMaps}
                  activeOpacity={0.85}
                >
                  <Ionicons name="navigate" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <AppText weight="bold" size="caption" style={{ color: "#FFFFFF" }}>
                    View on Google Maps
                  </AppText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Web / fallback map preview */
            <TouchableOpacity
              style={styles.webFallbackContainer}
              onPress={handleOpenGoogleMaps}
              activeOpacity={0.85}
            >
              <View style={styles.webFallbackIconBg}>
                <Ionicons name="map" size={32} color="#0D9488" />
              </View>
              <AppText weight="bold" size="body" style={{ color: "#0F172A", marginTop: 8 }}>
                Google Map View
              </AppText>
              <AppText size="small" color="textMuted" style={{ marginTop: 2, textAlign: "center" }}>
                Tap to view service location on Google Maps
              </AppText>
              <View style={styles.webOpenGmapsBtn}>
                <Ionicons name="navigate-outline" size={14} color="#0D9488" style={{ marginRight: 4 }} />
                <AppText weight="bold" size="small" style={{ color: "#0D9488" }}>
                  Open in Google Maps
                </AppText>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* No coordinates fallback */
        <TouchableOpacity
          style={styles.noCoordsContainer}
          onPress={handleOpenGoogleMaps}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate-circle-outline" size={24} color="#0D9488" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <AppText weight="semibold" size="small" style={{ color: "#0F172A" }}>
              View Destination on Google Maps
            </AppText>
            <AppText size="caption" color="textMuted">
              Tap to search and navigate to this address
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!showCardWrapper) {
    return content;
  }

  return <AppCard style={styles.card}>{content}</AppCard>;
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  innerContainer: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  openGmapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#99F6E4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addressBox: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  mapWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#E2E8F0",
  },
  markerOuter: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerTail: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#0D9488",
    marginTop: -1,
  },
  mapActionsOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapActionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapActionGmapsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D9488",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  webFallbackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDFA",
    padding: 16,
  },
  webFallbackIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  webOpenGmapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  noCoordsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});
