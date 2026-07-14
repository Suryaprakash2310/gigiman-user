import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CryptoJS from 'crypto-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { razorpayHTML } from '@/src/utils/razorpayTemplate';
import { injectRazorpayData } from '@/src/utils/razorpayInjector';

import apiClient from '@/src/api/client';
import AppButton from '@/src/components/ui/AppButton';
import AppHeader from '@/src/components/ui/AppHeader';
import AppText from '@/src/components/ui/AppText';
import CalendarModal from '@/src/components/ui/CalendarModal';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ServiceAPI } from '@/src/api/service.api';
import { CouponAPI } from '@/src/api/coupon.api';
import { useAuthContext } from '@/src/context/AuthContext';
import { useCartContext } from '@/src/context/CartContext';
import { useBooking } from '@/src/context/BookingContext';
import { useTheme } from '@/src/theme/useTheme';
import { BOOKING_TYPE } from '@/src/utils/enums/BookingType';
import { getCurrentLocation, getAddressFromCoords } from '@/src/utils/location';

import BookingModeSelector from '@/src/components/booking/BookingModeSelector';
import QuantitySelector from '@/src/components/booking/QuantitySelector';
import ScheduleSelector from '@/src/components/booking/ScheduleSelector';
import ServiceDescription from '@/src/components/booking/ServiceDescription';
import ServiceHeader from '@/src/components/booking/ServiceHeader';
import { AppTabsParamList } from '@/src/navigation/AppStack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Nav = BottomTabNavigationProp<AppTabsParamList, 'BookingTab'>;

interface Props {
  route: {
    params: {
      serviceCategoryId: string;
      serviceData?: any;
      selectedAddress?: any;
      fromMain?: boolean;
      domainServiceId?: string;
    };
  };
}

interface ServiceCategory {
  _id: string;
  serviceCategoryName: string;
  price: number;
  durationInMinutes: number;
  servicecategoryImage?: string;
  description?: string;
  domainService?: string;
}

const { width } = Dimensions.get('window');

const ServiceBookingScreen: React.FC<Props> = ({ route }) => {
  const { serviceCategoryId, serviceData, fromMain, domainServiceId } = route.params || {};
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { upsertBooking } = useBooking();

  const { cartItems, totalPrice: cartTotalPrice, clearCart, removeFromCart } = useCartContext();
  const isCartCheckout = serviceCategoryId === 'cart';

  const filteredCartItems = React.useMemo(() => {
    if (!isCartCheckout) return [];
    if (!domainServiceId) return cartItems;
    return cartItems.filter(
      (item) =>
        (item.domainService?._id || item.domainService) === domainServiceId
    );
  }, [cartItems, isCartCheckout, domainServiceId]);

  const filteredCartTotalPrice = React.useMemo(() => {
    return filteredCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [filteredCartItems]);

  // State management
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [bookingMode, setBookingMode] = useState<'now' | 'schedule'>('now');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  //referal code
  const [referralCode, setReferralCode] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [checkingReferral, setCheckingReferral] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Payment Option & Simulation States
  const [paymentType, setPaymentType] = useState<'FULL' | 'ADVANCE'>('FULL');
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [paymentMethodType, setPaymentMethodType] = useState<'CARD' | 'UPI'>('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [showWebViewModal, setShowWebViewModal] = useState(false);

  // Load service on mount
  useEffect(() => {
    if (isCartCheckout) {
      setCategory({
        _id: 'cart',
        serviceCategoryName: filteredCartItems.map(item => item.serviceCategoryName).join(', '),
        price: filteredCartTotalPrice,
        durationInMinutes: filteredCartItems.reduce((sum, item) => sum + item.durationInMinutes, 0),
        description: 'Multi-service booking',
        domainService: domainServiceId || filteredCartItems[0]?.domainService?._id || filteredCartItems[0]?.domainService || '',
      });
      setLoading(false);
    } else {
      loadService();
    }
  }, [serviceCategoryId, isCartCheckout, filteredCartItems, filteredCartTotalPrice, domainServiceId]);

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.selectedAddress) {
        setSelectedAddress(route.params.selectedAddress);
      }
    }, [route.params?.selectedAddress])
  );
  useEffect(() => {
    loadDefaultAddress();
  }, []);

  const loadDefaultAddress = async () => {
    try {
      const raw = await AsyncStorage.getItem('gigiman_saved_addresses');
      if (!raw) return;

      const list = JSON.parse(raw);
      const defaultAddress = list.find((a: any) => a.isDefault);

      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (err) {
      console.log('Failed loading address', err);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      let resolvedAddress = "Current Location";
      try {
        resolvedAddress = await getAddressFromCoords(location.latitude, location.longitude);
      } catch (e) {
        console.warn("Geocoding failed:", e);
      }

      setSelectedAddress({
        line1: "Current Location",
        latitude: location.latitude,
        longitude: location.longitude
      });

    } catch (err) {
      Alert.alert("Location Error", "Unable to get current location");
    }
  };

  const loadService = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ServiceAPI.getServiceCategoryByIdAPI(serviceCategoryId);
      setCategory(res.serviceCategory);
    } catch (err) {
      console.error('Load service error:', err);
      if (serviceData) {
        const formattedCategory: ServiceCategory = {
          _id: serviceData._id,
          serviceCategoryName: serviceData.serviceCategoryName || serviceData.name,
          price: serviceData.price || 0,
          durationInMinutes: serviceData.durationInMinutes || 60,
          description: serviceData.description,
          servicecategoryImage: serviceData.servicecategroyImage || serviceData.serviceImage,
          domainService: serviceData.domainService,
        };
        setCategory(formattedCategory);
      }
    } finally {
      setLoading(false);
    }
  }, [serviceCategoryId, serviceData]);

  const handleQuantityIncrease = useCallback(() => {
    setQuantity((prev) => Math.min(prev + 1, 10));
  }, []);

  const handleQuantityDecrease = useCallback(() => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleApplyReferral = () => {

    if (!referralCode) {
      Alert.alert("Enter referral code");
      return;
    }

    // Temporary logic
    if (!category) {
      Alert.alert("Service Error", "Service details not found");
      return;
    }
    const price = category.price * quantity;
    const discount = price * 0.05;

    setReferralDiscount(discount);

    Alert.alert("Referral Applied", `You saved ₹${discount.toFixed(0)}`);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    if (!category) return;

    try {
      setCouponLoading(true);
      setCouponError('');
      setCouponSuccess('');
      
      const cartTotal = category.price * quantity;
      const res = await CouponAPI.validateCoupon(couponCode, cartTotal);

      if (res.success) {
        setAppliedCoupon(res.coupon);
        setDiscountAmount(res.discountAmount || 0);
        setCouponSuccess(`Coupon applied! Saved ₹${res.discountAmount || 0}`);
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponSuccess('');
    setCouponError('');
  };

  const generateSignature = (orderId: string, paymentId: string) => {
    const secret = '0L67Y5DD4Ai3Ksr9xgT6bfas';
    const body = orderId + '|' + paymentId;
    return CryptoJS.HmacSHA256(body, secret).toString(CryptoJS.enc.Hex);
  };

  const resetPaymentSheetFields = () => {
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setUpiId('');
    setCurrentBookingId(null);
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (!data.success) {
        Alert.alert("Payment Cancelled", data.reason === "dismissed" ? "Payment was cancelled by user" : "Payment failed");
        setShowWebViewModal(false);
        setPaymentHtml(null);
        setPaying(false);
        return;
      }

      // 1. Send payment success details to backend
      const successRes = await apiClient.post('/booking/payment/success', {
        bookingId: currentBookingId,
        paymentMethod: "RAZORPAY",
        razorpayOrderId: data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
      });

      if (successRes.data?.success) {
        // 2. Perform booking success local state updates
        const bookingPrice = isCartCheckout ? filteredCartTotalPrice : ((category?.price || 0) * quantity);
        const finalPrice = bookingPrice - discountAmount;
        
        upsertBooking({
          _id: currentBookingId!,
          serviceCategoryName: category?.serviceCategoryName || "Cart Checkout",
          address: selectedAddress?.line1 || "Current Location",
          status: 'searching',
          totalPrice: finalPrice,
          isScheduled: false,
          paymentType,
          advanceAmount: paymentType === 'ADVANCE' ? Math.round(finalPrice * 0.18) : finalPrice,
          remainingAmount: paymentType === 'ADVANCE' ? Math.round(finalPrice * 0.82) : 0,
        });

        if (isCartCheckout) {
          if (domainServiceId) {
            await Promise.all(
              filteredCartItems.map(item => removeFromCart(item.serviceCategoryId, true))
            ).catch(err => console.log('Error removing items from cart:', err));
          } else {
            clearCart();
          }
        }

        setShowWebViewModal(false);
        setPaymentHtml(null);
        setShowPaymentSheet(false);
        resetPaymentSheetFields();

        navigation.navigate('BookingTab', {
          screen: 'Searching',
          params: { bookingId: currentBookingId },
        } as any);
      } else {
        throw new Error(successRes.data?.message || "Failed to confirm payment on backend");
      }
    } catch (err: any) {
      console.error('Error in handleWebViewMessage:', err);
      Alert.alert('Payment Error', err?.message || 'Failed to verify transaction');
      setShowWebViewModal(false);
      setPaymentHtml(null);
      setPaying(false);
    }
  };

  const handleSimulatedPayment = async () => {
    if (!currentBookingId || !category) return;

    try {
      setPaying(true);

      // Create order via backend
      const response = await apiClient.post(`/booking/createorder/${currentBookingId}`, { paymentType });
      const { keyId, orderId, amount } = response.data;

      // Inject details into local HTML
      const html = injectRazorpayData({
        htmlTemplate: razorpayHTML,
        keyId,
        amountPaise: amount,
        orderId,
        prefillName: user?.fullName,
        prefillEmail: user?.email,
        prefillContact: user?.phone,
      });

      setPaymentHtml(html);
      setShowWebViewModal(true);
    } catch (err: any) {
      console.error('Payment error:', err);
      Alert.alert(
        'Payment Failed',
        err?.response?.data?.message || err.message || 'Payment process failed. Please try again.'
      );
      setPaying(false);
    }
  };

  const handleBookNow = useCallback(async () => {
    if (!user?._id) {
      Alert.alert('Login Required', 'Please login to book a service');
      return;
    }

    if (!category) {
      Alert.alert('Service Error', 'Service details not found');
      return;
    }

    if (bookingMode === 'schedule' && (!selectedDate || !selectedTime)) {
      Alert.alert(
        'Schedule Required',
        'Please select both date and time for scheduled booking'
      );
      return;
    }

    try {
      setBooking(true);

      let coordinates;
      let addressText;

      if (selectedAddress) {
        coordinates = [
          selectedAddress.longitude,
          selectedAddress.latitude,
        ];
        addressText = selectedAddress.line1;
      } else {
        const location = await getCurrentLocation();
        coordinates = [location.longitude, location.latitude];
        try {
          addressText = await getAddressFromCoords(location.latitude, location.longitude);
        } catch {
          addressText = "Current Location";
        }
      }

      const scheduleDateTime =
        bookingMode === 'schedule'
          ? new Date(
            selectedDate!.getFullYear(),
            selectedDate!.getMonth(),
            selectedDate!.getDate(),
            selectedTime!.getHours(),
            selectedTime!.getMinutes()
          )
          : null;

      const payload: any = {
        userId: user._id,
        address: addressText,
        coordinates: coordinates,
        paymentType: paymentType,
      };

      if (!isCartCheckout) {
        payload.serviceCategoryName = category.serviceCategoryName;
        payload.domainService = category.domainService;
        payload.serviceCount = quantity;
      } else if (domainServiceId) {
        payload.domainServiceId = domainServiceId;
      }

      if (scheduleDateTime) {
        payload.isScheduled = true;
        payload.scheduleDateTime = scheduleDateTime;
        payload.bookingType = BOOKING_TYPE.SCHEDULED;
      }

      if (appliedCoupon) {
        payload.couponCode = appliedCoupon.code;
      }

      const res = await apiClient.post(
        scheduleDateTime ? '/booking/schedule' : '/booking/auto-assign',
        payload
      );

      const booking = res.data?.booking ?? null;
      const bookingId =
        booking?._id ?? res.data?.bookingId ?? null;

      if (!bookingId) {
        throw new Error("Booking ID not returned from server");
      }

      const bookingPrice = isCartCheckout ? filteredCartTotalPrice : (category.price * quantity);

      if (scheduleDateTime) {
        upsertBooking({
          _id: bookingId,
          serviceCategoryName: category.serviceCategoryName,
          address: payload.address,
          totalPrice: bookingPrice,
          status: "scheduled",
          isScheduled: true,
          scheduleDateTime: scheduleDateTime.toISOString(),
        });

        if (isCartCheckout) {
          if (domainServiceId) {
            await Promise.all(
              filteredCartItems.map(item => removeFromCart(item.serviceCategoryId, true))
            ).catch(err => console.log('Error removing items from cart:', err));
          } else {
            clearCart();
          }
        }

        navigation.navigate("BookingTab", {
          screen: "BookingsMain",
          params: { activeTab: "upcoming" }
        } as any);
      } else {
        // Open simulated payment sheet
        setCurrentBookingId(bookingId);
        setShowPaymentSheet(true);
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      let errorMsg = 'Please try again';
      if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err?.message) {
        if (err.message.toLowerCase().includes("location")) {
          errorMsg = "Please turn ON the location";
        } else {
          errorMsg = err.message;
        }
      }
      Alert.alert(
        'Booking Failed',
        errorMsg
      );
    } finally {
      setBooking(false);
    }
  }, [user, category, bookingMode, selectedDate, selectedTime, quantity, appliedCoupon, navigation, upsertBooking, paymentType]);

  const handleBack = useCallback(() => {
    if (fromMain) {
      // If reached directly from Home, navigate to the Service list
      navigation.navigate('MainServiceScreen');
    } else {
      navigation.goBack();
    }
  }, [fromMain, navigation]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader showBack onBackPress={handleBack} title="Service Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText size="body" color="textMuted" style={styles.loadingText}>
            Loading service details...
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!category) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader showBack onBackPress={handleBack} title="Service Details" />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={theme.colors.danger}
            style={styles.errorIcon}
          />
          <AppText weight="bold" size="h3" color="danger" style={styles.errorTitle}>
            Service Not Found
          </AppText>
          <AppText size="body" color="textMuted" style={styles.errorMessage}>
            The service you're looking for is no longer available
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const imageSource = category.servicecategoryImage
    ? { uri: category.servicecategoryImage }
    : require('../../assets/images/SampleService.png');

  const totalPrice = isCartCheckout ? filteredCartTotalPrice : (category.price * quantity);

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: Platform.OS === 'android' ? insets.top : 0 },
      ]}
    >
      <AppHeader showBack onBackPress={handleBack} title={isCartCheckout ? "Checkout" : "Service Details"} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isCartCheckout ? (
          /* Cart Order Summary Card (Screen 6) */
          <Animated.View entering={FadeInDown.duration(400)} style={styles.summaryCard}>
            <AppText weight="bold" size="body" style={styles.summaryTitle}>
              Order Summary
            </AppText>
            {filteredCartItems.map((item) => (
              <View key={item._id || item.serviceCategoryId} style={styles.summaryRow}>
                <AppText weight="medium" style={{ flex: 1, color: theme.colors.text }}>
                  {item.serviceCategoryName} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                </AppText>
                <AppText weight="bold" style={{ color: theme.colors.text }}>
                  ₹{item.price * item.quantity}
                </AppText>
              </View>
            ))}
          </Animated.View>
        ) : (
          /* Legacy Single Category Layout */
          <>
            {/* Hero Image */}
            <Animated.View entering={FadeInDown.duration(400)}>
              <Image source={imageSource} style={styles.heroImage} />
            </Animated.View>

            {/* Service Header Card */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <ServiceHeader
                name={category.serviceCategoryName}
                price={category.price}
                duration={category.durationInMinutes}
              />
            </Animated.View>

            {/* Service Description */}
            {category.description && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <ServiceDescription description={category.description} />
              </Animated.View>
            )}

            {/* Quantity Selector */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <QuantitySelector
                quantity={quantity}
                onIncrease={handleQuantityIncrease}
                onDecrease={handleQuantityDecrease}
                label="How many services needed?"
              />
            </Animated.View>
          </>
        )}

        <View style={styles.locationCard}>
          <Ionicons name="location-outline" size={20} color={theme.colors.primary} />

          <View style={{ flex: 1, marginLeft: 10 }}>
            <AppText weight="bold">Service Location</AppText>

            <AppText size="small" color="textMuted">
              {selectedAddress?.line1 ?? "Select address"}
            </AppText>
          </View>

          <AppText
            weight="bold"
            style={{ color: theme.colors.primary, marginRight: 12 }}
            onPress={handleUseCurrentLocation}
          >
            Use Current
          </AppText>

          <AppText
            weight="bold"
            style={{ color: theme.colors.primary }}
            onPress={() => navigation.navigate("ProfileTab", { screen: "SavedAddressesScreen", params: { selectMode: true } } as any)}
          >
            Change
          </AppText>
        </View>

        {/* Booking Mode Selector */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <BookingModeSelector
            selectedMode={bookingMode}
            onModeChange={(mode: 'now' | 'schedule') => {
              setBookingMode(mode);
              setSelectedDate(null);
              setSelectedTime(null);
            }}
          />
        </Animated.View>

        {/* Schedule Selector - Conditional */}
        {bookingMode === 'schedule' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <ScheduleSelector
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDatePress={() => setShowCalendar(true)}
              onTimePress={() => setShowTimePicker(true)}
            />
          </Animated.View>
        )}

        {/* Payment Options Section */}
        {bookingMode === 'now' && (
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.paymentOptionsCard}>
            <AppText weight="bold" style={{ marginBottom: 12 }}>Payment Options</AppText>
            
            <TouchableOpacity
              style={[
                styles.paymentOptionRow,
                paymentType === 'FULL' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentType('FULL')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={paymentType === 'FULL' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={paymentType === 'FULL' ? theme.colors.primary : theme.colors.textMuted}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <AppText weight="bold">Pay Full Amount</AppText>
                <AppText size="small" color="textMuted">Pay ₹{totalPrice - discountAmount} online now</AppText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOptionRow,
                paymentType === 'ADVANCE' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentType('ADVANCE')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={paymentType === 'ADVANCE' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={paymentType === 'ADVANCE' ? theme.colors.primary : theme.colors.textMuted}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <AppText weight="bold">Pay 18% Advance Amount</AppText>
                <AppText size="small" color="textMuted">
                  Pay ₹{Math.round((totalPrice - discountAmount) * 0.18)} now, remaining ₹{Math.round((totalPrice - discountAmount) * 0.82)} collected after completion
                </AppText>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>

        {/* Coupon Input Section */}
        <View style={styles.couponSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            {appliedCoupon ? (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText weight="bold" style={{ color: theme.colors.success }}>{appliedCoupon.code} Applied</AppText>
                <TouchableOpacity onPress={removeCoupon} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponInputContainer}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter Coupon Code"
                  placeholderTextColor={theme.colors.textMuted}
                  value={couponCode}
                  onChangeText={(text) => {
                    setCouponCode(text.toUpperCase());
                    setCouponError('');
                  }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <AppText weight="bold" style={{ color: '#fff', fontSize: 12 }}>APPLY</AppText>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          {couponError ? (
            <AppText size="small" color="danger" style={{ marginTop: 4 }}>{couponError}</AppText>
          ) : null}
        </View>

        <View style={styles.priceDisplay}>
          <AppText size="body" color="textMuted">
            {paymentType === 'ADVANCE' && bookingMode === 'now' ? 'Advance to Pay:' : 'Total:'}
          </AppText>
          <View style={{ alignItems: 'flex-end' }}>
            {discountAmount > 0 ? (
              <AppText
                size="small"
                style={{ color: theme.colors.textMuted, textDecorationLine: 'line-through' }}
              >
                ₹{totalPrice}
              </AppText>
            ) : null}
            <AppText
              weight="bold"
              size="h2"
              style={{ color: theme.colors.primary }}
            >
              ₹{paymentType === 'ADVANCE' && bookingMode === 'now' ? Math.round((totalPrice - discountAmount) * 0.18) : (totalPrice - discountAmount)}
            </AppText>
          </View>
        </View>

        <AppButton
          title={
            booking
              ? 'Booking...'
              : bookingMode === 'schedule'
                ? 'Schedule Service'
                : (paymentType === 'ADVANCE' ? 'Pay Advance & Book' : 'Pay Full & Book')
          }
          disabled={booking || (bookingMode === 'schedule' && (!selectedDate || !selectedTime))}
          onPress={handleBookNow}
          loading={booking}
          variant="primary"
          style={styles.bookButton}
        />
      </View>

      {/* Modals */}
      <CalendarModal
        visible={showCalendar}
        selectedDate={selectedDate}
        onClose={() => setShowCalendar(false)}
        onSelect={setSelectedDate}
      />

      {showTimePicker && (
        <DateTimePicker
          mode="time"
          value={selectedTime || new Date()}
          onChange={(e, time) => {
            setShowTimePicker(false);
            if (time) setSelectedTime(time);
          }}
        />
      )}

      {/* Simulated Payment Sheet Modal */}
      <Modal
        visible={showPaymentSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!paying) {
            setShowPaymentSheet(false);
            resetPaymentSheetFields();
          }
        }}
      >
        <View style={styles.paymentSheetOverlay}>
          <View style={[styles.paymentSheetContent, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <View style={styles.paymentSheetHeader}>
              <AppText weight="bold" size="h3">Checkout Payment</AppText>
              {!paying && (
                <TouchableOpacity
                  onPress={() => {
                    setShowPaymentSheet(false);
                    resetPaymentSheetFields();
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* Price Details */}
            <View style={[styles.paymentSheetPriceBox, { backgroundColor: theme.colors.background }]}>
              <AppText size="small" color="textMuted">Amount to Pay Now</AppText>
              <AppText weight="bold" size="h1" style={{ color: theme.colors.primary }}>
                ₹{paymentType === 'ADVANCE' ? Math.round((totalPrice - discountAmount) * 0.18) : (totalPrice - discountAmount)}
              </AppText>
              {paymentType === 'ADVANCE' && (
                <AppText size="caption" color="textMuted" style={{ marginTop: 2 }}>
                  Remaining ₹{Math.round((totalPrice - discountAmount) * 0.82)} collected after service
                </AppText>
              )}
            </View>

            {/* Payment Info */}
            <View style={{ marginTop: 20, marginBottom: 10, alignItems: 'center', paddingHorizontal: 16 }}>
              <Ionicons name="shield-checkmark-outline" size={48} color={theme.colors.primary} />
              <AppText weight="semibold" size="body" style={{ marginTop: 12, textAlign: 'center', color: theme.colors.text }}>
                Secure Payment with Razorpay
              </AppText>
              <AppText size="small" color="textMuted" style={{ marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
                You will be redirected to Razorpay's secure checkout. Supports Cards, UPI, Netbanking, and popular wallets.
              </AppText>
            </View>

            {/* Action Buttons */}
            <View style={{ marginTop: 24, paddingBottom: Platform.OS === 'ios' ? 24 : 12 }}>
              <AppButton
                title={paying ? "Processing Secure Payment..." : `Pay ₹${paymentType === 'ADVANCE' ? Math.round((totalPrice - discountAmount) * 0.18) : (totalPrice - discountAmount)}`}
                onPress={handleSimulatedPayment}
                loading={paying}
                disabled={paying}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Local WebView Modal for Razorpay Checkout */}
      <Modal
        visible={showWebViewModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowWebViewModal(false);
          setPaymentHtml(null);
          setPaying(false);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#1e293b',
            borderBottomWidth: 1,
            borderBottomColor: '#334155'
          }}>
            <AppText weight="bold" size="body" style={{ color: '#f8fafc' }}>Secure Razorpay Checkout</AppText>
            <TouchableOpacity
              onPress={() => {
                setShowWebViewModal(false);
                setPaymentHtml(null);
                setPaying(false);
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={24} color="#f1f5f9" />
            </TouchableOpacity>
          </View>
          {paymentHtml && (
            <WebView
              originWhitelist={["*"]}
              source={{ html: paymentHtml }}
              javaScriptEnabled
              domStorageEnabled
              onMessage={handleWebViewMessage}
              startInLoadingState
              renderLoading={() => (
                <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: '#0f172a' }}>
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 200,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    loadingText: {
      marginTop: theme.spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    errorIcon: {
      marginBottom: theme.spacing.lg,
      opacity: 0.7,
    },
    errorTitle: {
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    errorMessage: {
      textAlign: 'center',
      fontSize: 14,
    },
    heroImage: {
      width: width,
      height: 280,
      backgroundColor: theme.colors.surface,
    },
    spacer: {
      height: theme.spacing.xl,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    priceDisplay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    bookButton: {
      borderRadius: theme.radius.lg,
    },
    locationCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 12,
    },
    referralCard: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 12,
    },
    referralRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
    },
    referralInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    couponSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    couponInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    couponInput: {
      flex: 1,
      height: 36,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 12,
      marginRight: 8,
      color: theme.colors.text,
      fontFamily: theme.fonts?.regular || 'System',
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      height: 36,
      borderRadius: theme.radius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    paymentOptionsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    paymentOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      marginVertical: 6,
    },
    paymentOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    paymentSheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    paymentSheetContent: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
    },
    paymentSheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    paymentSheetPriceBox: {
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    paymentMethodTabs: {
      flexDirection: 'row',
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    paymentMethodTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    paymentMethodTabActive: {
      borderBottomWidth: 2,
    },
    paymentInput: {
      height: 48,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 14,
      fontSize: 15,
      backgroundColor: theme.colors.background,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    summaryTitle: {
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
  });

export default ServiceBookingScreen;




/*
1.ServiceHeader.tsx - Beautiful service header with:

Floating card design with negative margin
Price badge with gradient
Duration badge
Professional shadows and styling
2.QuantitySelector.tsx - Smart quantity control with:

Animated count display with spring animation
Min/Max validation with disabled states
Responsive button sizing
Max quantity warning
3.BookingModeSelector.tsx - Mode selection with:

Two booking modes: "Book Now" & "Schedule Later"
Gradient active state
Icon support
Beautiful descriptions
4.ScheduleSelector.tsx - Date & time picker UI with:

Date and time selectors in one row
Smart date formatting ("Today", "Mar 15")
Visual confirmation box
Primary color indicators

5.ServiceDescription.tsx - Description display with:

HTML parsing and cleanup
Bullet point features with checkmarks
Beautiful feature cards
*/