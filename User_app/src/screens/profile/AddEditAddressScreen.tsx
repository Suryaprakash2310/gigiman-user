import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import { addAddressAPI, updateAddressAPI } from "@/src/api/auth";
import { getCurrentLocation, getAddressFromCoords } from "@/src/utils/location";
import { useAuthContext } from "@/src/context/AuthContext";

const STORAGE_KEY = "gigiman_saved_addresses";

// Temporary in-memory draft to preserve user input across map location changes
let tempFormDraft: {
  flatNo?: string;
  floor?: string;
  apartmentName?: string;
  landmark?: string;
  addressTag?: "Home" | "Other" | "Work";
  receiverPhone?: string;
  receiverName?: string;
  locality?: string;
  coordinates?: { latitude: number; longitude: number } | null;
} | null = null;

const parseAddressObject = (addr: any) => {
  if (!addr) return null;
  let flatNo = addr.flatNo || "";
  let floor = addr.floor || "";
  let apartmentName = addr.apartmentName || "";
  let landmark = addr.landmark || "";
  let area = addr.area || "";
  let receiverPhone = addr.receiverPhone || "";
  let receiverName = addr.receiverName || "";
  const fullStr = addr.line1 || addr.address || "";

  if ((!flatNo || !apartmentName || !area) && fullStr) {
    const flatMatch = fullStr.match(/Flat\/House\s+([^,]+)/i);
    const floorMatch = fullStr.match(/Floor\s+([^,]+)/i);
    const nearMatch = fullStr.match(/Near\s+([^,]+)/i);

    if (flatMatch && !flatNo) flatNo = flatMatch[1].trim();
    if (floorMatch && !floor) floor = floorMatch[1].trim();
    if (nearMatch && !landmark) landmark = nearMatch[1].trim();

    const rawParts = fullStr.split(",").map((p: string) => p.trim()).filter(Boolean);
    const cleanParts = rawParts.filter(
      (p: string) =>
        !p.toLowerCase().startsWith("flat/house") &&
        !p.toLowerCase().startsWith("floor") &&
        !p.toLowerCase().startsWith("near")
    );

    if (!apartmentName && cleanParts.length > 1) {
      apartmentName = cleanParts[0];
      if (!area) area = cleanParts.slice(1).join(", ");
    } else if (!area) {
      area = cleanParts.join(", ") || fullStr;
    }
  }

  return {
    flatNo,
    floor,
    apartmentName,
    landmark,
    area: area || fullStr,
    receiverPhone: receiverPhone ? receiverPhone.replace("+91", "").trim() : "",
    receiverName,
    latitude: addr.latitude || addr.location?.coordinates?.[1],
    longitude: addr.longitude || addr.location?.coordinates?.[0],
    addressTag: (addr.title === "Work" ? "Work" : addr.title === "Other" ? "Other" : "Home") as "Home" | "Other" | "Work",
  };
};

export default function AddEditAddressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const styles = createStyles(theme, insets);

  const addressId = route.params?.addressId;
  const isEdit = !!addressId;
  const selectMode = route.params?.selectMode ?? false;

  const initialAddressData = useMemo(() => {
    return parseAddressObject(route.params?.address);
  }, [route.params?.address]);

  // Form States - restored from draft or navigation params if returning from map, or initial address if editing
  const [addressTag, setAddressTag] = useState<"Home" | "Other" | "Work">(
    () => route.params?.preservedFormData?.addressTag || tempFormDraft?.addressTag || initialAddressData?.addressTag || "Home"
  );
  const [flatNo, setFlatNo] = useState(
    () => route.params?.preservedFormData?.flatNo ?? tempFormDraft?.flatNo ?? initialAddressData?.flatNo ?? ""
  );
  const [floor, setFloor] = useState(
    () => route.params?.preservedFormData?.floor ?? tempFormDraft?.floor ?? initialAddressData?.floor ?? ""
  );
  const [apartmentName, setApartmentName] = useState(
    () => route.params?.preservedFormData?.apartmentName ?? tempFormDraft?.apartmentName ?? initialAddressData?.apartmentName ?? ""
  );
  const [landmark, setLandmark] = useState(
    () => route.params?.preservedFormData?.landmark ?? tempFormDraft?.landmark ?? initialAddressData?.landmark ?? ""
  );
  const [locality, setLocality] = useState<string>(
    () =>
      route.params?.selectedAddressFromMap?.line1 ||
      route.params?.selectedAddressFromMap?.address ||
      route.params?.initialLocation?.address ||
      route.params?.initialLocation?.line1 ||
      route.params?.preservedFormData?.locality ||
      tempFormDraft?.locality ||
      initialAddressData?.area ||
      ""
  );
  const userPhone = (user as any)?.phone || (user as any)?.phoneNo || "";
  const [receiverPhone, setReceiverPhone] = useState(
    () =>
      route.params?.preservedFormData?.receiverPhone ??
      tempFormDraft?.receiverPhone ??
      initialAddressData?.receiverPhone ??
      (userPhone ? String(userPhone).replace("+91", "").replace(/\s+/g, "") : "")
  );
  const [receiverName, setReceiverName] = useState(
    () =>
      route.params?.preservedFormData?.receiverName ??
      tempFormDraft?.receiverName ??
      initialAddressData?.receiverName ??
      (user?.fullName || "")
  );
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(() => {
    if (route.params?.selectedAddressFromMap?.latitude && route.params?.selectedAddressFromMap?.longitude) {
      return {
        latitude: Number(route.params.selectedAddressFromMap.latitude),
        longitude: Number(route.params.selectedAddressFromMap.longitude),
      };
    }
    if (route.params?.initialLocation?.latitude && route.params?.initialLocation?.longitude) {
      return {
        latitude: Number(route.params.initialLocation.latitude),
        longitude: Number(route.params.initialLocation.longitude),
      };
    }
    if (tempFormDraft?.coordinates) return tempFormDraft.coordinates;
    if (initialAddressData?.latitude && initialAddressData?.longitude) {
      return {
        latitude: Number(initialAddressData.latitude),
        longitude: Number(initialAddressData.longitude),
      };
    }
    return null;
  });

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const isInitializedRef = useRef(false);
  const cancelGpsDetectionRef = useRef(false);

  // Initialize data: Edit mode, initial detect, or Map selection
  useEffect(() => {
    // 1. If returning from map with selected address
    if (route.params?.selectedAddressFromMap) {
      cancelGpsDetectionRef.current = true;
      const addr = route.params.selectedAddressFromMap;
      setLocality(addr.line1 || addr.address || "");
      if (addr.latitude && addr.longitude) {
        setCoordinates({ latitude: Number(addr.latitude), longitude: Number(addr.longitude) });
      }

      // Preserve previously typed house/apartment/etc input values
      const preserved = route.params?.preservedFormData || tempFormDraft;
      if (preserved) {
        if (preserved.flatNo !== undefined) setFlatNo(preserved.flatNo);
        if (preserved.floor !== undefined) setFloor(preserved.floor);
        if (preserved.apartmentName !== undefined) setApartmentName(preserved.apartmentName);
        if (preserved.landmark !== undefined) setLandmark(preserved.landmark);
        if (preserved.addressTag) setAddressTag(preserved.addressTag);
        if (preserved.receiverPhone) setReceiverPhone(preserved.receiverPhone);
        if (preserved.receiverName) setReceiverName(preserved.receiverName);
      }
      return;
    }

    // 2. If editing existing address
    if (route.params?.address && !isInitializedRef.current) {
      isInitializedRef.current = true;
      cancelGpsDetectionRef.current = true;
      const parsed = parseAddressObject(route.params.address);
      if (parsed) {
        setAddressTag(parsed.addressTag);
        setFlatNo(parsed.flatNo);
        setFloor(parsed.floor);
        setApartmentName(parsed.apartmentName);
        setLandmark(parsed.landmark);
        setLocality(parsed.area);
        if (parsed.receiverPhone) {
          setReceiverPhone(parsed.receiverPhone);
        } else if (userPhone) {
          setReceiverPhone(String(userPhone).replace("+91", "").trim());
        }
        if (parsed.receiverName) setReceiverName(parsed.receiverName);
        if (parsed.latitude && parsed.longitude) {
          setCoordinates({ latitude: Number(parsed.latitude), longitude: Number(parsed.longitude) });
        }
      }
      return;
    }

    // 3. If passed initialLocation (e.g. from "Use Current")
    if (route.params?.initialLocation && !isInitializedRef.current) {
      isInitializedRef.current = true;
      cancelGpsDetectionRef.current = true;
      const loc = route.params.initialLocation;
      setLocality(loc.address || loc.line1 || "");
      if (loc.latitude && loc.longitude) {
        setCoordinates({ latitude: Number(loc.latitude), longitude: Number(loc.longitude) });
      }
      return;
    }

    // 4. Starting fresh - auto detect GPS only once on first load
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      detectCurrentLocation();
    }
  }, [route.params?.selectedAddressFromMap, route.params?.address, route.params?.initialLocation, route.params?.preservedFormData]);

  const detectCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const loc = await getCurrentLocation();
      if (cancelGpsDetectionRef.current) return;
      const resolved = await getAddressFromCoords(loc.latitude, loc.longitude);
      if (cancelGpsDetectionRef.current) return;
      setCoordinates({ latitude: loc.latitude, longitude: loc.longitude });
      setLocality(resolved);
    } catch (err: any) {
      console.warn("Location detection error:", err);
      if (!locality && !cancelGpsDetectionRef.current) {
        setLocality("Please select or change location on map");
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleOpenMap = () => {
    cancelGpsDetectionRef.current = true;
    const currentForm = {
      flatNo,
      floor,
      apartmentName,
      landmark,
      addressTag,
      receiverPhone,
      receiverName,
      locality,
      coordinates,
    };
    tempFormDraft = currentForm;
    navigation.navigate("MapPinLocation", {
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      address: locality,
      formData: currentForm,
    });
  };

  const isFormValid = flatNo.trim().length > 0 && apartmentName.trim().length > 0 && locality.trim().length > 0;

  const handleSaveAddress = async () => {
    if (!flatNo.trim()) {
      Alert.alert("Required Field", "Please enter Flat / House No.");
      return;
    }
    if (!apartmentName.trim()) {
      Alert.alert("Required Field", "Please enter Apartment / Building name.");
      return;
    }
    if (!locality.trim() || !coordinates) {
      Alert.alert("Required Field", "Please select a valid area / locality.");
      return;
    }

    try {
      setSaving(true);

      // Build full formatted address string
      const addressParts = [
        `Flat/House ${flatNo.trim()}`,
        floor.trim() ? `Floor ${floor.trim()}` : null,
        apartmentName.trim(),
        landmark.trim() ? `Near ${landmark.trim()}` : null,
        locality.trim(),
      ].filter(Boolean);

      const fullAddressString = addressParts.join(", ");

      const fallbackPhone = (user as any)?.phone || (user as any)?.phoneNo || "";
      const fallbackName = user?.fullName || "User";
      const finalPhone = receiverPhone?.trim() || fallbackPhone;
      const finalName = receiverName?.trim() || fallbackName;

      const payload = {
        title: addressTag,
        address: fullAddressString,
        flatNo: flatNo.trim(),
        floor: floor.trim(),
        apartmentName: apartmentName.trim(),
        landmark: landmark.trim(),
        area: locality.trim(),
        receiverPhone: finalPhone ? (finalPhone.startsWith("+91") ? finalPhone : `+91 ${finalPhone.trim()}`) : "",
        receiverName: finalName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };

      const finalAddressObj = {
        ...payload,
        id: addressId || "local-" + Date.now(),
        _id: addressId || "local-" + Date.now(),
        line1: fullAddressString,
        isDefault: false,
      };


      // 1. Optimistic local storage update
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        let list = cached ? JSON.parse(cached) : [];
        if (isEdit) {
          list = list.map((a: any) => (a.id === addressId || a._id === addressId ? { ...a, ...finalAddressObj } : a));
        } else {
          if (list.length === 0) {
            finalAddressObj.isDefault = true;
          }
          list.push(finalAddressObj);
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (storageErr) {
        console.log("Failed to sync new address to AsyncStorage:", storageErr);
      }

      // 2. Server API call to store all details in the backend
      try {
        const isRealMongoId = isEdit && addressId && !String(addressId).startsWith("local-");
        let serverRes: any = null;
        if (isRealMongoId) {
          serverRes = await updateAddressAPI(addressId, payload);
        } else {
          serverRes = await addAddressAPI(payload);
        }

        if (serverRes?.data?.address?._id) {
          finalAddressObj.id = serverRes.data.address._id;
          finalAddressObj._id = serverRes.data.address._id;
        }

        // Sync backend returned addresses with full details into local cache
        if (Array.isArray(serverRes?.data?.addresses) && serverRes.data.addresses.length > 0) {
          const mapped = serverRes.data.addresses.map((a: any) => ({
            id: a._id || a.id,
            _id: a._id || a.id,
            title: a.title || "",
            line1: a.address || a.line1 || "",
            address: a.address || a.line1 || "",
            flatNo: a.flatNo || "",
            floor: a.floor || "",
            apartmentName: a.apartmentName || "",
            landmark: a.landmark || "",
            area: a.area || "",
            receiverPhone: a.receiverPhone || "",
            receiverName: a.receiverName || "",
            latitude: a.location?.coordinates?.[1] ?? a.latitude,
            longitude: a.location?.coordinates?.[0] ?? a.longitude,
            isDefault: a.isDefault || false,
          }));
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        }
      } catch (apiErr) {
        console.warn("Backend address sync note:", apiErr);
      }

      // 3. Return to previous screen
      tempFormDraft = null;
      if (selectMode) {
        navigation.navigate("Booking", {
          selectedAddress: finalAddressObj,
          ...(route.params?.serviceCategoryId ? { serviceCategoryId: route.params.serviceCategoryId } : {}),
          ...(route.params?.serviceData ? { serviceData: route.params.serviceData } : {}),
          ...(route.params?.domainServiceId ? { domainServiceId: route.params.domainServiceId } : {}),
          ...(route.params?.fromMain ? { fromMain: route.params.fromMain } : {}),
        });
      } else {
        navigation.navigate("SavedAddressesScreen");
      }
    } catch (err: any) {
      console.error("Save address error:", err);
      Alert.alert("Error", err?.message || "Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    tempFormDraft = null;
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (selectMode) {
      navigation.navigate("Booking", {
        ...(route.params?.serviceCategoryId ? { serviceCategoryId: route.params.serviceCategoryId } : {}),
        ...(route.params?.serviceData ? { serviceData: route.params.serviceData } : {}),
        ...(route.params?.domainServiceId ? { domainServiceId: route.params.domainServiceId } : {}),
        ...(route.params?.fromMain ? { fromMain: route.params.fromMain } : {}),
      });
    } else {
      navigation.navigate("SavedAddressesScreen");
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : (Platform.OS === "android" ? 28 : 14) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <AppText weight="bold" style={styles.headerTitle}>
          {isEdit ? "Edit address details" : "Add address details"}
        </AppText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION 1: ADDRESS DETAILS */}
          <View style={styles.card}>
            <AppText weight="bold" style={styles.cardTitle}>
              Address details
            </AppText>
            <AppText size="small" color="textMuted" style={{ marginBottom: 12 }}>
              Save address as
            </AppText>

            {/* Address Tag Selector */}
            <View style={styles.tagRow}>
              {(["Home", "Other", "Work"] as const).map((tag) => {
                const isSelected = addressTag === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagBtn,
                      isSelected && styles.tagBtnActive,
                    ]}
                    onPress={() => setAddressTag(tag)}
                    activeOpacity={0.8}
                  >
                    <AppText
                      weight={isSelected ? "bold" : "medium"}
                      style={[
                        styles.tagText,
                        isSelected && styles.tagTextActive,
                      ]}
                    >
                      {tag}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Flat/House No & Floor */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Flat/House No.*"
                  placeholderTextColor="#94A3B8"
                  value={flatNo}
                  onChangeText={setFlatNo}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Floor (Optional)"
                  placeholderTextColor="#94A3B8"
                  value={floor}
                  onChangeText={setFloor}
                />
              </View>
            </View>

            {/* Apartment / Building name */}
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.textInput}
                placeholder="Apartment / Building name*"
                placeholderTextColor="#94A3B8"
                value={apartmentName}
                onChangeText={setApartmentName}
              />
            </View>

            {/* Nearby Landmark */}
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.textInput}
                placeholder="Nearby Landmark (Optional)"
                placeholderTextColor="#94A3B8"
                value={landmark}
                onChangeText={setLandmark}
              />
            </View>
          </View>

          {/* SECTION 2: AREA / SECTOR / LOCALITY */}
          <View style={styles.card}>
            <View style={styles.localityHeader}>
              <AppText size="caption" weight="semibold" style={styles.localityLabel}>
                Area/Sector/Locality*
              </AppText>
            </View>

            <View style={styles.localityContentRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                {loadingLocation ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 }}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <AppText size="small" style={{ color: theme.colors.primary }}>
                      Locating address...
                    </AppText>
                  </View>
                ) : (
                  <AppText weight="medium" style={styles.localityText} numberOfLines={4}>
                    {locality || "No area selected"}
                  </AppText>
                )}
              </View>

              <TouchableOpacity
                style={styles.changeBtn}
                onPress={handleOpenMap}
                activeOpacity={0.8}
              >
                <AppText weight="bold" style={styles.changeBtnText}>
                  Change
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* STICKY BOTTOM SAVE BUTTON */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            isFormValid ? styles.saveBtnActive : styles.saveBtnDisabled,
          ]}
          onPress={handleSaveAddress}
          disabled={!isFormValid || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <AppText weight="bold" style={[styles.saveBtnText, !isFormValid && styles.saveBtnTextDisabled]}>
              Save address
            </AppText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9",
    },
    backBtn: {
      marginRight: 14,
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      color: "#0F172A",
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 24,
      gap: 14,
    },
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 16,
      color: "#0F172A",
      marginBottom: 4,
    },
    tagRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    tagBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: "#CBD5E1",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
    },
    tagBtnActive: {
      borderColor: "#059669",
      backgroundColor: "#ECFDF5",
    },
    tagText: {
      color: "#475569",
      fontSize: 14,
    },
    tagTextActive: {
      color: "#065F46",
    },
    inputRow: {
      flexDirection: "row",
    },
    inputGroup: {
      marginBottom: 14,
    },
    floatingLabelWrap: {
      marginBottom: 4,
      marginLeft: 2,
    },
    floatingLabel: {
      color: "#64748B",
      fontSize: 12,
    },
    textInput: {
      height: 50,
      borderWidth: 1,
      borderColor: "#CBD5E1",
      borderRadius: 12,
      paddingHorizontal: 14,
      fontSize: 15,
      color: "#0F172A",
      backgroundColor: "#FFFFFF",
    },
    localityHeader: {
      marginBottom: 6,
    },
    localityLabel: {
      color: "#64748B",
      fontSize: 12,
    },
    localityContentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    localityText: {
      color: "#1E293B",
      fontSize: 14,
      lineHeight: 20,
    },
    changeBtn: {
      backgroundColor: "#ECFDF5",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#A7F3D0",
    },
    changeBtnText: {
      color: "#059669",
      fontSize: 13,
    },
    phoneInputRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    countryCodeBox: {
      height: 50,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "#CBD5E1",
      borderRightWidth: 0,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      backgroundColor: "#F8FAFC",
      alignItems: "center",
      justifyContent: "center",
    },
    countryCodeText: {
      color: "#0F172A",
      fontSize: 15,
    },
    phoneTextInput: {
      flex: 1,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
    bottomBar: {
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    saveBtn: {
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    saveBtnActive: {
      backgroundColor: theme.colors.primary || "#047857",
    },
    saveBtnDisabled: {
      backgroundColor: "#CBD5E1",
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      letterSpacing: 0.3,
    },
    saveBtnTextDisabled: {
      color: "#64748B",
    },
  });