// src/screens/recurring/RecurringBooking.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Switch, StatusBar, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AppText from '../../components/ui/AppText';
import { useRecurringStore } from '../../store/recurringStore';
import PrimaryButton from '../../components/recurring/PrimaryButton';
import CalendarModal from '../../components/ui/CalendarModal';
import apiClient from '@/src/api/client';
import { useAuthContext } from '@/src/context/AuthContext';
import { injectRazorpayData } from '@/src/utils/razorpayInjector';
import { razorpayHTML } from '@/src/utils/razorpayTemplate';
import { useTheme } from '../../theme/useTheme';

export default function RecurringBooking() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editPlanId = route.params?.editPlanId;
  const primaryColor = theme.colors.primary || '#f97316';

  const { draft, updateDraft, createPlan, editPlan, resetDraft, plans } = useRecurringStore();
  const service = draft.service || plans.find(p => p.id === editPlanId)?.service || {
    id: '1',
    name: 'Home Cleaning',
    icon: 'home-outline',
    description: 'Complete dust & mop of all rooms.',
    pricePerVisit: 499,
  };

  // State matching screenshot fields
  // State matching screenshot fields
  const [frequency, setFrequency] = useState<'weekly' | 'every-2-weeks' | 'monthly' | 'custom'>('weekly');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Sat']);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(1);
  const [customInterval, setCustomInterval] = useState<number>(2);
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [timeSlot, setTimeSlot] = useState<string>('10 AM-12 PM');
  const [startDate, setStartDate] = useState<string>('08 Aug 2026 (Saturday)');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showEndCalendar, setShowEndCalendar] = useState<boolean>(false);
  const [endOption, setEndOption] = useState<'never' | '3' | '6' | '12' | 'custom'>('never');
  const [customEndDate, setCustomEndDate] = useState<string>('31 Dec 2026');
  const [paymentOption, setPaymentOption] = useState<'autopay' | 'subscription'>('autopay');
  const [cleanerPreference, setCleanerPreference] = useState<'same' | 'any'>('same');
  
  // Reminders checkboxes
  const [notify1Day, setNotify1Day] = useState<boolean>(true);
  const [notify1Hour, setNotify1Hour] = useState<boolean>(true);

  // Razorpay WebView Payment Integration States
  const { user } = useAuthContext();
  const [showWebViewModal, setShowWebViewModal] = useState<boolean>(false);
  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [paying, setPaying] = useState<boolean>(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  // Initialize draft inputs
  useEffect(() => {
    if (editPlanId) {
      const plan = plans.find(p => p.id === editPlanId);
      if (plan) {
        setFrequency(plan.frequency);
        setSelectedDays(plan.schedule.weekdays || ['Sat']);
        setSelectedMonthDay(plan.schedule.monthlyDay || 1);
        setCustomInterval(plan.schedule.customInterval || 2);
        setCustomUnit(plan.schedule.customUnit || 'weeks');
        setTimeSlot(plan.schedule.time || '10 AM-12 PM');
        setStartDate(plan.schedule.startDate || '08 Aug 2026 (Saturday)');
        setPaymentOption(plan.paymentMethod === 'razorpay' ? 'subscription' : 'autopay');
        setCleanerPreference(plan.cleanerPreference === 'same-cleaner' ? 'same' : 'any');
      }
    }
  }, [editPlanId]);

  // Pricing calculations: 10% discount on recurring plans
  const basePrice = service.pricePerVisit;
  const discountedPrice = Math.round(basePrice * 0.9);
  const discountSaved = basePrice - discountedPrice;
  
  const getVisitsCount = () => {
    if (frequency === 'weekly') return selectedDays.length * 4;
    if (frequency === 'every-2-weeks') return selectedDays.length * 2;
    if (frequency === 'monthly') return 1;
    if (frequency === 'custom') {
      if (customUnit === 'days') {
        return Math.max(1, Math.round(30 / customInterval));
      }
      if (customUnit === 'weeks') {
        return Math.max(1, Math.round((selectedDays.length * 4) / customInterval));
      }
      if (customUnit === 'months') {
        return Math.max(1, Math.round(1 / customInterval));
      }
    }
    return 4; // custom default
  };
  
  const visitsPerMonth = getVisitsCount();
  const baseMonthlyTotal = basePrice * visitsPerMonth;
  const discountedMonthlyTotal = discountedPrice * visitsPerMonth;

  const handleWebViewMessage = async (event: any) => {
    try {
      const parsedData = JSON.parse(event.nativeEvent.data);
      if (!parsedData.success) {
        throw new Error(parsedData.reason || "Payment was cancelled or failed");
      }

      setPaying(true);

      // Verify the payment details on the backend
      const successRes = await apiClient.post('/recurring/payment/verify', {
        planId: currentPlanId,
        razorpayPaymentId: parsedData.razorpay_payment_id,
        razorpayOrderId: parsedData.razorpay_order_id,
        razorpaySubscriptionId: parsedData.razorpay_subscription_id || null,
        razorpaySignature: parsedData.razorpay_signature,
      });

      if (successRes.data?.success) {
        setShowWebViewModal(false);
        setPaymentHtml(null);
        setPaying(false);
        // Refresh plans list
        await useRecurringStore.getState().fetchPlans();
        const fromServiceBooking = route.params?.fromServiceBooking ?? false;
        navigation.navigate('Success', { isEdit: false, fromServiceBooking });
      } else {
        throw new Error(successRes.data?.message || "Failed to verify transaction on backend");
      }
    } catch (err: any) {
      console.error('Error in handleWebViewMessage:', err);
      Alert.alert('Payment Error', err?.message || 'Failed to verify transaction');
      setShowWebViewModal(false);
      setPaymentHtml(null);
      setPaying(false);
    }
  };

  const handleConfirm = async () => {
    const scheduleData = {
      weekdays: (frequency === 'weekly' || frequency === 'every-2-weeks' || (frequency === 'custom' && customUnit === 'weeks')) ? selectedDays : [],
      time: timeSlot,
      startDate: startDate,
      isNoEndDate: endOption === 'never',
      endDate: endOption === 'custom' ? customEndDate : `${endOption} Cleanings`,
      monthlyDay: frequency === 'monthly' ? selectedMonthDay : ((frequency === 'custom' && customUnit === 'months') ? selectedMonthDay : null),
      customInterval: frequency === 'custom' ? customInterval : null,
      customUnit: frequency === 'custom' ? customUnit : null,
    };

    const finalDraft = {
      service: {
        id: service.id || service._id || '1',
        name: service.name,
        icon: service.icon || 'home-outline'
      },
      frequency,
      schedule: scheduleData,
      cleanerPreference: cleanerPreference === 'same' ? 'same-cleaner' as const : 'best-available' as const,
      paymentMethod: paymentOption === 'subscription' ? 'razorpay' as const : 'upi' as const,
      pricePerVisit: discountedPrice,
      estimatedMonthlyCost: discountedMonthlyTotal,
      reminders: {
        notify1Day,
        notify1Hour
      }
    };

    updateDraft(finalDraft);

    const fromServiceBooking = route.params?.fromServiceBooking ?? false;

    try {
      if (editPlanId) {
        await editPlan(editPlanId, finalDraft);
        resetDraft();
        navigation.navigate('Success', { isEdit: true, fromServiceBooking });
      } else {
        setPaying(true);
        // 1. Create plan on backend
        const newPlan = await createPlan();
        if (!newPlan || (!newPlan._id && !newPlan.id)) {
          throw new Error("Failed to create plan on backend");
        }

        const planId = newPlan._id || newPlan.id;
        setCurrentPlanId(planId);

        // 2. Initiate payment session
        const paySession = await apiClient.post(`/recurring/payment/initiate/${planId}`);
        const { keyId, amount, orderId, subscriptionId } = paySession.data;

        // 3. Inject details into Razorpay Template
        let html = injectRazorpayData({
          htmlTemplate: razorpayHTML,
          keyId,
          amountPaise: amount,
          orderId: orderId || "",
          prefillName: user?.fullName,
          prefillEmail: user?.email,
          prefillContact: user?.phone,
        });

        if (subscriptionId) {
          html = html.replace(`order_id: "${orderId || ""}"`, `subscription_id: "${subscriptionId}"`);
        }

        setPaymentHtml(html);
        setShowWebViewModal(true);
      }
    } catch (err: any) {
      console.error('Checkout / Payment failed:', err);
      Alert.alert(
        'Payment Failed',
        err?.response?.data?.message || err.message || 'Payment initiation failed. Please try again.'
      );
      setPaying(false);
    }
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = ['8-10 AM', '10 AM-12 PM', '12-2 PM', '2-4 PM', '4-6 PM'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <AppText weight="bold" style={styles.headerTitle}>
            Recurring Booking
          </AppText>
          <AppText style={styles.headerSubtitle}>
            Book once, clean automatically
          </AppText>
        </View>
        
        <View style={styles.badgeDiscount}>
          <Ionicons name="pricetag" size={12} color="#0F6A4B" style={{ marginRight: 4 }} />
          <AppText weight="bold" style={styles.badgeDiscountText}>Save up to 10%</AppText>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainContainer}>
          {/* Form Side */}
          <View style={styles.formContainer}>
            
            {/* Step 1: Repeat Every */}
            <View style={styles.stepSection}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepIndicator}>
                  <AppText weight="bold" style={styles.stepNum}>1</AppText>
                </View>
                <AppText weight="bold" style={styles.stepTitle}>Repeat Every</AppText>
              </View>
              
              <View style={styles.frequencyRow}>
                {[
                  { id: 'weekly', label: 'Every Week' },
                  { id: 'every-2-weeks', label: 'Every 2 Weeks' },
                  { id: 'monthly', label: 'Every Month' },
                  { id: 'custom', label: 'Custom' }
                ].map((item) => {
                  const isActive = frequency === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setFrequency(item.id as any)}
                      style={[styles.freqChip, isActive && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                    >
                      <AppText weight="semibold" style={[styles.freqChipText, isActive && styles.freqChipTextActive]}>
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2: Select Day & Repeat Rules */}
            <View style={styles.stepSection}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepIndicator}>
                  <AppText weight="bold" style={styles.stepNum}>2</AppText>
                </View>
                <AppText weight="bold" style={styles.stepTitle}>
                  {frequency === 'monthly' ? 'Select Day of the Month' : (frequency === 'custom' ? 'Custom Repeat Rules' : 'Select Day(s)')}
                </AppText>
              </View>

              {/* A. Weekly or Every 2 Weeks: Multi-Select Weekdays */}
              {(frequency === 'weekly' || frequency === 'every-2-weeks') && (
                <View>
                  <AppText style={styles.stepSubtitleText}>
                    Choose which days of the week the cleaning should repeat on:
                  </AppText>
                  <View style={styles.daysRow}>
                    {daysOfWeek.map((day) => {
                      const isActive = selectedDays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => {
                            if (selectedDays.includes(day)) {
                              if (selectedDays.length > 1) {
                                setSelectedDays(selectedDays.filter(d => d !== day));
                              }
                            } else {
                              setSelectedDays([...selectedDays, day]);
                            }
                          }}
                          style={[styles.dayCircle, isActive && { backgroundColor: primaryColor }]}
                        >
                          <AppText weight="semibold" style={[styles.dayCircleText, isActive && styles.dayCircleTextActive]}>
                            {day}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* B. Monthly: Select Day 1 to 31 */}
              {frequency === 'monthly' && (
                <View>
                  <AppText style={styles.stepSubtitleText}>
                    Choose the day of the month for your recurring cleaning:
                  </AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((num) => {
                      const isActive = selectedMonthDay === num;
                      return (
                        <TouchableOpacity
                          key={num}
                          onPress={() => setSelectedMonthDay(num)}
                          style={[styles.dayCircle, isActive && { backgroundColor: primaryColor }]}
                        >
                          <AppText weight="bold" style={[styles.dayCircleText, isActive && styles.dayCircleTextActive]}>
                            {num}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <AppText weight="medium" style={styles.recurrenceHelperText}>
                    Will occur on the {selectedMonthDay === 1 ? '1st' : selectedMonthDay === 2 ? '2nd' : selectedMonthDay === 3 ? '3rd' : `${selectedMonthDay}th`} of every month.
                  </AppText>
                </View>
              )}

              {/* C. Custom: Interval Counter and Unit Selector */}
              {frequency === 'custom' && (
                <View style={{ gap: 14 }}>
                  <AppText style={styles.stepSubtitleText}>
                    Define your custom cleaning frequency:
                  </AppText>
                  
                  {/* Interval Row */}
                  <View style={styles.customIntervalRow}>
                    <AppText style={styles.customLabel}>Repeat every</AppText>
                    <View style={styles.counterBox}>
                      <TouchableOpacity 
                        style={styles.counterBtn}
                        onPress={() => setCustomInterval(prev => Math.max(1, prev - 1))}
                      >
                        <Ionicons name="remove" size={16} color="#4B5563" />
                      </TouchableOpacity>
                      <AppText weight="bold" style={styles.counterVal}>{customInterval}</AppText>
                      <TouchableOpacity 
                        style={styles.counterBtn}
                        onPress={() => setCustomInterval(prev => prev + 1)}
                      >
                        <Ionicons name="add" size={16} color="#4B5563" />
                      </TouchableOpacity>
                    </View>

                    {/* Unit Selector Chips */}
                    <View style={styles.unitRow}>
                      {[
                        { id: 'days', label: 'Days' },
                        { id: 'weeks', label: 'Weeks' },
                        { id: 'months', label: 'Months' }
                      ].map((item) => {
                        const isActive = customUnit === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => setCustomUnit(item.id as any)}
                            style={[styles.unitChip, isActive && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                          >
                            <AppText weight="semibold" style={[styles.unitChipText, isActive && styles.unitChipTextActive]}>
                              {item.label}
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Unit Sub-Selections */}
                  {customUnit === 'weeks' && (
                    <View style={{ marginTop: 8 }}>
                      <AppText style={styles.stepSubtitleText}>
                        Select target days of the week:
                      </AppText>
                      <View style={styles.daysRow}>
                        {daysOfWeek.map((day) => {
                          const isActive = selectedDays.includes(day);
                          return (
                            <TouchableOpacity
                              key={day}
                              onPress={() => {
                                if (selectedDays.includes(day)) {
                                  if (selectedDays.length > 1) {
                                    setSelectedDays(selectedDays.filter(d => d !== day));
                                  }
                                } else {
                                  setSelectedDays([...selectedDays, day]);
                                }
                              }}
                              style={[styles.dayCircle, isActive && { backgroundColor: primaryColor }]}
                            >
                              <AppText weight="semibold" style={[styles.dayCircleText, isActive && styles.dayCircleTextActive]}>
                                {day}
                              </AppText>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {customUnit === 'months' && (
                    <View style={{ marginTop: 8 }}>
                      <AppText style={styles.stepSubtitleText}>
                        Select day of the month:
                      </AppText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((num) => {
                          const isActive = selectedMonthDay === num;
                          return (
                            <TouchableOpacity
                              key={num}
                              onPress={() => setSelectedMonthDay(num)}
                              style={[styles.dayCircle, isActive && { backgroundColor: primaryColor }]}
                            >
                              <AppText weight="bold" style={[styles.dayCircleText, isActive && styles.dayCircleTextActive]}>
                                {num}
                              </AppText>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Helper Text Summary */}
                  <View style={[styles.customSummaryBox, { backgroundColor: primaryColor + '10', borderColor: primaryColor + '33' }]}>
                    <Ionicons name="information-circle-outline" size={16} color={primaryColor} style={{ marginRight: 6 }} />
                    <AppText weight="medium" style={[styles.customSummaryText, { color: primaryColor }]}>
                      Repeating every {customInterval} {customInterval === 1 ? customUnit.slice(0, -1) : customUnit}
                      {customUnit === 'weeks' ? ` on ${selectedDays.join(', ')}` : ''}
                      {customUnit === 'months' ? ` on the ${selectedMonthDay === 1 ? '1st' : selectedMonthDay === 2 ? '2nd' : selectedMonthDay === 3 ? '3rd' : `${selectedMonthDay}th`}` : ''}.
                    </AppText>
                  </View>
                </View>
              )}
            </View>

            {/* Step 3: Preferred Time */}
            <View style={styles.stepSection}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepIndicator}>
                  <AppText weight="bold" style={styles.stepNum}>3</AppText>
                </View>
                <AppText weight="bold" style={styles.stepTitle}>Preferred Time</AppText>
              </View>

              <View style={styles.timeGrid}>
                {timeSlots.map((slot) => {
                  const isActive = timeSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setTimeSlot(slot)}
                      style={[styles.timeChip, isActive && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                    >
                      <AppText weight="semibold" style={[styles.timeChipText, isActive && styles.timeChipTextActive]}>
                        {slot}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 4: Start Date */}
            <View style={styles.stepSection}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepIndicator}>
                  <AppText weight="bold" style={styles.stepNum}>4</AppText>
                </View>
                <AppText weight="bold" style={styles.stepTitle}>Start Date</AppText>
              </View>

              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={() => setShowCalendar(true)}
              >
                <AppText style={styles.dateText}>{startDate}</AppText>
                <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Step 5: Ends */}
            <View style={styles.stepSection}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepIndicator}>
                  <AppText weight="bold" style={styles.stepNum}>5</AppText>
                </View>
                <AppText weight="bold" style={styles.stepTitle}>Ends</AppText>
              </View>

              <View style={styles.radioList}>
                {[
                  { id: 'never', label: 'Never' },
                  { id: '3', label: 'After 3 Cleanings' },
                  { id: '6', label: 'After 6 Cleanings' },
                  { id: '12', label: 'After 12 Cleanings' },
                  { id: 'custom', label: 'Choose End Date', isDate: true }
                ].map((option) => {
                  const isChecked = endOption === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => {
                        setEndOption(option.id as any);
                        if (option.id === 'custom') {
                          setShowEndCalendar(true);
                        }
                      }}
                      style={[styles.radioItem, isChecked && { borderColor: primaryColor }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons 
                          name={isChecked ? 'radio-button-on' : 'radio-button-off'} 
                          size={18} 
                          color={isChecked ? primaryColor : '#9CA3AF'} 
                          style={{ marginRight: 10 }}
                        />
                        <AppText style={styles.radioLabel}>
                          {option.id === 'custom' && isChecked
                            ? `Choose End Date: ${customEndDate}`
                            : option.label}
                        </AppText>
                      </View>
                      {option.isDate && isChecked && (
                        <Ionicons name="calendar-outline" size={16} color={primaryColor} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 6: Payment */}
            <View style={styles.stepSection}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepIndicator}>
                  <AppText weight="bold" style={styles.stepNum}>6</AppText>
                </View>
                <AppText weight="bold" style={styles.stepTitle}>Payment</AppText>
              </View>

              <View style={styles.paymentCardGrid}>
                {/* AutoPay Card */}
                <TouchableOpacity 
                  onPress={() => setPaymentOption('autopay')}
                  style={[styles.paymentSelectCard, paymentOption === 'autopay' && { borderColor: primaryColor }]}
                >
                  {paymentOption === 'autopay' && (
                    <View style={styles.cardCheckmark}>
                      <Ionicons name="checkmark-circle" size={18} color={primaryColor} />
                    </View>
                  )}
                  <View style={styles.popularBadge}>
                    <AppText weight="bold" style={styles.popularBadgeText}>Popular</AppText>
                  </View>
                  <Ionicons name="flash-outline" size={24} color={paymentOption === 'autopay' ? primaryColor : '#4B5563'} style={styles.cardIcon} />
                  <AppText weight="bold" style={styles.cardName}>Auto-pay every visit</AppText>
                </TouchableOpacity>

                {/* Subscription Card */}
                <TouchableOpacity 
                  onPress={() => setPaymentOption('subscription')}
                  style={[styles.paymentSelectCard, paymentOption === 'subscription' && { borderColor: primaryColor }]}
                >
                  {paymentOption === 'subscription' && (
                    <View style={styles.cardCheckmark}>
                      <Ionicons name="checkmark-circle" size={18} color={primaryColor} />
                    </View>
                  )}
                  <Ionicons name="calendar-outline" size={24} color={paymentOption === 'subscription' ? primaryColor : '#4B5563'} style={styles.cardIcon} />
                  <AppText weight="bold" style={styles.cardName}>Monthly subscription</AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 7: Cleaner Preference */}
            <View style={styles.stepSection}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepIndicator}>
                  <AppText weight="bold" style={styles.stepNum}>7</AppText>
                </View>
                <AppText weight="bold" style={styles.stepTitle}>Cleaner Preference</AppText>
              </View>

              <View style={styles.cleanerCardGrid}>
                {/* Same Cleaner */}
                <TouchableOpacity 
                  onPress={() => setCleanerPreference('same')}
                  style={[styles.preferenceSelectCard, cleanerPreference === 'same' && { borderColor: primaryColor }]}
                >
                  <Ionicons name="person-outline" size={20} color={cleanerPreference === 'same' ? primaryColor : '#4B5563'} style={styles.cardIcon} />
                  <AppText weight="bold" style={styles.cardName}>Same cleaner if available</AppText>
                </TouchableOpacity>

                {/* Any Cleaner */}
                <TouchableOpacity 
                  onPress={() => setCleanerPreference('any')}
                  style={[styles.preferenceSelectCard, cleanerPreference === 'any' && { borderColor: primaryColor }]}
                >
                  <Ionicons name="people-outline" size={20} color={cleanerPreference === 'any' ? primaryColor : '#4B5563'} style={styles.cardIcon} />
                  <AppText weight="bold" style={styles.cardName}>Any available cleaner</AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 8: Reminders */}
            <View style={styles.stepSection}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepIndicator}>
                  <AppText weight="bold" style={styles.stepNum}>8</AppText>
                </View>
                <AppText weight="bold" style={styles.stepTitle}>Reminders</AppText>
              </View>

              <View style={styles.remindersList}>
                <TouchableOpacity 
                  onPress={() => setNotify1Day(!notify1Day)}
                  style={styles.reminderRow}
                >
                  <Ionicons 
                    name={notify1Day ? 'checkbox' : 'square-outline'} 
                    size={22} 
                    color={notify1Day ? primaryColor : '#9CA3AF'} 
                    style={{ marginRight: 10 }}
                  />
                  <AppText style={styles.reminderLabel}>Notify 1 day before</AppText>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setNotify1Hour(!notify1Hour)}
                  style={styles.reminderRow}
                >
                  <Ionicons 
                    name={notify1Hour ? 'checkbox' : 'square-outline'} 
                    size={22} 
                    color={notify1Hour ? primaryColor : '#9CA3AF'} 
                    style={{ marginRight: 10 }}
                  />
                  <AppText style={styles.reminderLabel}>Notify 1 hour before</AppText>
                </TouchableOpacity>
              </View>
            </View>

          </View>

          {/* Your Recurring Plan Summary Side Panel */}
          <View style={styles.summaryBox}>
            <AppText weight="bold" style={styles.summaryTitle}>Your Recurring Plan</AppText>
            
            {/* Visual Calendar */}
            <View style={styles.calendarIllustrationContainer}>
              <View style={styles.calendarVisual}>
                <View style={styles.calendarHeader} />
                <View style={styles.calendarBody}>
                  <View style={styles.calendarGrid}>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <View key={i} style={[styles.calendarDot, i === 5 && styles.calendarDotActive]}>
                        {i === 5 && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                      </View>
                    ))}
                  </View>
                  {/* Circular loop sync overlay */}
                  <View style={styles.calendarBadgeCircle}>
                    <Ionicons name="sync" size={18} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </View>

            {/* Parameters list */}
            <View style={styles.summaryParamsList}>
              <View style={styles.summaryParamRow}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" style={styles.paramIcon} />
                <View>
                  <AppText size="small" color="textMuted">Frequency</AppText>
                  <AppText weight="bold" style={styles.paramValue}>
                    {frequency === 'weekly' ? 'Every Week' : frequency === 'every-2-weeks' ? 'Every 2 Weeks' : frequency === 'monthly' ? 'Every Month' : 'Custom'}
                  </AppText>
                </View>
              </View>

              <View style={styles.summaryParamRow}>
                <Ionicons name="calendar" size={18} color="#6B7280" style={styles.paramIcon} />
                <View>
                  <AppText size="small" color="textMuted">Day</AppText>
                  <AppText weight="bold" style={styles.paramValue}>
                    {frequency === 'monthly' 
                      ? `Day ${selectedMonthDay} of Month` 
                      : (frequency === 'custom' && customUnit === 'days') 
                        ? `Every ${customInterval} Days`
                        : selectedDays.join(', ')}
                  </AppText>
                </View>
              </View>

              <View style={styles.summaryParamRow}>
                <Ionicons name="time-outline" size={18} color="#6B7280" style={styles.paramIcon} />
                <View>
                  <AppText size="small" color="textMuted">Time</AppText>
                  <AppText weight="bold" style={styles.paramValue}>{timeSlot}</AppText>
                </View>
              </View>

              <View style={styles.summaryParamRow}>
                <Ionicons name="play-outline" size={18} color="#6B7280" style={styles.paramIcon} />
                <View>
                  <AppText size="small" color="textMuted">Starts On</AppText>
                  <AppText weight="bold" style={styles.paramValue}>{startDate.split(' ')[0]} {startDate.split(' ')[1]} {startDate.split(' ')[2]?.replace('(', '') || ''}</AppText>
                </View>
              </View>

              <View style={styles.summaryParamRow}>
                <Ionicons name="stop-outline" size={18} color="#6B7280" style={styles.paramIcon} />
                <View>
                  <AppText size="small" color="textMuted">Ends</AppText>
                  <AppText weight="bold" style={styles.paramValue}>{endOption === 'never' ? 'Never' : `After ${endOption} cleanings`}</AppText>
                </View>
              </View>

              <View style={styles.summaryParamRow}>
                <Ionicons name="person-outline" size={18} color="#6B7280" style={styles.paramIcon} />
                <View>
                  <AppText size="small" color="textMuted">Cleaner</AppText>
                  <AppText weight="bold" style={styles.paramValue}>{cleanerPreference === 'same' ? 'Same cleaner if available' : 'Any available cleaner'}</AppText>
                </View>
              </View>

              <View style={styles.summaryParamRow}>
                <Ionicons name="card-outline" size={18} color="#6B7280" style={styles.paramIcon} />
                <View>
                  <AppText size="small" color="textMuted">Payment</AppText>
                  <AppText weight="bold" style={styles.paramValue}>{paymentOption === 'autopay' ? 'Auto-pay every visit' : 'Monthly subscription'}</AppText>
                </View>
              </View>
            </View>

            {/* Recurring Discount Box */}
            <View style={styles.discountContainer}>
              <View style={styles.discountHeader}>
                <Ionicons name="pricetag" size={16} color={primaryColor} style={{ marginRight: 6 }} />
                <AppText weight="bold" style={[styles.discountTitle, { color: primaryColor }]}>Recurring Discount</AppText>
              </View>
              <AppText style={[styles.discountSubtitle, { color: primaryColor }]}>You save 10% on every visit!</AppText>
              
              <View style={styles.priceComparison}>
                <AppText style={styles.strikePrice}>₹{basePrice}</AppText>
                <AppText weight="bold" style={[styles.discountPrice, { color: primaryColor }]}>₹{discountedPrice} <AppText style={{ fontSize: 11, color: '#6B7280' }}>per visit</AppText></AppText>
              </View>
              
              <View style={[styles.visitsMonthPill, { backgroundColor: primaryColor + '15' }]}>
                <AppText weight="bold" style={[styles.visitsMonthText, { color: primaryColor }]}>Estimated {visitsPerMonth} visits / month</AppText>
              </View>

              <View style={styles.monthlyTotalRow}>
                <AppText color="textMuted" style={{ fontSize: 13 }}>Monthly Total</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText style={styles.strikePriceSmall}>₹{baseMonthlyTotal}</AppText>
                  <AppText weight="bold" style={[styles.finalMonthlyTotal, { color: primaryColor }]}>₹{discountedMonthlyTotal}</AppText>
                </View>
              </View>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Ionicons name="shield-checkmark-outline" size={14} color={primaryColor} style={{ marginRight: 6 }} />
              <AppText style={[styles.disclaimerText, { color: primaryColor }]}>You can pause, reschedule or cancel anytime from your bookings.</AppText>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Continue to Payment"
          onPress={handleConfirm}
          iconName="arrow-forward"
          style={styles.continueBtn}
        />
        <View style={styles.secureBadge}>
          <Ionicons name="lock-closed" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
          <AppText style={styles.secureText}>Secure & Safe Payments</AppText>
        </View>
      </View>

      <CalendarModal
        visible={showCalendar}
        selectedDate={new Date()}
        onClose={() => setShowCalendar(false)}
        onSelect={(date) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const formatted = `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()} (${days[date.getDay()]})`;
          setStartDate(formatted);
          setShowCalendar(false);
        }}
      />

      <CalendarModal
        visible={showEndCalendar}
        selectedDate={new Date()}
        onClose={() => setShowEndCalendar(false)}
        onSelect={(date) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const formatted = `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
          setCustomEndDate(formatted);
          setShowEndCalendar(false);
        }}
      />

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
        <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
            paddingTop: StatusBar.currentHeight || 36
          }}>
            <AppText weight="bold" style={{ color: '#0F172A', fontSize: 16 }}>Secure Razorpay Checkout</AppText>
            <TouchableOpacity
              onPress={() => {
                setShowWebViewModal(false);
                setPaymentHtml(null);
                setPaying(false);
              }}
              style={{ padding: 4 }}
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
                  <ActivityIndicator size="large" color={primaryColor} />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  badgeDiscount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeDiscountText: {
    color: '#0F6A4B',
    fontSize: 10,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F8F9FA',
    paddingBottom: 32,
  },
  mainContainer: {
    padding: 16,
    gap: 16,
  },
  formContainer: {
    gap: 16,
  },
  stepSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F6A4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  stepTitle: {
    fontSize: 15,
    color: '#1F2937',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freqChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  freqChipActive: {
    backgroundColor: '#0F6A4B',
    borderColor: '#0F6A4B',
  },
  freqChipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  freqChipTextActive: {
    color: '#FFFFFF',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: '#0F6A4B',
  },
  dayCircleText: {
    fontSize: 12,
    color: '#4B5563',
  },
  dayCircleTextActive: {
    color: '#FFFFFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  timeChipActive: {
    backgroundColor: '#0F6A4B',
    borderColor: '#0F6A4B',
  },
  timeChipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  dateText: {
    fontSize: 14,
    color: '#1F2937',
  },
  radioList: {
    gap: 10,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  radioItemChecked: {
    borderColor: '#0F6A4B',
    backgroundColor: '#F0FDF4',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
  },
  paymentCardGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentSelectCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    minHeight: 110,
    justifyContent: 'center',
  },
  paymentSelectCardActive: {
    borderColor: '#0F6A4B',
    backgroundColor: '#F0FDF4',
  },
  cardCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: '#E6F4EA',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularBadgeText: {
    fontSize: 8,
    color: '#0F6A4B',
    textTransform: 'uppercase',
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardName: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  cleanerCardGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  preferenceSelectCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 90,
    justifyContent: 'center',
  },
  preferenceSelectCardActive: {
    borderColor: '#0F6A4B',
    backgroundColor: '#F0FDF4',
  },
  remindersList: {
    gap: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderLabel: {
    fontSize: 14,
    color: '#374151',
  },
  summaryBox: {
    backgroundColor: '#F4FBF7',
    borderColor: '#D1F2E1',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 14,
  },
  calendarIllustrationContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  calendarVisual: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  calendarHeader: {
    height: 20,
    backgroundColor: '#0F6A4B',
  },
  calendarBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    width: 50,
    justifyContent: 'center',
  },
  calendarDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDotActive: {
    backgroundColor: '#10B981',
  },
  calendarBadgeCircle: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  summaryParamsList: {
    gap: 12,
    marginBottom: 18,
  },
  summaryParamRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  paramIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  paramValue: {
    fontSize: 13,
    color: '#1F2937',
    marginTop: 2,
  },
  discountContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1F2E1',
    padding: 14,
    marginBottom: 16,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountTitle: {
    fontSize: 13,
    color: '#0F6A4B',
  },
  discountSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  strikePrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 16,
    color: '#0F6A4B',
  },
  visitsMonthPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  visitsMonthText: {
    fontSize: 10,
    color: '#4B5563',
  },
  monthlyTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 12,
  },
  strikePriceSmall: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  finalMonthlyTotal: {
    fontSize: 18,
    color: '#0F6A4B',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#0F6A4B',
    flex: 1,
    lineHeight: 15,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueBtn: {
    shadowColor: '#0F6A4B',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secureText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  stepSubtitleText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 16,
  },
  recurrenceHelperText: {
    fontSize: 12,
    color: '#0F6A4B',
    marginTop: 10,
  },
  customIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  customLabel: {
    fontSize: 13,
    color: '#374151',
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    height: 38,
  },
  counterBtn: {
    width: 34,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterVal: {
    fontSize: 14,
    color: '#1F2937',
    paddingHorizontal: 8,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    height: 38,
    justifyContent: 'center',
  },
  unitChipActive: {
    backgroundColor: '#0F6A4B',
    borderColor: '#0F6A4B',
  },
  unitChipText: {
    fontSize: 12,
    color: '#4B5563',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
  },
  customSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1F2E1',
    marginTop: 6,
  },
  customSummaryText: {
    fontSize: 11,
    color: '#0F6A4B',
    flex: 1,
    lineHeight: 14,
  },
});
