import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
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
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import apiClient from '@/src/api/client';
import AppButton from '@/src/components/ui/AppButton';
import AppHeader from '@/src/components/ui/AppHeader';
import AppText from '@/src/components/ui/AppText';
import CalendarModal from '@/src/components/ui/CalendarModal';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ServiceAPI } from '@/src/api/service.api';
import { useAuthContext } from '@/src/context/AuthContext';
import { useBooking } from '@/src/context/BookingContext';
import { useTheme } from '@/src/theme/useTheme';
import { BOOKING_TYPE } from '@/src/utils/enums/BookingType';
import { getCurrentLocation } from '@/src/utils/location';

import BookingModeSelector from '@/src/components/booking/BookingModeSelector';
import QuantitySelector from '@/src/components/booking/QuantitySelector';
import ScheduleSelector from '@/src/components/booking/ScheduleSelector';
import ServiceDescription from '@/src/components/booking/ServiceDescription';
import ServiceHeader from '@/src/components/booking/ServiceHeader';
import { AppTabsParamList } from '@/src/navigation/AppStack';

type Nav = BottomTabNavigationProp<AppTabsParamList, 'BookingTab'>;

interface Props {
  route: {
    params: {
      serviceCategoryId: string;
      serviceData?: any;
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
  const { serviceCategoryId, serviceData } = route.params;
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { upsertBooking } = useBooking();

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

  // Load service on mount
  useEffect(() => {
    loadService();
  }, [serviceCategoryId]);

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

      const location = await getCurrentLocation();
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
        serviceCategoryName: category.serviceCategoryName,
        domainService: category.domainService,
        address: user.address ?? 'Saved address',
        coordinates: [location.longitude, location.latitude],
        serviceCount: quantity,
      };

      if (scheduleDateTime) {
        payload.isScheduled = true;
        payload.scheduleDateTime = scheduleDateTime;
        // payload.status = "SCHEDULED";
        // payload.assignmentStatus = "SCHEDULED";
        payload.bookingType = BOOKING_TYPE.SCHEDULED;
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

      if (scheduleDateTime) {
        upsertBooking({
          _id: bookingId,
          serviceCategoryName: category.serviceCategoryName,
          address: payload.address,
          totalPrice: category.price * quantity,
          status: "scheduled",
          isScheduled: true,
          scheduleDateTime: scheduleDateTime.toISOString(),
        });

        navigation.navigate("BookingTab", {
          screen: "BookingsMain",
        } as any);
      } else {
        upsertBooking({
          _id: bookingId,
          serviceCategoryName: category.serviceCategoryName,
          address: payload.address,
          status: 'searching',
          totalPrice: category.price * quantity,
          isScheduled: false,
        });

        navigation.navigate('BookingTab', {
          screen: 'Searching',
          params: { bookingId},
        } as any);
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      Alert.alert(
        'Booking Failed',
        err?.response?.data?.message || 'Please try again'
      );
    } finally {
      setBooking(false);
    }
  }, [user, category, bookingMode, selectedDate, selectedTime, quantity, navigation, upsertBooking]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader showBack title="Service Details" />
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
        <AppHeader showBack title="Service Details" />
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

  const totalPrice = category.price * quantity;

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { paddingTop: Platform.OS === 'android' ? insets.top : 0 },
      ]}
    >
      <AppHeader showBack title="Service Details" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.priceDisplay}>
          <AppText size="body" color="textMuted">
            Total:
          </AppText>
          <AppText
            weight="bold"
            size="h2"
            style={{ color: theme.colors.primary }}
          >
            ₹{totalPrice}
          </AppText>
        </View>

        <AppButton
          title={
            booking
              ? 'Booking...'
              : bookingMode === 'schedule'
                ? 'Schedule Service'
                : 'Book Now'
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