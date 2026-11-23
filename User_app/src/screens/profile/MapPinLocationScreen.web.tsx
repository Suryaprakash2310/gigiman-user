import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import { getCurrentLocation, getAddressFromCoords } from "@/src/utils/location";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
}

export default function MapPinLocationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = createStyles(theme, insets);

  const debounceRef = useRef<any>(null);
  const searchDebounceRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const selectedCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const mapContainerId = "leaflet-map-container";

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [bottomCardHeight, setBottomCardHeight] = useState<number>(175);

  const initLocation = async () => {
    try {
      if (route.params?.latitude && route.params?.longitude) {
        const lat = Number(route.params.latitude);
        const lng = Number(route.params.longitude);
        const regionData: Region = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
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
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        };
        selectedCoordsRef.current = { latitude: location.latitude, longitude: location.longitude };
        setInitialRegion(regionData);
        reverseGeocode(location.latitude, location.longitude);
      }
    } catch (error) {
      console.log("Location init error:", error);
      const fallbackLat = 10.805;
      const fallbackLng = 78.6856;
      selectedCoordsRef.current = { latitude: fallbackLat, longitude: fallbackLng };
      setInitialRegion({
        latitude: fallbackLat,
        longitude: fallbackLng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      });
      reverseGeocode(fallbackLat, fallbackLng);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setLoadingAddress(true);
      if (MAPBOX_TOKEN) {
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
          return;
        }
      }

      const fallback = await getAddressFromCoords(lat, lng);
      setAddress(fallback);
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

  const onRegionChangeComplete = (lat: number, lng: number) => {
    selectedCoordsRef.current = {
      latitude: lat,
      longitude: lng,
    };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, 500);
  };

  const handleLocateMe = async () => {
    try {
      setLocatingCurrent(true);
      const location = await getCurrentLocation();
      selectedCoordsRef.current = { latitude: location.latitude, longitude: location.longitude };

      if (mapRef.current) {
        mapRef.current.setView([location.latitude, location.longitude], 16, { animate: true });
      }
      reverseGeocode(location.latitude, location.longitude);
    } catch (err) {
      console.warn("Locate me error:", err);
    } finally {
      setLocatingCurrent(false);
    }
  };

  // Search places via Mapbox & OSM
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      if (MAPBOX_TOKEN) {
        try {
          const res = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
            {
              params: {
                access_token: MAPBOX_TOKEN,
                autocomplete: true,
                limit: 5,
              },
              headers: { "User-Agent": "gigi-user-app" },
              timeout: 4000,
            }
          );
          if (res.data?.features && res.data.features.length > 0) {
            const mapped: SearchResult[] = res.data.features.map((f: any) => {
              const full = f.place_name || "";
              const parts = full.split(",");
              return {
                id: f.id || String(Math.random()),
                title: f.text || parts[0]?.trim() || query,
                subtitle: parts.slice(1).join(",").trim() || full,
                latitude: f.center[1],
                longitude: f.center[0],
              };
            });
            setSearchResults(mapped);
            return;
          }
        } catch (mapboxErr) {
          console.warn("Mapbox geocoding error:", mapboxErr);
        }
      }

      const osmRes = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            format: "json",
            q: query,
            limit: 5,
            addressdetails: 1,
          },
          headers: {
            "Accept": "application/json",
            "User-Agent": "GigiManUserApp/1.0",
          },
          timeout: 5000,
        }
      );

      if (Array.isArray(osmRes.data) && osmRes.data.length > 0) {
        const mapped: SearchResult[] = osmRes.data.map((item: any) => {
          const parts = item.display_name.split(",");
          return {
            id: String(item.place_id || Math.random()),
            title: item.name || parts[0]?.trim() || query,
            subtitle: parts.slice(1).join(",").trim() || item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          };
        });
        setSearchResults(mapped);
        return;
      }

      setSearchResults([]);
    } catch (err) {
      console.warn("Search places error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 400);
  };

  const handleSelectSearchResult = (item: SearchResult) => {
    Keyboard.dismiss();
    setSearchResults([]);
    setSearchQuery("");
    selectedCoordsRef.current = {
      latitude: item.latitude,
      longitude: item.longitude,
    };
    if (mapRef.current) {
      mapRef.current.setView([item.latitude, item.longitude], 16, { animate: true });
    }
    reverseGeocode(item.latitude, item.longitude);
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
        preservedFormData: route.params?.formData,
      },
      merge: true,
    });
  };

  useEffect(() => {
    initLocation();
  }, []);

  const splitAddress = useMemo(() => {
    if (!address) {
      return {
        title: "Selected Location",
        subtitle: "Drag map or search to choose location",
      };
    }
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) {
      return {
        title: parts[0] || address,
        subtitle: address,
      };
    }
    return {
      title: parts[0],
      subtitle: parts.slice(1).join(", "),
    };
  }, [address]);

  // Dynamically load Leaflet on Web
  useEffect(() => {
    let isMounted = true;
    const loadLeaflet = () => {
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
    if (!leafletLoaded || !initialRegion || mapRef.current) return;
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
      }).setView([initialRegion.latitude, initialRegion.longitude], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;

      map.on("moveend", () => {
        const center = map.getCenter();
        onRegionChangeComplete(center.lat, center.lng);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, initialRegion === null]);

  if (!initialRegion || !leafletLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <AppText style={{ marginTop: 10 }}>Loading map...</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER WITH PROPER SAFE AREA PADDING */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <AppText weight="bold" style={styles.headerTitle}>
            Confirm your location
          </AppText>
        </View>
      </View>

      <View nativeID={mapContainerId} style={styles.map} />

      {/* FLOATING SEARCH BAR & AUTOCOMPLETE LIST */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#059669" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locality, sector, area"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCorrect={false}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
        {searchResults.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSearchResult(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionIconBg}>
                    <Ionicons name="location-sharp" size={16} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" numberOfLines={1} style={styles.suggestionTitle}>
                      {item.title}
                    </AppText>
                    {item.subtitle ? (
                      <AppText size="caption" color="textMuted" numberOfLines={1} style={{ marginTop: 2 }}>
                        {item.subtitle}
                      </AppText>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* TOP-RIGHT SQUARE LOCATE BUTTON */}
      <TouchableOpacity
        style={styles.topLocateBtn}
        onPress={handleLocateMe}
        disabled={locatingCurrent}
        activeOpacity={0.8}
      >
        {locatingCurrent ? (
          <ActivityIndicator size="small" color="#059669" />
        ) : (
          <Ionicons name="locate" size={22} color="#334155" />
        )}
      </TouchableOpacity>

      {/* CENTER PIN WITH TOOLTIP BUBBLE */}
      <View pointerEvents="none" style={styles.pinContainer}>
        <View style={styles.tooltipBubble}>
          <AppText style={styles.tooltipSubtext}>Set this as your location</AppText>
          <AppText weight="bold" numberOfLines={1} style={styles.tooltipTitle}>
            {loadingAddress ? "Locating..." : splitAddress.title}
          </AppText>
        </View>
        <View style={styles.tooltipArrow} />

        <View style={styles.pinIconWrapper}>
          <Ionicons name="location" size={38} color="#059669" />
        </View>
        <View style={styles.pinDot} />
      </View>

      {/* "GO TO CURRENT LOCATION" FLOATING PILL */}
      <TouchableOpacity
        style={[styles.goToCurrentBtn, { bottom: bottomCardHeight + 14 }]}
        onPress={handleLocateMe}
        disabled={locatingCurrent}
        activeOpacity={0.85}
      >
        {locatingCurrent ? (
          <ActivityIndicator size="small" color="#059669" />
        ) : (
          <Ionicons name="navigate-circle" size={18} color="#059669" />
        )}
        <AppText weight="bold" style={styles.goToCurrentText}>
          Go to current location
        </AppText>
      </TouchableOpacity>

      {/* BOTTOM CARD WITH SELECTED ADDRESS & CONFIRM BUTTON */}
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 60) {
            setBottomCardHeight(h);
          }
        }}
        style={[styles.bottomCard, { paddingBottom: styles.safeBottom + 8 }]}
      >
        <View style={styles.locationDetailsRow}>
          <View style={styles.locationIconCircle}>
            <Ionicons name="location" size={22} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" style={styles.bottomCardTitle} numberOfLines={1}>
              {loadingAddress ? "Fetching location details..." : splitAddress.title}
            </AppText>
            <AppText size="small" color="textMuted" numberOfLines={2} style={styles.bottomCardSubtitle}>
              {loadingAddress ? "Please wait..." : splitAddress.subtitle}
            </AppText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={confirmLocation}
          activeOpacity={0.88}
        >
          <AppText weight="bold" style={styles.confirmBtnText}>
            Confirm location
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any, insets: any) => {
  const safeTop = insets.top > 0 ? insets.top : 16;
  const safeBottom = Math.max(insets.bottom, 16);

  return StyleSheet.create({
    safeTop: safeTop as any,
    safeBottom: safeBottom as any,
    container: {
      flex: 1,
      position: "relative",
      backgroundColor: "#F8FAFC",
    },
    headerContainer: {
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9",
      zIndex: 10,
    },
    headerRow: {
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    headerBackBtn: {
      marginRight: 12,
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      color: "#0F172A",
    },
    map: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F8FAFC",
    },
    searchBarContainer: {
      position: "absolute",
      top: safeTop + 62,
      left: 16,
      right: 16,
      zIndex: 1100,
    },
    searchInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: "#0F172A",
      paddingVertical: 4,
      outlineStyle: "none" as any,
    },
    suggestionsContainer: {
      marginTop: 6,
      backgroundColor: "#FFFFFF",
      borderRadius: 14,
      maxHeight: 220,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 6,
      overflow: "hidden",
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#F1F5F9",
      cursor: "pointer" as any,
    },
    suggestionIconBg: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#ECFDF5",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    suggestionTitle: {
      fontSize: 14,
      color: "#0F172A",
    },
    topLocateBtn: {
      position: "absolute",
      top: safeTop + 124,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      zIndex: 1050,
      cursor: "pointer" as any,
    },
    pinContainer: {
      position: "absolute",
      top: "50%",
      left: "50%",
      marginLeft: -110,
      width: 220,
      marginTop: -86,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    tooltipBubble: {
      backgroundColor: "#1E293B",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: "center",
      maxWidth: 210,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    tooltipSubtext: {
      color: "#94A3B8",
      fontSize: 11,
      textAlign: "center",
    },
    tooltipTitle: {
      color: "#FFFFFF",
      fontSize: 13,
      marginTop: 2,
      textAlign: "center",
    },
    tooltipArrow: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 6,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: "#1E293B",
      marginBottom: -2,
    },
    pinIconWrapper: {
      alignItems: "center",
      justifyContent: "center",
    },
    pinDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#059669",
      marginTop: -5,
      borderWidth: 1.5,
      borderColor: "#FFFFFF",
    },
    goToCurrentBtn: {
      position: "absolute",
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
      zIndex: 1050,
      cursor: "pointer" as any,
    },
    goToCurrentText: {
      color: "#059669",
      fontSize: 13,
    },
    bottomCard: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
      borderTopWidth: 1,
      borderTopColor: "#F1F5F9",
      zIndex: 1100,
    },
    locationDetailsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    locationIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#ECFDF5",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 2,
    },
    bottomCardTitle: {
      fontSize: 16,
      color: "#0F172A",
    },
    bottomCardSubtitle: {
      marginTop: 2,
      lineHeight: 18,
      color: "#64748B",
    },
    confirmBtn: {
      backgroundColor: "#059669",
      borderRadius: 14,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer" as any,
    },
    confirmBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
    },
  });
};
