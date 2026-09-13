// src/screens/recurring/Payment.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppText from '../../components/ui/AppText';
import { useRecurringStore } from '../../store/recurringStore';
import SelectionCard from '../../components/recurring/SelectionCard';
import PrimaryButton from '../../components/recurring/PrimaryButton';
import SectionHeader from '../../components/recurring/SectionHeader';
import InfoCard from '../../components/recurring/InfoCard';
import { PaymentMethodType } from '../../types/recurring';

export default function Payment() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editPlanId = route.params?.editPlanId;

  const { draft, updateDraft } = useRecurringStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);

  useEffect(() => {
    if (draft.paymentMethod) {
      setSelectedMethod(draft.paymentMethod);
    } else {
      setSelectedMethod('upi'); // default choice
    }
  }, [draft.paymentMethod]);

  const getPricePerVisit = () => {
    return draft.service?.pricePerVisit || 499;
  };

  const getEstimatedMonthlyCost = () => {
    const price = getPricePerVisit();
    const freq = draft.frequency;
    if (freq === 'weekly') return price * 4;
    if (freq === 'every-2-weeks') return price * 2;
    if (freq === 'monthly') return price * 1;
    return price * 4; // custom
  };

  const handleContinue = () => {
    if (!selectedMethod) return;
    updateDraft({ 
      paymentMethod: selectedMethod,
      pricePerVisit: getPricePerVisit(),
      estimatedMonthlyCost: getEstimatedMonthlyCost()
    });
    navigation.navigate('Review', { editPlanId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
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
            {editPlanId ? 'Edit Plan' : 'New Recurring Plan'}
          </AppText>
          <AppText style={styles.headerSubtitle}>
            Step 5 of 6 • Payment Setup
          </AppText>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <SectionHeader 
            title="Setup AutoPay"
            subtitle="Enable automatic payments for a seamless cleaning routine."
          />

          {/* Pricing Estimation Card */}
          <View style={styles.pricingCard}>
            <AppText weight="bold" style={styles.pricingHeader}>
              Pricing Summary
            </AppText>
            
            <View style={styles.pricingRow}>
              <AppText style={styles.pricingLabel}>Price Per Visit</AppText>
              <AppText weight="bold" style={styles.pricingValue}>
                ₹{getPricePerVisit()}
              </AppText>
            </View>

            <View style={styles.divider} />

            <View style={styles.pricingRow}>
              <View>
                <AppText style={styles.pricingLabel}>Estimated Monthly Cost</AppText>
                <AppText style={styles.pricingSublabel}>
                  Calculated based on {draft.frequency === 'weekly' ? '4 visits' : draft.frequency === 'every-2-weeks' ? '2 visits' : '1 visit'} per month
                </AppText>
              </View>
              <AppText weight="bold" style={styles.pricingTotalValue}>
                ₹{getEstimatedMonthlyCost()}
              </AppText>
            </View>
          </View>

          {/* AutoPay Methods Selection */}
          <AppText weight="bold" style={styles.selectionTitle}>
            Choose AutoPay Method
          </AppText>

          <View style={styles.methodsContainer}>
            <SelectionCard
              selected={selectedMethod === 'upi'}
              onPress={() => setSelectedMethod('upi')}
              style={styles.card}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconBg, selectedMethod === 'upi' && styles.iconBgSelected]}>
                  <Ionicons name="flash-outline" size={24} color={selectedMethod === 'upi' ? '#0F6A4B' : '#4B5563'} />
                </View>
                <View style={styles.textContainer}>
                  <AppText weight="bold" style={styles.methodTitle}>
                    UPI AutoPay (Recommended)
                  </AppText>
                  <AppText style={styles.methodSubtitle}>
                    Authorize once via GPay, PhonePe, or Paytm. 1-tap secure setup.
                  </AppText>
                </View>
              </View>
            </SelectionCard>

            <SelectionCard
              selected={selectedMethod === 'razorpay'}
              onPress={() => setSelectedMethod('razorpay')}
              style={styles.card}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconBg, selectedMethod === 'razorpay' && styles.iconBgSelected]}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={selectedMethod === 'razorpay' ? '#0F6A4B' : '#4B5563'} />
                </View>
                <View style={styles.textContainer}>
                  <AppText weight="bold" style={styles.methodTitle}>
                    Razorpay Subscriptions
                  </AppText>
                  <AppText style={styles.methodSubtitle}>
                    Use Credit Card, Debit Card or Netbanking for automated payments.
                  </AppText>
                </View>
              </View>
            </SelectionCard>
          </View>

          {/* Information Card */}
          <InfoCard
            text="Payment will automatically happen after every scheduled visit. No advance deductions."
            iconName="shield-outline"
            style={styles.info}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedMethod}
          iconName="arrow-forward"
          style={styles.continueBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  container: {
    padding: 20,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 24,
  },
  pricingHeader: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 14,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  pricingSublabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  pricingValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  pricingTotalValue: {
    fontSize: 20,
    color: '#0F6A4B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  selectionTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 14,
  },
  methodsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  card: {
    marginBottom: 2,
    paddingVertical: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBgSelected: {
    backgroundColor: '#D1FAE5',
  },
  textContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    color: '#1F2937',
  },
  methodSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  info: {
    marginTop: 4,
  },
  bottomBar: {
    padding: 20,
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
});
