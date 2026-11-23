import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/theme/useTheme';
import AppButton from '@/src/components/ui/AppButton';
import AppText from '@/src/components/ui/AppText';
import { getCurrentLocation } from "@/src/utils/location";
import AddressCard, { Address } from '@/src/components/AddressCard';
import AppHeader from '@/src/components/ui/AppHeader';
import AppSearchBar from '@/src/components/ui/AppSearchbar';
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
  const [searchQuery, setSearchQuery] = useState('');

  const formatAddresses = (rawList: any[]): Address[] => {
    if (!Array.isArray(rawList)) return [];
    return rawList.map((a: any) => ({
      id: a._id || a.id,
      _id: a._id || a.id,
      title: a.title || '',
      line1: a.address || a.line1 || '',
      address: a.address || a.line1 || '',
      flatNo: a.flatNo || '',
      floor: a.floor || '',
      apartmentName: a.apartmentName || '',
      landmark: a.landmark || '',
      area: a.area || '',
      receiverPhone: a.receiverPhone || '',
      receiverName: a.receiverName || '',
      latitude: a.location?.coordinates?.[1] ?? a.latitude,
      longitude: a.location?.coordinates?.[0] ?? a.longitude,
      isDefault: a.isDefault || a.is_default || false,
      isRegionAllowed: a.isRegionAllowed !== undefined ? a.isRegionAllowed : a.regionAllowed,
      regionAllowed: a.regionAllowed,
    }));

  };

  // Load from local cache and API
  const loadAddresses = async () => {
    let cachedList: Address[] = [];
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        cachedList = JSON.parse(cached);
        if (Array.isArray(cachedList) && cachedList.length > 0) {
          setAddresses(cachedList);
        }
      }
    } catch (cacheErr) {
      console.log("Failed to load cached addresses", cacheErr);
    }

    try {
      const res = await getAddressesAPI();
      const formatted = formatAddresses(res.data?.addresses);
      if (formatted.length > 0) {
        setAddresses(formatted);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
      } else if (cachedList.length > 0) {
        setAddresses(cachedList);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.log("Failed to load addresses from API", err);
      if (cachedList.length > 0) {
        setAddresses(cachedList);
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

    navigation.navigate("Booking", {
      selectedAddress: address,
      ...(route.params?.serviceCategoryId ? { serviceCategoryId: route.params.serviceCategoryId } : {}),
      ...(route.params?.serviceData ? { serviceData: route.params.serviceData } : {}),
      ...(route.params?.domainServiceId ? { domainServiceId: route.params.domainServiceId } : {}),
      ...(route.params?.fromMain ? { fromMain: route.params.fromMain } : {}),
    });
  };

  const handleAddAddress = () => {
    navigation.navigate('AddEditAddress', {
      selectMode,
      serviceCategoryId: route.params?.serviceCategoryId,
      serviceData: route.params?.serviceData,
      domainServiceId: route.params?.domainServiceId,
      fromMain: route.params?.fromMain,
    });
  };

  const handleEditAddress = (address: Address) => {
    navigation.navigate('AddEditAddress', {
      addressId: address.id || address._id,
      address: address,
      selectMode,
      serviceCategoryId: route.params?.serviceCategoryId,
      serviceData: route.params?.serviceData,
      domainServiceId: route.params?.domainServiceId,
      fromMain: route.params?.fromMain,
    });
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
    if (selectMode) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Booking", {
          ...(route.params?.serviceCategoryId ? { serviceCategoryId: route.params.serviceCategoryId } : {}),
          ...(route.params?.serviceData ? { serviceData: route.params.serviceData } : {}),
          ...(route.params?.domainServiceId ? { domainServiceId: route.params.domainServiceId } : {}),
          ...(route.params?.fromMain ? { fromMain: route.params.fromMain } : {}),
        });
      }
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("ProfileScreen");
      }
    }
  };

  const filteredAddresses = useMemo(() => {
    if (!searchQuery.trim()) return addresses;
    const q = searchQuery.toLowerCase().trim();
    return addresses.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const line1 = (item.line1 || item.address || '').toLowerCase();
      const area = (item.area || '').toLowerCase();
      const landmark = (item.landmark || '').toLowerCase();
      const apartment = (item.apartmentName || '').toLowerCase();
      const flatNo = (item.flatNo || '').toLowerCase();
      const receiverName = (item.receiverName || '').toLowerCase();
      const receiverPhone = (item.receiverPhone || '').toLowerCase();

      return (
        title.includes(q) ||
        line1.includes(q) ||
        area.includes(q) ||
        landmark.includes(q) ||
        apartment.includes(q) ||
        flatNo.includes(q) ||
        receiverName.includes(q) ||
        receiverPhone.includes(q)
      );
    });
  }, [addresses, searchQuery]);

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
      <AppHeader title="Saved Addresses" showBack onBackPress={handleBack} />

      <View style={styles.body}>
        {/* Top text */}
        <AppText size="body" color="textMuted" style={{ marginBottom: 12 }}>
          Choose your default address and manage locations for faster bookings.
        </AppText>

        {/* Search Bar */}
        {(addresses.length > 0 || searchQuery.length > 0) && (
          <AppSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved addresses..."
            onClear={() => setSearchQuery('')}
            containerStyle={{ marginBottom: 12 }}
          />
        )}

        {/* Empty state when no addresses saved */}
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

        {/* Search returned no matches */}
        {!loading && addresses.length > 0 && filteredAddresses.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={44} color={theme.colors.textMuted} />
            <AppText weight="bold" size="h3" style={{ marginTop: 12 }}>
              No addresses found
            </AppText>
            <AppText
              size="small"
              color="textMuted"
              style={{ marginTop: 4, textAlign: 'center', width: '80%' }}
            >
              No saved address matches "{searchQuery}".
            </AppText>
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
              activeOpacity={0.8}
            >
              <AppText size="small" weight="semibold" style={{ color: theme.colors.primary }}>
                Clear Search
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        <FlatList
          data={filteredAddresses}
          keyExtractor={(item, index) => item.id ? String(item.id) : (item._id ? String(item._id) : `address-${index}`)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
    clearSearchBtn: {
      marginTop: 14,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
