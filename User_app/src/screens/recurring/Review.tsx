// src/screens/recurring/Review.tsx
import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppText from '../../components/ui/AppText';
import { useRecurringStore } from '../../store/recurringStore';
import PrimaryButton from '../../components/recurring/PrimaryButton';
import SectionHeader from '../../components/recurring/SectionHeader';
import ScheduleCard from '../../components/recurring/ScheduleCard';

export default function Review() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editPlanId = route.params?.editPlanId;

  const { draft, createPlan, editPlan, resetDraft } = useRecurringStore();

  const handleCreatePlan = () => {
    if (editPlanId) {
      // Modify plan
      editPlan(editPlanId, draft);
      resetDraft();
      navigation.navigate('Success', { isEdit: true });
    } else {
      // Create new plan
      createPlan();
      navigation.navigate('Success', { isEdit: false });
    }
  };

  const getCleanerPreferenceLabel = () => {
    const pref = draft.cleanerPreference;
    if (pref === 'same-cleaner') return 'Same Cleaner';
    if (pref === 'best-available') return 'Best Available Professional';
    if (pref === 'professional-team') return 'Professional Team (2-3 Cleaners)';
    return 'Best Available';
  };

  const getPaymentLabel = () => {
    const pay = draft.paymentMethod;
    if (pay === 'upi') return 'UPI AutoPay (GPay/PhonePe)';
    if (pay === 'razorpay') return 'Razorpay Subscription';
    return 'UPI AutoPay';
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
            Step 6 of 6 • Review Configuration
          </AppText>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <SectionHeader 
            title="Review Details"
            subtitle="Verify your scheduled subscription configuration details before setup."
          />

          {/* Service Summary */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="sparkles-outline" size={18} color="#0F6A4B" />
              <AppText weight="bold" style={styles.sectionTitle}>Selected Service</AppText>
            </View>
            <View style={styles.serviceRow}>
              <View style={styles.serviceIconBg}>
                <Ionicons name={draft.service?.icon as any || 'home-outline'} size={20} color="#0F6A4B" />
              </View>
              <View style={styles.serviceText}>
                <AppText weight="bold" style={styles.serviceName}>{draft.service?.name}</AppText>
                <AppText style={styles.serviceDesc} numberOfLines={1}>{draft.service?.description}</AppText>
              </View>
            </View>
          </View>

          {/* Schedule Summary (Reusable ScheduleCard) */}
          <View style={styles.cardWithoutPadding}>
            <View style={[styles.sectionHeaderRow, { paddingHorizontal: 16, paddingTop: 16 }]}>
              <Ionicons name="time-outline" size={18} color="#0F6A4B" />
              <AppText weight="bold" style={styles.sectionTitle}>Schedule & Dates</AppText>
            </View>
            {draft.schedule && draft.frequency && (
              <ScheduleCard 
                schedule={draft.schedule}
                frequency={draft.frequency}
                style={styles.inlineScheduleCard}
              />
            )}
          </View>

          {/* Cleaner Preference Summary */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="people-outline" size={18} color="#0F6A4B" />
              <AppText weight="bold" style={styles.sectionTitle}>Cleaner Match Preference</AppText>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#0F6A4B" style={styles.detailIcon} />
              <AppText style={styles.detailText}>{getCleanerPreferenceLabel()}</AppText>
            </View>
          </View>

          {/* Payment Method & Estimates */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="card-outline" size={18} color="#0F6A4B" />
              <AppText weight="bold" style={styles.sectionTitle}>Payment & Cost Estimation</AppText>
            </View>
            
            <View style={styles.paymentRow}>
              <AppText style={styles.paymentLabel}>AutoPay Method</AppText>
              <AppText weight="semibold" style={styles.paymentValue}>{getPaymentLabel()}</AppText>
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentRow}>
              <AppText style={styles.paymentLabel}>Price Per Visit</AppText>
              <AppText weight="bold" style={styles.visitPrice}>₹{draft.pricePerVisit}</AppText>
            </View>

            <View style={styles.paymentRow}>
              <AppText style={styles.paymentLabel}>Est. Monthly Cost</AppText>
              <AppText weight="bold" style={styles.monthlyPrice}>₹{draft.estimatedMonthlyCost}</AppText>
            </View>
          </View>

          <AppText style={styles.agreementText}>
            By creating this recurring plan, you authorize Gigiman to verify your AutoPay credentials and automatically charge your account after each completed visit.
          </AppText>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={editPlanId ? 'Update Subscription' : 'Create Plan & Setup AutoPay'}
          onPress={handleCreatePlan}
          iconName="lock-closed"
          style={styles.createBtn}
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
    paddingBottom: 32,
  },
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  cardWithoutPadding: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  inlineScheduleCard: {
    borderWidth: 0,
    borderRadius: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  serviceIconBg: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceText: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    color: '#1F2937',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#1F2937',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 13,
    color: '#1F2937',
  },
  visitPrice: {
    fontSize: 14,
    color: '#1F2937',
  },
  monthlyPrice: {
    fontSize: 16,
    color: '#0F6A4B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  agreementText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createBtn: {
    shadowColor: '#0F6A4B',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
});
