import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/src/components/ui/AppText";
import { Coordinates, useLiveTracking } from "@/src/hooks/useLiveTracking";
import { getCurrentLocation } from "@/src/utils/location";
import { MAPBOX_ACCESS_TOKEN } from "@/src/config/env";

// Conditionally require react-native-maps on native platforms to prevent web crash
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (err) {
    console.warn("Could not load react-native-maps:", err);
  }
}

interface LiveTrackingMapProps {
  bookingId: string;
  status: string;
  customerCoordinates?: Coordinates;
  customerAddress?: string;
  initialProviderCoordinates?: Coordinates;
  initialEta?: string;
  providerName?: string;
  providerPhone?: string;
  height?: number;
}

export default function LiveTrackingMap({
  bookingId,
  status,
  customerCoordinates,
  customerAddress,
  initialProviderCoordinates,
  initialEta,
  providerName = "Technician",
  height = 300,
}: LiveTrackingMapProps) {
  const mapRef = useRef<any>(null);

  // Live location tracking from socket
  const { servicerLocation, eta: liveEta, distance } = useLiveTracking(
    bookingId,
    initialProviderCoordinates,
    initialEta
  );

  const [customerCoords, setCustomerCoords] = useState<Coordinates | null>(
    customerCoordinates || null
  );
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [routeEta, setRouteEta] = useState<string | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Ensure customer location is known
  useEffect(() => {
    if (customerCoordinates?.latitude && customerCoordinates?.longitude) {
      setCustomerCoords(customerCoordinates);
    } else if (!customerCoords) {
      getCurrentLocation()
        .then((coords) => {
          setCustomerCoords(coords);
        })
        .catch((err) => {
          console.warn("Failed to get customer fallback location:", err);
          // Default fallback coordinate if permission denied
          setCustomerCoords({ latitude: 12.9716, longitude: 77.5946 });
        });
    }
  }, [customerCoordinates]);

  // Fetch driving route using Mapbox Directions API
  useEffect(() => {
    if (!servicerLocation || !customerCoords) return;

    let isMounted = true;

    const fetchMapboxRoute = async () => {
      try {
        setLoadingRoute(true);
        const token = MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          // Direct fallback line if no token
          if (isMounted) {
            setRouteCoordinates([servicerLocation, customerCoords]);
          }
          return;
        }

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${servicerLocation.longitude},${servicerLocation.latitude};${customerCoords.longitude},${customerCoords.latitude}?geometries=geojson&overview=full&access_token=${token}`;

        const res = await fetch(url);
        const data = await res.json();

        if (isMounted && data?.routes?.[0]?.geometry?.coordinates) {
          const coords: Coordinates[] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => ({
              latitude: c[1],
              longitude: c[0],
            })
          );
          setRouteCoordinates(coords);

          // Calculate ETA in minutes if available
          if (data.routes[0].duration) {
            const minutes = Math.max(1, Math.round(data.routes[0].duration / 60));
            setRouteEta(`${minutes} mins`);
          }
        } else if (isMounted) {
          setRouteCoordinates([servicerLocation, customerCoords]);
        }
      } catch (error) {
        console.warn("Mapbox directions fetch error:", error);
        if (isMounted) {
          setRouteCoordinates([servicerLocation, customerCoords]);
        }
      } finally {
        if (isMounted) {
          setLoadingRoute(false);
        }
      }
    };

    fetchMapboxRoute();

    return () => {
      isMounted = false;
    };
  }, [
    servicerLocation?.latitude,
    servicerLocation?.longitude,
    customerCoords?.latitude,
    customerCoords?.longitude,
  ]);

  // Auto-fit camera to cover both provider and customer
  const fitMapBounds = () => {
    if (!mapRef.current) return;

    const coordsToFit: Coordinates[] = [];
    if (servicerLocation) coordsToFit.push(servicerLocation);
    if (customerCoords) coordsToFit.push(customerCoords);

    if (coordsToFit.length >= 2) {
      mapRef.current.fitToCoordinates(coordsToFit, {
        edgePadding: { top: 70, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    } else if (coordsToFit.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: coordsToFit[0].latitude,
          longitude: coordsToFit[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        800
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fitMapBounds();
    }, 600);
    return () => clearTimeout(timer);
  }, [servicerLocation?.latitude, servicerLocation?.longitude, customerCoords?.latitude]);

  const activeEta = liveEta || routeEta || "Calculating...";
  const isArrived =
    status === "provider_arrived" || status === "arrived";
  const isStarted =
    status === "provider_started_trip" || status === "started_trip";

  const initialLat =
    servicerLocation?.latitude || customerCoords?.latitude || 12.9716;
  const initialLng =
    servicerLocation?.longitude || customerCoords?.longitude || 77.5946;

  // 🌐 Web rendering fallback
  if (Platform.OS === "web" || !MapView) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.webMapFallback}>
          <Ionicons name="map-outline" size={48} color="#0D9488" />
          <AppText weight="bold" size="body" style={{ marginTop: 10, color: "#0F172A" }}>
            Live Tracking Map
          </AppText>
          <AppText size="small" color="textMuted" style={{ marginTop: 4, textAlign: "center" }}>
            {isArrived
              ? `${providerName} has arrived at your location!`
              : `${providerName} is on the way (${activeEta})`}
          </AppText>
          {customerAddress ? (
            <View style={styles.webAddressBox}>
              <Ionicons name="location" size={14} color="#0D9488" />
              <AppText size="caption" style={{ color: "#475569", marginLeft: 4 }} numberOfLines={1}>
                {customerAddress}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Floating Status Pill */}
        <View style={styles.floatingStatusContainer}>
          <View
            style={[
              styles.floatingStatusBadge,
              isArrived ? styles.badgeArrived : isStarted ? styles.badgeStarted : styles.badgeOnWay,
            ]}
          >
            <Ionicons
              name={isArrived ? "checkmark-circle" : "navigate"}
              size={14}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <AppText weight="bold" size="small" style={{ color: "#FFFFFF" }}>
              {isArrived
                ? "Technician Arrived"
                : isStarted
                ? "Trip Started"
                : `On the way • ${activeEta}`}
            </AppText>
          </View>
        </View>
      </View>
    );
  }

  // 📱 Mobile native rendering with react-native-maps
  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
      >
        {/* Driving Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0D9488"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Customer Location Marker */}
        {customerCoords && (
          <Marker
            coordinate={customerCoords}
            title="Your Location"
            description={customerAddress || "Service destination"}
          >
            <View style={styles.customerMarkerOuter}>
              <View style={styles.customerMarkerInner}>
                <Ionicons name="home" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.markerPinTail} />
            </View>
          </Marker>
        )}

        {/* Provider Location Marker */}
        {servicerLocation && (
          <Marker
            coordinate={servicerLocation}
            title={providerName}
            description={isArrived ? "Arrived" : `ETA: ${activeEta}`}
          >
            <View style={styles.providerMarkerWrapper}>
              <View
                style={[
                  styles.providerMarkerCircle,
                  isArrived ? { backgroundColor: "#10B981" } : { backgroundColor: "#0D9488" },
                ]}
              >
                <Ionicons
                  name={isArrived ? "person" : "car-sport"}
                  size={16}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.providerPulse} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Floating Status Pill */}
      <View style={styles.floatingStatusContainer}>
        <View
          style={[
            styles.floatingStatusBadge,
            isArrived
              ? styles.badgeArrived
              : isStarted
              ? styles.badgeStarted
              : styles.badgeOnWay,
          ]}
        >
          <Ionicons
            name={isArrived ? "checkmark-circle" : "navigate"}
            size={14}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <AppText weight="bold" size="small" style={{ color: "#FFFFFF" }}>
            {isArrived
              ? "Technician Arrived"
              : isStarted
              ? "Trip Started"
              : `On the way • ${activeEta}`}
          </AppText>
          {loadingRoute && (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 6 }} />
          )}
        </View>
      </View>

      {/* Floating Recenter Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={fitMapBounds}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={20} color="#0D9488" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    position: "relative",
  },
  webMapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F0FDFA",
  },
  webAddressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    maxWidth: "85%",
  },
  floatingStatusContainer: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  floatingStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeStarted: {
    backgroundColor: "#0284C7",
  },
  badgeOnWay: {
    backgroundColor: "#0D9488",
  },
  badgeArrived: {
    backgroundColor: "#059669",
  },
  recenterButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 10,
  },
  customerMarkerOuter: {
    alignItems: "center",
  },
  customerMarkerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerPinTail: {
    width: 4,
    height: 6,
    backgroundColor: "#2563EB",
    marginTop: -1,
  },
  providerMarkerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  providerMarkerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 2,
  },
  providerPulse: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(13, 148, 136, 0.25)",
    zIndex: 1,
  },
});
