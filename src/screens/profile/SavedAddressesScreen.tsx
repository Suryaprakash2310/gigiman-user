import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useTheme } from '@/src/theme/useTheme';
//import AppHeader from '@/src/components/ui/AppHeader';
import AppText from '@/src/components/ui/AppText';
import AppButton from '@/src/components/ui/AppButton';

import AddressCard, { Address } from '@/src/components/AddressCard';

const STORAGE_KEY = 'gigiman_saved_addresses';

export default function SavedAddressesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const styles = createStyles(theme, insets);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from local cache
  const loadAddresses = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Address[] = JSON.parse(raw);
        setAddresses(parsed);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.log('Failed to load addresses', err);
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

  const handleAddAddress = () => {
    navigation.navigate('AddEditAddress'); // Screen you’ll create
  };

  const handleEditAddress = (address: Address) => {
    navigation.navigate('AddEditAddress', { addressId: address.id });
  };

  const handleDeleteAddress = (addressId: string) => {
    const updated = addresses.filter(a => a.id !== addressId);
    saveAddresses(updated);
  };

  const handleSetDefault = (addressId: string) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    saveAddresses(updated);
  };

  const renderItem = ({ item }: { item: Address }) => (
    <AddressCard
      address={item}
      onPressEdit={() => handleEditAddress(item)}
      onPressDelete={() => handleDeleteAddress(item.id)}
      onPressSetDefault={() => handleSetDefault(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      {/* <AppHeader title="Saved Addresses" /> */}

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
          keyExtractor={(item) => item.id}
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
