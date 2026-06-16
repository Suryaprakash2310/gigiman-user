import React, { useEffect, useState } from 'react';
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
  Modal,
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

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Group cart items by domain service ID
  const groupedCart = cartItems.reduce((acc, item) => {
    const domain = item.domainService;
    const domainId = domain?._id || domain || 'unknown';
    const domainName = domain?.domainName || 'General Services';
    const domainImage = domain?.domainImage;
    
    if (!acc[domainId]) {
      acc[domainId] = {
        domainId,
        domainName,
        domainImage,
        items: []
      };
    }
    acc[domainId].items.push(item);
    return acc;
  }, {} as Record<string, { domainId: string; domainName: string; domainImage?: string; items: typeof cartItems }>);

  const groups = Object.values(groupedCart);

  // Extract all categories from recommendations that are not yet in the cart
  const allSuggestions = suggestions.flatMap((s) => s.serviceCategory || []);
  const recommendedItems = allSuggestions.filter(
    (suggested) => !cartItems.some((cartItem) => cartItem.serviceCategoryId === suggested._id)
  );

  const getGroupRecommendations = (domainId: string) => {
    const matchingSuggestion = suggestions.find(
      (s) => String(s.DomainServiceId) === String(domainId) || String(s._id) === String(domainId)
    );
    if (!matchingSuggestion) return [];
    
    return recommendedItems.filter((rec) =>
      matchingSuggestion.serviceCategory?.some((c: any) => String(c._id) === String(rec._id))
    );
  };

  const handleAddSuggestion = async (categoryId: string) => {
    // Add item as an extra/subservice
    await addToCart(categoryId, 'EXTRA');
  };

  const handleProceed = (domainId?: string) => {
    if (domainId) {
      navigation.navigate('Booking', {
        serviceCategoryId: 'cart',
        domainServiceId: domainId,
      });
    } else {
      if (groups.length === 1) {
        navigation.navigate('Booking', {
          serviceCategoryId: 'cart',
          domainServiceId: groups[0].domainId,
        });
      } else if (groups.length > 1) {
        setShowCheckoutModal(true);
      }
    }
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
            {groups.map((group) => {
              const groupMainItems = group.items.filter((i) => i.type === 'MAIN');
              const groupSubItems = group.items.filter((i) => i.type === 'EXTRA');
              const groupRecs = getGroupRecommendations(group.domainId);
              const groupTotalPrice = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

              return (
                <View key={group.domainId} style={styles.groupCardContainer}>
                  {/* Group Header */}
                  <View style={styles.groupHeaderRow}>
                    <Ionicons name="construct-outline" size={18} color={theme.colors.primary} />
                    <AppText weight="bold" size="body" style={styles.groupHeaderTitle}>
                      {group.domainName}
                    </AppText>
                  </View>

                  {/* Group Main Items */}
                  {groupMainItems.map((item) => (
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

                  {/* Group Added Sub-Services */}
                  {groupSubItems.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <AppText weight="bold" size="caption" color="textMuted" style={styles.sectionTitle}>
                        Added Sub-Services
                      </AppText>
                      {groupSubItems.map((sub) => (
                        <View key={sub._id || sub.serviceCategoryId} style={styles.subServiceRow}>
                          <View style={styles.subLeft}>
                            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} style={{ marginTop: 2 }} />
                            <AppText weight="medium" style={{ marginLeft: 8, flex: 1 }}>
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

                  {/* Group Recommended Sub-Services */}
                  {groupRecs.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <AppText weight="bold" size="caption" color="textMuted" style={styles.sectionTitle}>
                        Add Recommended Sub-Services
                      </AppText>
                      {groupRecs.map((rec) => (
                        <View key={rec._id} style={styles.recRow}>
                          <View style={styles.recLeft}>
                            <Ionicons name="square-outline" size={20} color={theme.colors.textMuted} style={{ marginTop: 2 }} />
                            <View style={{ marginLeft: 12, flex: 1 }}>
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

                  {/* Separate Group Checkout Button */}
                  {groups.length > 1 && (
                    <View style={styles.groupCheckoutContainer}>
                      <View style={styles.groupCheckoutTextRow}>
                        <AppText size="small" color="textMuted">Subtotal ({group.items.length} items)</AppText>
                        <AppText weight="bold" size="body" color="primary">₹{groupTotalPrice}</AppText>
                      </View>
                      <AppButton
                        title={`Book ${group.domainName} →`}
                        variant="secondary"
                        onPress={() => handleProceed(group.domainId)}
                        style={styles.groupCheckoutBtn}
                      />
                    </View>
                  )}
                </View>
              );
            })}
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
              onPress={() => handleProceed()}
              style={styles.checkoutBtn}
            />
          </View>

          {/* 5. Checkout Selection Modal */}
          <Modal
            visible={showCheckoutModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCheckoutModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <AppText weight="bold" size="h3" style={{ color: theme.colors.text }}>
                    Choose Service to Book
                  </AppText>
                  <TouchableOpacity onPress={() => setShowCheckoutModal(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <AppText size="small" color="textMuted" style={styles.modalSubtitle}>
                  Your cart has items from different categories. Please check out one category at a time.
                </AppText>

                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                  {groups.map((group) => {
                    const groupPrice = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    return (
                      <TouchableOpacity
                        key={group.domainId}
                        style={styles.modalOption}
                        onPress={() => {
                          setShowCheckoutModal(false);
                          handleProceed(group.domainId);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <AppText weight="bold" size="body" style={{ color: theme.colors.text }}>
                            {group.domainName}
                          </AppText>
                          <AppText size="caption" color="textMuted">
                            {group.items.length} service{group.items.length > 1 ? 's' : ''}
                          </AppText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <AppText weight="bold" size="body" color="primary" style={{ marginRight: 8 }}>
                            ₹{groupPrice}
                          </AppText>
                          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
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
      flex: 1,
      marginRight: 12,
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
      borderRadius: 12,
      padding: 12,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.02,
      shadowRadius: 2,
      elevation: 1,
    },
    recLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      marginRight: 12,
    },
    checkboxPlaceholder: {
      width: 20,
      height: 20,
      borderWidth: 1.5,
      borderColor: theme.colors.textMuted,
      borderRadius: 4,
    },
    addBtn: {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: 'transparent',
    },
    addBtnText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: 'bold',
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
    groupCardContainer: {
      backgroundColor: 'transparent',
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 20,
    },
    groupHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      gap: 6,
    },
    groupHeaderTitle: {
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    groupCheckoutContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.02,
      shadowRadius: 2,
      elevation: 1,
    },
    groupCheckoutTextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    groupCheckoutBtn: {
      borderRadius: 8,
      height: 40,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalSubtitle: {
      marginBottom: 16,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
