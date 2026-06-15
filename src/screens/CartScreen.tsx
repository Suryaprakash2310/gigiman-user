import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartContext } from '../context/CartContext';
import { useTheme } from '../theme/useTheme';
import AppHeader from '../components/ui/AppHeader';
import AppText from '../components/ui/AppText';
import AppButton from '../components/ui/AppButton';

export default function CartScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const {
    cartItems,
    totalPrice,
    suggestions,
    isLoading,
    addToCart,
    removeFromCart,
    fetchCart,
    fetchSuggestions
  } = useCartContext();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCart(),
      fetchSuggestions()
    ]);
    setRefreshing(false);
  }, [fetchCart, fetchSuggestions]);

  useEffect(() => {
    fetchCart();
    fetchSuggestions();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  // Separate main services from sub/extra services for UI listing
  const mainItems = cartItems.filter((i) => i.type === 'MAIN');
  const addedSubServices = cartItems.filter((i) => i.type === 'EXTRA');

  // Extract all categories from recommendations that are not yet in the cart
  const allSuggestions = suggestions.flatMap((s) => s.serviceCategory || []);
  const recommendedItems = allSuggestions.filter(
    (suggested) => !cartItems.some((cartItem) => cartItem.serviceCategoryId === suggested._id)
  );

  const handleAddSuggestion = async (categoryId: string) => {
    // Add item as an extra/subservice
    await addToCart(categoryId, 'EXTRA');
  };

  const handleProceed = () => {
    navigation.navigate('Booking', {
      serviceCategoryId: 'cart',
    });
  };

  if (isLoading && cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader showBack onBackPress={handleBack} title="My Cart" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: Platform.OS === 'android' ? insets.top : 0 },
      ]}
    >
      <AppHeader showBack onBackPress={handleBack} title={`My Cart (${cartItems.length})`} />

      {cartItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="cart-outline"
            size={80}
            color={theme.colors.textMuted}
            style={{ marginBottom: 16 }}
          />
          <AppText weight="bold" size="h3" color="textMuted">
            Your Cart is Empty
          </AppText>
          <AppText size="small" color="textMuted" style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
            Looks like you haven't added any home services to your cart yet.
          </AppText>
          <AppButton
            title="Browse Services"
            style={{ marginTop: 24, width: '60%' }}
            onPress={() => navigation.navigate('MainServiceScreen')}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
          >
            {/* 1. Main Service Items */}
            {mainItems.map((item) => (
              <View key={item._id || item.serviceCategoryId} style={styles.cartCard}>
                <Image
                  source={
                    item.domainService?.domainImage
                      ? { uri: item.domainService.domainImage }
                      : require('../../assets/images/SampleService.png')
                  }
                  style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                  <AppText weight="bold" size="body">
                    {item.serviceCategoryName}
                  </AppText>
                  
                  <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
                      <AppText size="caption" color="textMuted">{item.durationInMinutes}m</AppText>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={14} color={theme.colors.primary} />
                      <AppText size="caption" color="textMuted">{item.employeeCount} pro</AppText>
                    </View>
                  </View>

                  <AppText weight="bold" color="primary" style={{ marginTop: 4 }}>
                    ₹{item.price}
                  </AppText>
                </View>
                
                <View style={styles.rightActionsContainer}>
                  <TouchableOpacity 
                    onPress={() => removeFromCart(item.serviceCategoryId, true)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.danger || '#FF3B30'} />
                  </TouchableOpacity>

                  {/* Quantity & Actions */}
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.qtyBtn} 
                      onPress={() => addToCart(item.serviceCategoryId, 'MAIN')}
                    >
                      <Ionicons name="add" size={16} color={theme.colors.text} />
                    </TouchableOpacity>
                    <AppText weight="bold" style={styles.qtyText}>
                      {item.quantity}
                    </AppText>
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => removeFromCart(item.serviceCategoryId, false)}
                    >
                      <Ionicons name="remove" size={16} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* 2. Added Sub-Services Section (Screen 5) */}
            {addedSubServices.length > 0 && (
              <View style={styles.sectionContainer}>
                <AppText weight="bold" size="body" style={styles.sectionTitle}>
                  Added Sub-Services
                </AppText>
                {addedSubServices.map((sub) => (
                  <View key={sub._id || sub.serviceCategoryId} style={styles.subServiceRow}>
                    <View style={styles.subLeft}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <AppText weight="medium" style={{ marginLeft: 8 }}>
                        {sub.serviceCategoryName}
                      </AppText>
                    </View>
                    <View style={styles.subRight}>
                      <AppText weight="bold" color="primary" style={{ marginRight: 12 }}>
                        ₹{sub.price}
                      </AppText>
                      <TouchableOpacity onPress={() => removeFromCart(sub.serviceCategoryId, true)}>
                        <Ionicons name="trash-outline" size={18} color={theme.colors.danger || '#FF3B30'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 3. Recommended Sub-Services Section (Screen 4) */}
            {recommendedItems.length > 0 && (
              <View style={styles.sectionContainer}>
                <AppText weight="bold" size="body" style={styles.sectionTitle}>
                  Add Sub-Services
                </AppText>
                {recommendedItems.map((rec) => (
                  <View key={rec._id} style={styles.recRow}>
                    <View style={styles.recLeft}>
                      <View style={styles.checkboxPlaceholder} />
                      <View style={{ marginLeft: 12 }}>
                        <AppText weight="medium">{rec.serviceCategoryName}</AppText>
                        <AppText size="caption" color="textMuted">₹{rec.price}</AppText>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAddSuggestion(rec._id)}
                    >
                      <AppText weight="bold" style={styles.addBtnText}>
                        Add
                      </AppText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* 4. Sticky Bottom Checkout Summary */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.totalRow}>
              <AppText size="body" color="textMuted">
                Total
              </AppText>
              <AppText weight="bold" size="h2" color="primary">
                ₹{totalPrice}
              </AppText>
            </View>

            <AppButton
              title="Proceed to Checkout →"
              variant="primary"
              onPress={handleProceed}
              style={styles.checkoutBtn}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 160,
    },
    cartCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    rightActionsContainer: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 70,
    },
    deleteBtn: {
      padding: 4,
      marginBottom: 4,
    },
    cardImage: {
      width: 70,
      height: 70,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
    },
    cardContent: {
      flex: 1,
      marginLeft: 12,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    quantityControls: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 4,
    },
    qtyBtn: {
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    qtyText: {
      paddingHorizontal: 8,
      fontSize: 13,
    },
    sectionContainer: {
      marginTop: 20,
      marginHorizontal: 16,
    },
    sectionTitle: {
      marginBottom: 10,
    },
    subServiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 12,
      marginVertical: 4,
      borderWidth: 1,
      borderColor: `${theme.colors.success}30`,
    },
    subLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 12,
      marginVertical: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    recLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkboxPlaceholder: {
      width: 20,
      height: 20,
      borderWidth: 1.5,
      borderColor: theme.colors.textMuted,
      borderRadius: 4,
    },
    addBtn: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 6,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    addBtnText: {
      color: theme.colors.primary,
      fontSize: 12,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingTop: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 10,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    checkoutBtn: {
      borderRadius: 10,
    },
  });
