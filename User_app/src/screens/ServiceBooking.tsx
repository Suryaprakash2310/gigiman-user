import { socket } from '@/src/socket/socket';
import { injectRazorpayData } from '@/src/utils/razorpayInjector';
import { razorpayHTML } from '@/src/utils/razorpayTemplate';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CryptoJS from 'crypto-js';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import apiClient from '@/src/api/client';
import AppButton from '@/src/components/ui/AppButton';
import AppHeader from '@/src/components/ui/AppHeader';
import AppText from '@/src/components/ui/AppText';
import CalendarModal from '@/src/components/ui/CalendarModal';
import DateTimePicker from '@react-native-community/datetimepicker';

import { CouponAPI } from '@/src/api/coupon.api';
import { ServiceAPI } from '@/src/api/service.api';
import { getAddressesAPI } from '@/src/api/auth';
import { useAuthContext } from '@/src/context/AuthContext';
import { useBooking } from '@/src/context/BookingContext';
import { useCartContext } from '@/src/context/CartContext';
import { useTheme } from '@/src/theme/useTheme';
import { BOOKING_TYPE } from '@/src/utils/enums/BookingType';
import { FEES } from '@/src/utils/enums/Fees';
import { getAddressFromCoords, getCurrentLocation } from '@/src/utils/location';

import BookingModeSelector from '@/src/components/booking/BookingModeSelector';
import QuantitySelector from '@/src/components/booking/QuantitySelector';
import { useRecurringStore, MOCK_SERVICES } from '@/src/store/recurringStore';
import ScheduleSelector from '@/src/components/booking/ScheduleSelector';
import ServiceDescription from '@/src/components/booking/ServiceDescription';
import ServiceHeader from '@/src/components/booking/ServiceHeader';
import { AppTabsParamList } from '@/src/navigation/AppStack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isComingSoon } from '@/src/utils/serviceStatus';

type Nav = BottomTabNavigationProp<AppTabsParamList, 'BookingTab'>;

interface Props {
  route?: {
    params?: {
      serviceCategoryId?: string;
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
  originalPrice?: number;
  offerPrice?: number;
  durationInMinutes: number;
  servicecategoryImage?: string;
  description?: string;
  domainService?: string;
  status?: string;
}

const { width } = Dimensions.get('window');

const ServiceBookingScreen: React.FC<Props> = ({ route }) => {
  const { serviceCategoryId, serviceData, fromMain, domainServiceId } = route?.params || {};
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { upsertBooking } = useBooking();
  const convenienceFee = FEES.CONVENIENCE_FEE;

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
  const [category, setCategory] = useState<ServiceCategory | null>(() => {
    if (serviceData) {
      return {
        _id: serviceData._id,
        serviceCategoryName: serviceData.serviceCategoryName || serviceData.name,
        price: serviceData.offerPrice != null ? serviceData.offerPrice : (serviceData.price || 0),
        originalPrice: serviceData.originalPrice || serviceData.price,
        offerPrice: serviceData.offerPrice || serviceData.price,
        durationInMinutes: serviceData.durationInMinutes || 60,
        description: serviceData.description,
        servicecategoryImage: serviceData.servicecategoryImage || serviceData.servicecategroyImage || serviceData.serviceImage,
        domainService: serviceData.domainService,
        status: serviceData.status,
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(!serviceData && !isCartCheckout);
  const [booking, setBooking] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [bookingMode, setBookingMode] = useState<'now' | 'schedule' | 'recurring'>('now');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string>("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [locatingAddress, setLocatingAddress] = useState(false);

  const isRegionAllowed = 
    user?.isRegionAllowed !== false && 
    user?.regionAllowed !== false && 
    selectedAddress?.isRegionAllowed !== false && 
    selectedAddress?.regionAllowed !== false;

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
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
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
    } else if (serviceCategoryId && serviceCategoryId !== 'undefined' && serviceCategoryId !== 'null' && serviceCategoryId !== 'cart') {
      loadService();
    } else if (serviceData && !category) {
      const formattedCategory: ServiceCategory = {
        _id: serviceData._id,
        serviceCategoryName: serviceData.serviceCategoryName || serviceData.name,
        price: serviceData.offerPrice != null ? serviceData.offerPrice : (serviceData.price || 0),
        originalPrice: serviceData.originalPrice || serviceData.price,
        offerPrice: serviceData.offerPrice || serviceData.price,
        durationInMinutes: serviceData.durationInMinutes || 60,
        description: serviceData.description,
        servicecategoryImage: serviceData.servicecategoryImage || serviceData.servicecategroyImage || serviceData.serviceImage,
        domainService: serviceData.domainService,
        status: serviceData.status,
      };
      setCategory(formattedCategory);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [serviceCategoryId, isCartCheckout, filteredCartItems, filteredCartTotalPrice, domainServiceId]);

  const loadSavedAddressesList = async () => {
    try {
      const raw = await AsyncStorage.getItem('gigiman_saved_addresses');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          setSavedAddresses(list);
        }
      }
      const res = await getAddressesAPI().catch(() => null);
      if (res?.data?.addresses && Array.isArray(res.data.addresses) && res.data.addresses.length > 0) {
        setSavedAddresses(res.data.addresses);
        await AsyncStorage.setItem('gigiman_saved_addresses', JSON.stringify(res.data.addresses));
      }
    } catch (e) {
      console.log('Error loading saved addresses:', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.selectedAddress) {
        setSelectedAddress(route.params.selectedAddress);
      }
      loadSavedAddressesList();
    }, [route?.params?.selectedAddress])
  );

  useEffect(() => {
    if (!route?.params?.selectedAddress) {
      loadDefaultAddress();
    }
  }, [route?.params?.selectedAddress]);

  const loadDefaultAddress = async () => {
    try {
      if (route?.params?.selectedAddress) return;
      const raw = await AsyncStorage.getItem('gigiman_saved_addresses');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          setSavedAddresses(list);
          const defaultAddress = list.find((a: any) => a.isDefault) || list[0];
          if (defaultAddress && (defaultAddress.line1 || defaultAddress.address) && defaultAddress.line1 !== "Current Location") {
            setSelectedAddress(defaultAddress);
            return;
          }
        }
      }
      // If no saved addresses, automatically resolve device GPS location
      try {
        setLocatingAddress(true);
        const location = await getCurrentLocation();
        const resolvedAddress = await getAddressFromCoords(location.latitude, location.longitude);
        setSelectedAddress((prev: any) => {
          if (prev && prev.flatNo) return prev;
          return {
            line1: resolvedAddress,
            address: resolvedAddress,
            area: resolvedAddress,
            latitude: location.latitude,
            longitude: location.longitude,
          };
        });
      } catch (e) {
        console.log('Silent location detect failed', e);
      } finally {
        setLocatingAddress(false);
      }
    } catch (err) {
      console.log('Failed loading address', err);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocatingAddress(true);
      const location = await getCurrentLocation();
      const resolvedAddress = await getAddressFromCoords(location.latitude, location.longitude);

      // Navigate to AddEditAddress to add mandatory Flat/House No, Building Name & optional fields
      navigation.navigate("AddEditAddress", {
        selectMode: true,
        initialLocation: {
          address: resolvedAddress,
          latitude: location.latitude,
          longitude: location.longitude,
        },
        serviceCategoryId: serviceCategoryId || category?._id,
        serviceData: category || serviceData,
        domainServiceId,
        fromMain,
      });
    } catch (err: any) {
      console.warn("Location Error:", err);
      Alert.alert("Location Error", err?.message || "Unable to get current location. Please ensure location permissions are enabled.");
    } finally {
      setLocatingAddress(false);
    }
  };

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddress(addr);
    setShowAddressModal(false);
  };

  const handleOpenAddAddress = () => {
    setShowAddressModal(false);
    navigation.navigate("AddEditAddress", {
      selectMode: true,
      serviceCategoryId: serviceCategoryId || category?._id,
      serviceData: category || serviceData,
      domainServiceId,
      fromMain,
    });
  };

  const handleEditAddressItem = (addr: any) => {
    setShowAddressModal(false);
    navigation.navigate("AddEditAddress", {
      selectMode: true,
      addressId: addr._id || addr.id,
      address: addr,
      initialLocation: {
        address: addr.line1 || addr.address,
        latitude: addr.latitude || addr.location?.coordinates?.[1],
        longitude: addr.longitude || addr.location?.coordinates?.[0],
      },
      serviceCategoryId: serviceCategoryId || category?._id,
      serviceData: category || serviceData,
      domainServiceId,
      fromMain,
    });
  };


  const loadService = useCallback(async () => {
    if (!serviceCategoryId || serviceCategoryId === 'undefined' || serviceCategoryId === 'null' || serviceCategoryId === 'cart') {
      return;
    }
    try {
      setLoading(true);
      const res = await ServiceAPI.getServiceCategoryByIdAPI(serviceCategoryId);
      if (res?.serviceCategory) {
        setCategory(res.serviceCategory);
      }
    } catch (err) {
      console.error('Load service error:', err);
      if (serviceData) {
        const formattedCategory: ServiceCategory = {
          _id: serviceData._id,
          serviceCategoryName: serviceData.serviceCategoryName || serviceData.name,
          price: serviceData.offerPrice != null ? serviceData.offerPrice : (serviceData.price || 0),
          originalPrice: serviceData.originalPrice || serviceData.price,
          offerPrice: serviceData.offerPrice || serviceData.price,
          durationInMinutes: serviceData.durationInMinutes || 60,
          description: serviceData.description,
          servicecategoryImage: serviceData.servicecategoryImage || serviceData.servicecategroyImage || serviceData.serviceImage,
          domainService: serviceData.domainService,
          status: serviceData.status,
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

  const resetPaymentFields = () => {
    setCurrentBookingId(null);
    setPaymentHtml(null);
    setPaying(false);
  };

  const handleCloseRazorpayModal = () => {
    Alert.alert(
      "Cancel Payment?",
      "Closing the payment screen will cancel your booking request.",
      [
        { text: "Continue Payment", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: () => {
            if (currentBookingId && socket && socket.connected) {
              socket.emit("user-cancel-booking", {
                bookingId: currentBookingId,
                cancelReason: "Payment cancelled by user",
              });
            }
            setShowWebViewModal(false);
            resetPaymentFields();
          }
        }
      ]
    );
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (!data.success) {
        Alert.alert("Payment Cancelled", data.reason === "dismissed" ? "Payment was cancelled by user" : "Payment failed");
        if (currentBookingId && socket && socket.connected) {
          socket.emit("user-cancel-booking", {
            bookingId: currentBookingId,
            cancelReason: "Payment cancelled by user",
          });
        }
        setShowWebViewModal(false);
        resetPaymentFields();
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
        const finalPriceWithoutFee = bookingPrice - discountAmount;
        const finalPrice = finalPriceWithoutFee + convenienceFee;
        const isScheduled = bookingMode === 'schedule';
        const scheduleDateTime = isScheduled && selectedDate && selectedTime
          ? new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            selectedTime.getHours(),
            selectedTime.getMinutes()
          )
          : null;

        upsertBooking({
          _id: currentBookingId!,
          serviceCategoryName: category?.serviceCategoryName || "Cart Checkout",
          address: selectedAddress?.line1 || "Current Location",
          status: isScheduled ? 'scheduled' : 'searching',
          totalPrice: finalPrice,
          isScheduled: isScheduled,
          ...(isScheduled && scheduleDateTime ? { scheduleDateTime: scheduleDateTime.toISOString() } : {}),
          paymentType,
          advanceAmount: paymentType === 'ADVANCE' ? Math.round(finalPriceWithoutFee * 0.18) + convenienceFee : finalPrice,
          remainingAmount: paymentType === 'ADVANCE' ? Math.round(finalPriceWithoutFee * 0.82) : 0,
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
        resetPaymentFields();

        if (isScheduled) {
          navigation.navigate("BookingTab", {
            screen: "BookingsMain",
            params: { activeTab: "upcoming" }
          } as any);
        } else {
          navigation.navigate('BookingTab', {
            screen: 'Searching',
            params: { bookingId: currentBookingId },
          } as any);
        }
      } else {
        throw new Error(successRes.data?.message || "Failed to confirm payment on backend");
      }
    } catch (err: any) {
      console.error('Error in handleWebViewMessage:', err);
      Alert.alert('Payment Error', err?.message || 'Failed to verify transaction');
      setShowWebViewModal(false);
      resetPaymentFields();
    }
  };

  const handleBookNow = useCallback(async () => {
    const isRegionAllowedLocal = 
      user?.isRegionAllowed !== false && 
      user?.regionAllowed !== false && 
      selectedAddress?.isRegionAllowed !== false && 
      selectedAddress?.regionAllowed !== false;

    if (!isRegionAllowedLocal) {
      Alert.alert('Booking Unavailable', 'This service is not available in your region.');
      return;
    }

    if (isComingSoon(category?.status)) {
      Alert.alert('Coming Soon', 'This service is coming soon and cannot be booked yet.');
      return;
    }

    if (!user?._id) {
      Alert.alert('Login Required', 'Please login to book a service');
      return;
    }

    if (!category) {
      Alert.alert('Service Error', 'Service details not found');
      return;
    }

    if (bookingMode === 'schedule') {
      if (!selectedDate || !selectedTime) {
        Alert.alert(
          'Schedule Required',
          'Please select both date and time for scheduled booking'
        );
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const chosenDate = new Date(selectedDate);
      chosenDate.setHours(0, 0, 0, 0);

      if (chosenDate.getTime() <= today.getTime()) {
        Alert.alert(
          'Invalid Date',
          'Scheduled bookings must be booked at least one day (24 hours) in advance. Please select tomorrow or a later date.'
        );
        return;
      }
    }

    if (!selectedAddress || !selectedAddress.flatNo || !selectedAddress.apartmentName) {
      Alert.alert(
        "Address Details Required",
        "Please add your House/Flat No. and Building Name to complete your booking address.",
        [
          {
            text: "Add Details",
            onPress: () => {
              navigation.navigate("AddEditAddress", {
                selectMode: true,
                address: selectedAddress,
                initialLocation: selectedAddress ? {
                  address: selectedAddress.line1 || selectedAddress.address,
                  latitude: selectedAddress.latitude,
                  longitude: selectedAddress.longitude,
                } : undefined,
                serviceCategoryId: serviceCategoryId || category?._id,
                serviceData: category || serviceData,
                domainServiceId,
                fromMain,
              });
            }
          },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    try {
      setBooking(true);

      const coordinates = [
        selectedAddress.longitude,
        selectedAddress.latitude,
      ];

      const addressParts = [
        selectedAddress.flatNo ? `Flat/House ${selectedAddress.flatNo}` : null,
        selectedAddress.floor ? `Floor ${selectedAddress.floor}` : null,
        selectedAddress.apartmentName || null,
        selectedAddress.landmark ? `Near ${selectedAddress.landmark}` : null,
        selectedAddress.area || selectedAddress.line1 || selectedAddress.address,
      ].filter(Boolean);

      const addressText = addressParts.length > 0 ? addressParts.join(", ") : (selectedAddress.line1 || selectedAddress.address);

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
        addressTitle: selectedAddress?.title || "",
        addressDetails: selectedAddress ? {
          flatNo: selectedAddress.flatNo || "",
          floor: selectedAddress.floor || "",
          apartmentName: selectedAddress.apartmentName || "",
          landmark: selectedAddress.landmark || "",
          area: selectedAddress.area || selectedAddress.line1 || selectedAddress.address || "",
          receiverPhone: selectedAddress.receiverPhone || "",
          receiverName: selectedAddress.receiverName || "",
          title: selectedAddress.title || "",
        } : undefined,
        coordinates: coordinates,
        paymentType: paymentType,
        convenienceFee: convenienceFee,
        slotId: selectedSlotId || undefined,
        slotLabel: selectedSlotLabel || undefined,
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

      setCurrentBookingId(bookingId);

      // Directly create Razorpay order and open checkout
      setPaying(true);
      const orderRes = await apiClient.post(`/booking/createorder/${bookingId}`, { paymentType, convenienceFee });
      const { keyId, orderId, amount } = orderRes.data;

      const html = injectRazorpayData({
        htmlTemplate: razorpayHTML,
        keyId,
        amountPaise: amount,
        orderId,
        serviceName: isCartCheckout ? "Cart Checkout" : category.serviceCategoryName,
        itemTotal: bookingPrice,
        convenienceFee: convenienceFee,
        discountAmount: discountAmount,
        paymentType: paymentType,
        description: `${isCartCheckout ? "Cart Booking" : category.serviceCategoryName} (Convenience Fee: ₹${convenienceFee})`,
        prefillName: user?.fullName,
        prefillEmail: user?.email,
        prefillContact: user?.phone,
      });

      setPaymentHtml(html);
      setShowWebViewModal(true);
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
      setPaying(false);
    } finally {
      setBooking(false);
    }
  }, [user, category, bookingMode, selectedDate, selectedTime, quantity, appliedCoupon, navigation, upsertBooking, paymentType, selectedAddress]);

  const handleBack = useCallback(() => {

    navigation.goBack();

  }, [fromMain, navigation]);

  // Loading state
  if (loading) {
    return (
      <View
        style={[
          styles.safe,
          { paddingTop: Platform.OS === 'android' ? insets.top : 0 },
        ]}
      >
        <AppHeader showBack onBackPress={handleBack} title="Service Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText size="body" color="textMuted" style={styles.loadingText}>
            Loading service details...
          </AppText>
        </View>
      </View>
    );
  }

  // Error state
  if (!category) {
    return (
      <View
        style={[
          styles.safe,
          { paddingTop: Platform.OS === 'android' ? insets.top : 0 },
        ]}
      >
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
      </View>
    );
  }

  const imageSource = category.servicecategoryImage
    ? { uri: category.servicecategoryImage }
    : require('../../assets/images/SampleService.png');

  const totalPrice = isCartCheckout ? filteredCartTotalPrice : (category.price * quantity);
  const totalOriginalPrice = isCartCheckout
    ? filteredCartItems.reduce((sum, item) => {
        const itemOrig = (item.originalPrice != null && Number(item.originalPrice) > Number(item.price))
          ? Number(item.originalPrice)
          : Math.round((Number(item.price) * 1.35) / 10) * 10;
        return sum + (itemOrig * item.quantity);
      }, 0)
    : ((category.originalPrice != null && Number(category.originalPrice) > Number(category.price))
        ? Number(category.originalPrice) * quantity
        : Math.round((Number(category.price) * 1.35) / 10) * 10 * quantity);

  return (
    <View
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
        {isComingSoon(category?.status) && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{
              backgroundColor: '#FFF7ED',
              borderColor: '#FFEDD5',
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Ionicons name="time-outline" size={24} color="#EA580C" />
            <View style={{ flex: 1 }}>
              <AppText weight="bold" style={{ color: '#EA580C' }}>
                Coming Soon
              </AppText>
              <AppText size="small" style={{ color: '#C2410C', marginTop: 2 }}>
                This service is coming soon and is currently unavailable for booking.
              </AppText>
            </View>
          </Animated.View>
        )}

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
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText weight="bold" style={{ color: theme.colors.text }}>
                    ₹{item.price * item.quantity}
                  </AppText>
                  {item.originalPrice != null && Number(item.originalPrice) > Number(item.price) && (
                    <AppText size="caption" color="textMuted" style={{ textDecorationLine: 'line-through' }}>
                      ₹{Number(item.originalPrice) * item.quantity}
                    </AppText>
                  )}
                </View>
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
                originalPrice={category.originalPrice}
                offerPrice={category.offerPrice}
                duration={category.durationInMinutes}
              />
            </Animated.View>

            {/* Special Offer Alert Banner */}
            {category && (
              (() => {
                const currentPrice = category.offerPrice != null ? Number(category.offerPrice) : Number(category.price || 0);
                const origPrice = (category.originalPrice != null && Number(category.originalPrice) > currentPrice)
                  ? Number(category.originalPrice)
                  : Math.round((currentPrice * 1.35) / 10) * 10;
                const hasDiscount = origPrice > currentPrice;
                const discountPercent = hasDiscount ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0;

                if (!hasDiscount) return null;

                return (
                  <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.offerBannerCard}>
                    <View style={styles.offerBannerLeft}>
                      <Ionicons name="pricetag" size={20} color="#16A34A" />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <AppText weight="bold" style={{ color: "#166534", fontSize: 13 }}>
                          Special Offer Available!
                        </AppText>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                          <AppText size="small" weight="bold" style={{ color: "#15803D" }}>
                            Offer: ₹{currentPrice}
                          </AppText>
                          <AppText size="small" style={{ color: "#86EFAC", textDecorationLine: "line-through" }}>
                            Original: ₹{origPrice}
                          </AppText>
                        </View>
                      </View>
                    </View>
                    <View style={styles.offerBannerBadge}>
                      <AppText weight="bold" style={{ color: "#FFFFFF", fontSize: 11 }}>
                        {discountPercent}% OFF
                      </AppText>
                    </View>
                  </Animated.View>
                );
              })()
            )}

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

        {/* SERVICE LOCATION SELECTOR CARD */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={() => setShowAddressModal(true)}
          activeOpacity={0.88}
        >
          <View style={[styles.locationIconCircle, { backgroundColor: theme.colors.primary + '18' }]}>
            <Ionicons name="location-sharp" size={20} color={theme.colors.primary} />
          </View>

          <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText weight="bold" style={{ fontSize: 14 }}>Service Location</AppText>
              {selectedAddress?.title ? (
                <View style={{ backgroundColor: theme.colors.primary + '20', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                  <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 10, textTransform: 'uppercase' }}>
                    {selectedAddress.title}
                  </AppText>
                </View>
              ) : null}
            </View>

            {locatingAddress ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <AppText size="small" style={{ color: theme.colors.primary }}>
                  Detecting current location...
                </AppText>
              </View>
            ) : selectedAddress ? (
              <View style={{ marginTop: 3 }}>
                {selectedAddress.flatNo || selectedAddress.apartmentName ? (
                  <>
                    <AppText size="small" weight="bold" numberOfLines={1} style={{ color: theme.colors.text }}>
                      {[selectedAddress.flatNo ? `Flat/House ${selectedAddress.flatNo}` : '', selectedAddress.apartmentName].filter(Boolean).join(', ')}
                    </AppText>
                    <AppText size="caption" color="textMuted" numberOfLines={1} style={{ marginTop: 1 }}>
                      {selectedAddress.landmark ? `Near ${selectedAddress.landmark}, ` : ''}{selectedAddress.area || selectedAddress.line1 || selectedAddress.address}
                    </AppText>
                  </>
                ) : (
                  <>
                    <AppText size="small" color="textMuted" numberOfLines={1}>
                      {selectedAddress.line1 || selectedAddress.address || "Current Location"}
                    </AppText>
                    <AppText size="caption" style={{ color: '#EA580C', fontWeight: '600', marginTop: 2 }}>
                      ⚠️ Tap to add Flat & Building number
                    </AppText>
                  </>
                )}
              </View>
            ) : (
              <AppText size="small" color="textMuted" numberOfLines={1} style={{ marginTop: 2 }}>
                Tap to select or add address
              </AppText>
            )}
          </View>

          <View style={styles.changeActionBtn}>
            <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 13 }}>
              Change
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </View>
        </TouchableOpacity>


        {/* Booking Mode Selector */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <BookingModeSelector
            selectedMode={bookingMode}
            onModeChange={(mode: 'now' | 'schedule' | 'recurring') => {
              if (mode === 'recurring') {
                const targetService: any = category || serviceData;
                const actualPrice = targetService?.offerPrice != null 
                  ? Number(targetService.offerPrice)
                  : (targetService?.price != null ? Number(targetService.price) : 499);
                
                const serviceToUse = {
                  id: targetService?._id || targetService?.id || serviceCategoryId || '1',
                  name: targetService?.serviceCategoryName || targetService?.name || 'Service',
                  icon: 'sparkles-outline',
                  description: targetService?.description || '',
                  pricePerVisit: actualPrice,
                };
                
                const store = useRecurringStore.getState();
                store.resetDraft();
                store.updateDraft({ service: serviceToUse });
                
                navigation.navigate('RecurringBooking', {
                  fromServiceBooking: true,
                  serviceCategoryId: serviceCategoryId || targetService?._id,
                  serviceData: {
                    ...targetService,
                    _id: serviceToUse.id,
                    serviceCategoryName: serviceToUse.name,
                    price: actualPrice,
                    offerPrice: actualPrice,
                    description: serviceToUse.description,
                  },
                  domainServiceId,
                  fromMain,
                });
              } else {
                setBookingMode(mode);
                setSelectedDate(null);
                setSelectedTime(null);
              }
            }}
          />
        </Animated.View>

        {/* Schedule Selector - Conditional */}
        {(bookingMode === 'schedule' || bookingMode === 'now') && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <ScheduleSelector
              isInstant={bookingMode === 'now'}
              serviceCategoryId={serviceCategoryId || category?._id}
              domainServiceId={domainServiceId || (typeof category?.domainService === 'string' ? category.domainService : (category?.domainService as any)?._id?.toString() || '')}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDatePress={() => setShowCalendar(true)}
              onTimePress={() => setShowTimePicker(true)}
              onSelectSlot={(date: Date, time: Date, slotId: string, slotLabel: string) => {
                setSelectedDate(date);
                setSelectedTime(time);
                if (slotId) setSelectedSlotId(slotId);
                if (slotLabel) setSelectedSlotLabel(slotLabel);
              }}
            />
          </Animated.View>
        )}

        {/* Payment Options Section */}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppText size="small" color="textMuted">Pay ₹{totalPrice - discountAmount} online now</AppText>
                {totalOriginalPrice > (totalPrice - discountAmount) && (
                  <AppText size="caption" color="textMuted" style={{ textDecorationLine: 'line-through' }}>
                    ₹{totalOriginalPrice}
                  </AppText>
                )}
              </View>
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
                Pay ₹{Math.round((totalPrice - discountAmount) * 0.18)} now, remaining ₹{Math.round((totalPrice - discountAmount) * 0.82) + convenienceFee} collected after completion
              </AppText>
            </View>
          </TouchableOpacity>
        </Animated.View>



        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>

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
              {paymentType === 'ADVANCE' ? 'Advance to Pay:' : 'Total:'}
            </AppText>
            <View style={{ alignItems: 'flex-end' }}>
              {discountAmount > 0 ? (
                <AppText
                  size="small"
                  style={{ color: theme.colors.textMuted, textDecorationLine: 'line-through' }}
                >
                  ₹{totalPrice}
                </AppText>
              ) : totalOriginalPrice > totalPrice ? (
                <AppText
                  size="small"
                  style={{ color: theme.colors.textMuted, textDecorationLine: 'line-through' }}
                >
                  ₹{totalOriginalPrice}
                </AppText>
              ) : null}
              <AppText
                weight="bold"
                size="h2"
                style={{ color: theme.colors.primary }}
              >
                ₹{paymentType === 'ADVANCE' ? Math.round((totalPrice - discountAmount) * 0.18) : (totalPrice - discountAmount)}
              </AppText>
            </View>
          </View>

          {isRegionAllowed ? (
            <AppButton
              title={
                isComingSoon(category?.status)
                  ? 'Coming Soon - Booking Unavailable'
                  : (booking || paying)
                    ? 'Processing Payment...'
                    : bookingMode === 'schedule'
                      ? (paymentType === 'ADVANCE' ? 'Pay Advance & Schedule' : 'Pay Full & Schedule')
                      : (paymentType === 'ADVANCE' ? 'Pay Advance & Book' : 'Pay Full & Book')
              }
              disabled={isComingSoon(category?.status) || booking || paying || (bookingMode === 'schedule' && (!selectedDate || !selectedTime))}
              onPress={handleBookNow}
              loading={booking || paying}
              variant="primary"
              style={styles.bookButton}
            />
          ) : (
            <View style={styles.unavailableContainer}>
              <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger || '#FF3B30'} style={{ marginRight: 6 }} />
              <AppText size="small" color="danger" weight="semibold">
                Unavailable in your region
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <CalendarModal
        visible={showCalendar}
        selectedDate={selectedDate}
        onClose={() => setShowCalendar(false)}
        onSelect={setSelectedDate}
        minDate={(() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          return d;
        })()}
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

      {/* Local WebView Modal for Razorpay Checkout */}
      <Modal
        visible={showWebViewModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseRazorpayModal}
      >
        <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : (insets.top || 16) + 8,
            paddingBottom: 14,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0'
          }}>
            <AppText weight="bold" size="body" style={{ color: '#0F172A', fontSize: 16 }}>Secure Razorpay Checkout</AppText>
            <TouchableOpacity
              onPress={handleCloseRazorpayModal}
              style={{ padding: 6 }}
            >
              <Ionicons name="close" size={24} color="#0F172A" />
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
                <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: '#ffffff' }}>
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* ADDRESS SELECTION BOTTOM SHEET MODAL */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddressModal(false)}
          />

          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <AppText weight="bold" style={styles.modalHeaderTitle}>
                  Select Service Address
                </AppText>
                <AppText size="caption" color="textMuted" style={{ marginTop: 2 }}>
                  Where should our professional arrive?
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowAddressModal(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  setShowAddressModal(false);
                  handleUseCurrentLocation();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: "#ECFDF5" }]}>
                  <Ionicons name="navigate" size={18} color="#059669" />
                </View>
                <AppText weight="semibold" style={styles.quickActionText}>
                  Use Current GPS
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleOpenAddAddress}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: "#EFF6FF" }]}>
                  <Ionicons name="add" size={20} color="#2563EB" />
                </View>
                <AppText weight="semibold" style={styles.quickActionText}>
                  Add New Address
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Saved Addresses List Header */}
            <AppText weight="bold" size="small" color="textMuted" style={styles.savedAddressesTitle}>
              Saved Addresses
            </AppText>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {savedAddresses.length === 0 ? (
                <View style={styles.emptyAddressBox}>
                  <Ionicons name="location-outline" size={36} color="#94A3B8" />
                  <AppText size="small" color="textMuted" style={{ marginTop: 8, textAlign: "center" }}>
                    No saved addresses found. You can add a new address or use current GPS location above.
                  </AppText>
                </View>
              ) : (
                savedAddresses.map((addr: any, idx: number) => {
                  const isSelected =
                    (selectedAddress?._id && (selectedAddress._id === addr._id || selectedAddress._id === addr.id)) ||
                    (selectedAddress?.id && (selectedAddress.id === addr.id || selectedAddress.id === addr._id)) ||
                    (selectedAddress?.line1 && selectedAddress.line1 === (addr.line1 || addr.address));

                  const titleTag = addr.title || (idx === 0 ? "Home" : "Address");

                  return (
                    <TouchableOpacity
                      key={addr._id || addr.id || idx}
                      style={[
                        styles.addressItemCard,
                        isSelected && styles.addressItemCardActive,
                      ]}
                      onPress={() => handleSelectSavedAddress(addr)}
                      activeOpacity={0.8}
                    >
                      <View style={{ marginRight: 12, marginTop: 2 }}>
                        <Ionicons
                          name={isSelected ? "radio-button-on" : "radio-button-off"}
                          size={20}
                          color={isSelected ? theme.colors.primary : "#94A3B8"}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <AppText weight="bold" style={{ fontSize: 14, color: isSelected ? theme.colors.primary : "#0F172A" }}>
                            {titleTag}
                          </AppText>
                          {addr.isDefault && (
                            <View style={styles.defaultChip}>
                              <AppText style={styles.defaultChipText}>Default</AppText>
                            </View>
                          )}
                        </View>

                        {addr.flatNo || addr.apartmentName ? (
                          <AppText size="small" weight="medium" style={{ color: "#334155", marginTop: 2 }} numberOfLines={1}>
                            {[addr.flatNo ? `Flat ${addr.flatNo}` : '', addr.apartmentName].filter(Boolean).join(', ')}
                          </AppText>
                        ) : null}

                        <AppText size="caption" color="textMuted" numberOfLines={2} style={{ marginTop: 2 }}>
                          {addr.landmark ? `Near ${addr.landmark}, ` : ''}{addr.area || addr.line1 || addr.address}
                        </AppText>
                      </View>

                      <TouchableOpacity
                        style={styles.addressEditBtn}
                        onPress={() => handleEditAddressItem(addr)}
                      >
                        <Ionicons name="pencil" size={16} color="#64748B" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
      paddingBottom: 24,
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
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: 20,
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
      marginTop: 14,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    locationIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    changeActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.primary + "15",
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      gap: 3,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalSheet: {
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingHorizontal: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9",
    },
    modalHeaderTitle: {
      fontSize: 18,
      color: "#0F172A",
    },
    modalCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#F1F5F9",
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
    },
    quickActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F8FAFC",
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      gap: 8,
    },
    quickActionIconBg: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionText: {
      fontSize: 12,
      color: "#1E293B",
      flex: 1,
    },
    savedAddressesTitle: {
      marginTop: 16,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    emptyAddressBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 28,
      paddingHorizontal: 16,
    },
    addressItemCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      backgroundColor: "#F8FAFC",
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "#E2E8F0",
      marginBottom: 10,
    },
    addressItemCardActive: {
      borderColor: theme.colors.primary || "#047857",
      backgroundColor: "#F0FDF4",
    },
    defaultChip: {
      backgroundColor: "#ECFDF5",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#A7F3D0",
    },
    defaultChipText: {
      fontSize: 10,
      color: "#059669",
      fontWeight: "700",
    },
    addressEditBtn: {
      padding: 6,
      borderRadius: 8,
      marginLeft: 8,
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
    couponSectionApplied: {
      backgroundColor: "#FFFFFF",
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.success,
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
    billDetailsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 4,
    },
    unavailableContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.colors.danger || '#FF3B30'}15`,
      borderRadius: theme.radius.lg,
      paddingVertical: 12,
      paddingHorizontal: 16,
      width: '100%',
    },
    paymentSheetBillRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 4,
      width: '100%',
    },
    cancelConfirmOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    cancelConfirmBox: {
      width: '100%',
      borderRadius: 20,
      padding: 28,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
    },
    cancelConfirmIconWrap: {
      marginBottom: 14,
    },
    cancelConfirmButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    cancelConfirmBtn: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelConfirmBtnOutline: {
      borderWidth: 1.5,
      backgroundColor: 'transparent',
    },
    cancelConfirmBtnFill: {
      borderWidth: 0,
    },
    offerBannerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#DCFCE7',
      borderColor: '#86EFAC',
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: theme.spacing.lg || 16,
      marginBottom: 16,
    },
    offerBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    offerBannerBadge: {
      backgroundColor: '#16A34A',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
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