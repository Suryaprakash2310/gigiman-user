import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView
} from "react-native";

import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";

import AppHeader from "@/src/components/ui/AppHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import { wp, hp } from "@/src/utils/responsive";
import { useTheme } from "@/src/theme/useTheme";
import { addAddressAPI, updateAddressAPI } from "@/src/api/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export default function AddEditAddressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const styles = createStyles(theme, insets);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [addressType, setAddressType] = useState("home");
  const addressId = route.params?.addressId;
  const isEdit = !!addressId;
  /*
   SEARCH ADDRESS
  */

  const debounceRef = useRef<any>(null);

  const searchAddress = (text: string) => {

    setQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {

      if (text.length < 3) {
        setResults([]);
        return;
      }

      const encoded = encodeURIComponent(text);

      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            limit: 5,
            country: "IN"
          }
        }
      );

      setResults(res.data.features);

    }, 400);
  };
  /*
   SELECT SEARCH RESULT → OPEN MAP
  */

  const selectAddress = (place: any) => {

    const [longitude, latitude] = place.center;

    navigation.navigate("MapPinLocation", {
      latitude,
      longitude,
      address: place.place_name
    });

  };

  /*
   RECEIVE MAP LOCATION
  */

  useEffect(() => {

    const addr = route.params?.selectedAddressFromMap;

    if (!addr) return;

    setSelectedLocation({
      address: addr.line1,
      latitude: addr.latitude,
      longitude: addr.longitude
    });

    setQuery(addr.line1);

  }, [route.params?.selectedAddressFromMap]);


  useEffect(() => {
    if (!route.params?.address) return;

    const addr = route.params.address;

    setQuery(addr.line1 || addr.address);
    setSelectedLocation({
      address: addr.line1 || addr.address,
      latitude: addr.latitude,
      longitude: addr.longitude,
    });

  }, [route.params]);
  /*
   SAVE ADDRESS
  */

  const saveAddress = async () => {

    if (!selectedLocation) {
      Alert.alert("Select Address", "Please select address first");
      return;
    }

    try {

      if (isEdit) {

        await updateAddressAPI(addressId, {
          title: addressType,
          address: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude
        });

      } else {

        await addAddressAPI({
          title: addressType,
          address: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude
        });

      }

      //navigation.goBack();
      navigation.navigate("SavedAddressesScreen");

    } catch (err) {
      console.log("Save address error", err);
    }

  };

  return (
    <View style={styles.scrollContent}>

      <AppHeader showBack title="Add Address" />
      <View style={styles.container}>

        <AppText weight="semibold" style={styles.label}>Search Address</AppText>
        <TextInput
          style={styles.input}
          placeholder="Search your location"
          value={query}
          onChangeText={searchAddress}
        />
        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => selectAddress(item)}
              >
                <AppText>{item.place_name}</AppText>
              </TouchableOpacity>
            )}
            style={styles.resultList}
          />
        )}
        {selectedLocation && (
          <View style={styles.selectedBox}>
            <AppText weight="semibold">Selected Address</AppText>
            <AppText size="small" color="textMuted">
              {selectedLocation.address}
            </AppText>
          </View>
        )}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, addressType === "home" && styles.typeSelected]}
            onPress={() => setAddressType("home")}
          >
            <AppText>🏠 Home</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, addressType === "office" && styles.typeSelected]}
            onPress={() => setAddressType("office")}
          >
            <AppText>🏢 Office</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, addressType === "other" && styles.typeSelected]}
            onPress={() => setAddressType("other")}
          >
            <AppText>📍 Other</AppText>
          </TouchableOpacity>
        </View>
        <AppButton
          title="Save Address"
          onPress={saveAddress}
          style={styles.saveBtn}
        />
      </View>

    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    scrollContent: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom: insets.bottom,
      paddingTop: insets.top,
    },
    container: {
      flex: 1,
      paddingVertical: hp(4),
      paddingHorizontal: wp(5),
      backgroundColor: theme.colors.background,
      width: "100%",
      maxWidth: 480,
      alignSelf: "center",
    },
    label: {
      marginBottom: theme.spacing.sm,
      fontSize: theme.typography.h3,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      fontSize: theme.typography.body,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      width: "100%",
    },
    resultList: {
      maxHeight: hp(25),
      marginBottom: theme.spacing.md,
    },
    resultItem: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    selectedBox: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    typeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    typeButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      marginHorizontal: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
    },
    typeSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primaryDark,
    },
    saveBtn: {
      marginTop: theme.spacing.xl,
      width: "100%",
      alignSelf: "center",
    },
  });