import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/theme/useTheme';
import AppButton from '@/src/components/ui/AppButton';
import AppText from '@/src/components/ui/AppText';
import { getCurrentLocation } from "@/src/utils/location";
import AddressCard, { Address } from '@/src/components/AddressCard';
import AppHeader from '@/src/components/ui/AppHeader';
import { deleteAddressAPI, getAddressesAPI } from '@/src/api/auth';

const STORAGE_KEY = 'gigiman_saved_addresses';

export default function SavedAddressesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const styles = createStyles(theme, insets);
  const route = useRoute<any>();
  const selectMode = route.params?.selectMode ?? false;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const formatAddresses = (rawList: any[]): Address[] => {
    if (!Array.isArray(rawList)) return [];
    return rawList.map((a: any) => ({
      id: a._id || a.id,
      title: a.title || '',
      line1: a.address || a.line1 || '',
      latitude: a.location?.coordinates?.[1] ?? a.latitude,
      longitude: a.location?.coordinates?.[0] ?? a.longitude,
      isDefault: a.isDefault || a.is_default || false,
    }));
  };

  const MOCK_ADDRESS: Address = {
    id: "mock-home-1",
    title: "home",
    line1: "Nawab Garden Street 15a, 620003 Tiruchirappalli, India",
    latitude: 10.805,
    longitude: 78.6856,
    isDefault: true,
  };

  // Load from local cache
  const loadAddresses = async () => {
    let cachedList: Address[] = [];
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        cachedList = JSON.parse(cached);
      }
    } catch (cacheErr) {
      console.log("Failed to load cached addresses", cacheErr);
    }

    try {
      const res = await getAddressesAPI();
      const formatted = formatAddresses(res.data.addresses);
      if (formatted.length > 0) {
        setAddresses(formatted);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
      } else {
        if (cachedList.length > 0) {
          setAddresses(cachedList);
        } else {
          const defaultList = [MOCK_ADDRESS];
          setAddresses(defaultList);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultList));
        }
      }
    } catch (err) {
      console.log("Failed to load addresses", err);
      if (cachedList.length > 0) {
        setAddresses(cachedList);
      } else {
        const defaultList = [MOCK_ADDRESS];
        setAddresses(defaultList);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultList));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveAddresses = async (list: Address[]) => {
    setAddresses(list);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.log('Failed to save addresses', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  const handleSelectAddress = (address: Address) => {
    if (!selectMode) return;

    navigation.navigate("ServiceTab", {
      screen: "Booking",
      params: {
        selectedAddress: address
      }
    });
  };

  const handleAddAddress = () => {
    navigation.navigate('AddEditAddress'); // Screen you’ll create
  };

  const handleEditAddress = (address: Address) => {
    navigation.navigate('AddEditAddress', { addressId: address.id, address: address });
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const res = await deleteAddressAPI(addressId);
      const formatted = formatAddresses(res.data.addresses);
      setAddresses(formatted);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
    } catch (err) {
      console.log("Delete failed", err);
    }
  };

  const handleSetDefault = (addressId: string) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    saveAddresses(updated);
  };
  const handleBack = () => {
    navigation.navigate('ProfileTab');
  };

  const renderItem = ({ item }: { item: Address }) => (
    <AddressCard
      address={item}
      onPress={() => handleSelectAddress(item)}
      onPressEdit={() => handleEditAddress(item)}
      onPressDelete={() => item.id && handleDeleteAddress(item.id)}
      onPressSetDefault={() => item.id && handleSetDefault(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      {/* <AppHeader title="Saved Addresses" /> */}
      <AppHeader showBack/>

      <View style={styles.body}>
        {/* Top text */}
        <AppText size="body" color="textMuted" style={{ marginBottom: 12 }}>
          Choose your default address and manage locations for faster bookings.
        </AppText>

        {/* Empty state */}
        {!loading && addresses.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon} />
            <AppText weight="bold" size="h3" style={{ marginTop: 12 }}>
              No addresses saved
            </AppText>
            <AppText
              size="small"
              color="textMuted"
              style={{ marginTop: 4, textAlign: 'center', width: '80%' }}
            >
              Add your home or work address to book services faster.
            </AppText>
          </View>
        )}

        

        {/* List */}
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id ? String(item.id) : ''}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Add Address Button */}
      <View style={styles.footer}>
        <AppButton title="Add New Address" onPress={handleAddAddress} />
      </View>
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom: insets.bottom,
      paddingTop: insets.top,
    },
    body: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
    footer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    emptyState: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 16,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
      opacity: 0.6,
    },
    
  });
