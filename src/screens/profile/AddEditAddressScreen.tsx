import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";

import AppHeader from "@/src/components/ui/AppHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";

const STORAGE_KEY = "gigiman_saved_addresses";
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export default function AddEditAddressScreen() {

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  /*
   SEARCH ADDRESS
  */

  const searchAddress = async (text: string) => {

    setQuery(text);

    if (text.length < 3) {
      setResults([]);
      return;
    }

    try {

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

    } catch (err) {
      console.log("Mapbox search error", err);
    }
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

  /*
   SAVE ADDRESS
  */

  const saveAddress = async () => {

    if (!selectedLocation) {
      Alert.alert("Select Address", "Please select address from suggestions or map");
      return;
    }

    try {

      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];

      const newAddress = {
        id: Date.now().toString(),
        label: "other",
        title: "Address",
        line1: selectedLocation.address,
        city: "",
        pincode: "",
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      };

      list.push(newAddress);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));

      navigation.goBack();

    } catch (err) {
      console.log("Save address error", err);
    }
  };

  return (

    <View style={styles.container}>

      <AppHeader showBack title="Add Address" />

      <ScrollView contentContainerStyle={styles.body}>

        <AppText weight="semibold" style={{ marginBottom: 6 }}>
          Search Address
        </AppText>

        <TextInput
          style={styles.input}
          placeholder="Search your location"
          value={query}
          onChangeText={searchAddress}
        />

        <AppButton
          title="Select From Map"
          onPress={() => navigation.navigate("MapPinLocation")}
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

        <AppButton
          title="Save Address"
          onPress={saveAddress}
          style={{ marginTop: 20 }}
        />

      </ScrollView>

    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },

    body: {
      padding: 20
    },

    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10
    },

    resultItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderColor: "#eee"
    },

    selectedBox: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      marginTop: 10
    }

  });