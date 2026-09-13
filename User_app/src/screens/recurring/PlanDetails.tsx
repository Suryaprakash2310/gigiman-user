import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppText from '../../components/ui/AppText';
import { useRecurringStore } from '../../store/recurringStore';
import StatusBadge from '../../components/recurring/StatusBadge';
import PrimaryButton from '../../components/recurring/PrimaryButton';
import ConfirmationModal from '../../components/recurring/ConfirmationModal';

import { useTheme } from '../../theme/useTheme';

type TabType = 'upcoming' | 'history' | 'payments';

export default function PlanDetails() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const planId = route.params?.planId;
  const primaryColor = theme.colors.primary || '#f97316';

  const { 
    plans, 
    fetchPlans,
    pausePlan, 
    resumePlan, 
    cancelPlan, 
    skipNextVisit,
    reschedulePlan
  } = useRecurringStore();

  const plan = plans.find(p => p.id === planId);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [loading, setLoading] = useState(!plan);

  // Confirmation Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState<'pause' | 'resume' | 'cancel' | 'skip' | null>(null);

  useEffect(() => {
    const load = async () => {
      await fetchPlans();
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <AppText style={{ marginTop: 10 }}>Loading plan details...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <AppText weight="bold" style={styles.errorText}>Plan not found</AppText>
          <PrimaryButton title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const { service, frequency, schedule, status, nextVisitDate, upcomingVisits, bookingHistory, paymentHistory } = plan;
  const isPaused = status === 'paused';
  const isCancelled = status === 'cancelled';

  const triggerAction = (action: 'pause' | 'resume' | 'cancel' | 'skip') => {
    setModalAction(action);
    setIsModalVisible(true);
  };

  const handleConfirmAction = () => {
    if (modalAction === 'pause') {
      pausePlan(plan.id);
    } else if (modalAction === 'resume') {
      resumePlan(plan.id);
    } else if (modalAction === 'cancel') {
      cancelPlan(plan.id);
    } else if (modalAction === 'skip') {
      skipNextVisit(plan.id);
    }
    setIsModalVisible(false);
    setModalAction(null);
  };

  const getModalConfig = () => {
    switch (modalAction) {
      case 'pause':
        return {
          title: 'Pause Recurring Plan?',
          description: 'This will temporarily stop all upcoming cleanings. You can resume at any time.',
          confirmTitle: 'Pause Plan',
          isDanger: false,
          icon: 'pause-circle-outline' as const,
        };
      case 'resume':
        return {
          title: 'Resume Recurring Plan?',
          description: 'This will reschedule your cleanings and resume your automated cleaning cycles.',
          confirmTitle: 'Resume Plan',
          isDanger: false,
          icon: 'play-circle-outline' as const,
        };
      case 'cancel':
        return {
          title: 'Cancel Recurring Plan Permanently?',
          description: 'Are you sure you want to cancel this plan? This action cannot be undone, and you will lose your cleaner preferences.',
          confirmTitle: 'Cancel Plan',
          isDanger: true,
          icon: 'trash-outline' as const,
        };
      case 'skip':
        return {
          title: 'Skip Next Cleaning Visit?',
          description: 'Skip your next scheduled visit. Your subscription will resume automatically from the following visit.',
          confirmTitle: 'Skip Visit',
          isDanger: false,
          icon: 'arrow-forward-outline' as const,
        };
      default:
        return {
          title: '',
          description: '',
          confirmTitle: '',
          isDanger: false,
          icon: 'alert-circle-outline' as const,
        };
    }
  };

  const modalConfig = getModalConfig();

  const getFrequencyLabel = () => {
    if (frequency === 'weekly') return 'Weekly';
    if (frequency === 'every-2-weeks') return 'Every 2 Weeks';
    if (frequency === 'monthly') return 'Monthly';
    return 'Custom';
  };

  const getScheduleText = () => {
    if (frequency === 'weekly' || frequency === 'every-2-weeks') {
      return `Every ${schedule.weekdays?.join(', ')}`;
    }
    if (frequency === 'monthly') {
      if (schedule.monthlyType === 'date') {
        return `Every month on day ${schedule.dateOfMonth}`;
      }
      return `Every month on ${schedule.monthlyRule}`;
    }
    return 'Custom Schedule';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => {
            const fromServiceBooking = route.params?.fromServiceBooking ?? false;
            if (fromServiceBooking) {
              navigation.navigate('ServiceTab', { screen: 'Booking' });
            } else {
              navigation.navigate('RecurringHome');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <AppText weight="bold" style={styles.headerTitle}>
          Plan Details
        </AppText>
        
        <TouchableOpacity 
          style={styles.shareBtn}
          onPress={() => Share.share({ message: `I have automated my home cleaning with Gigiman Recurring Plans! Service: ${service.name}` })}
        >
          <Ionicons name="share-social-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Plan Header Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: primaryColor + '1A' }]}>
              <Ionicons name={service.icon as any} size={28} color={primaryColor} />
            </View>
            <View style={styles.headerDetails}>
              <AppText weight="bold" style={styles.serviceName}>
                {service.name}
              </AppText>
              <View style={styles.frequencyRow}>
                <AppText style={styles.frequencyText}>{getFrequencyLabel()}</AppText>
                <View style={styles.dot} />
                <AppText style={styles.scheduleText}>{getScheduleText()}</AppText>
              </View>
            </View>
            <StatusBadge status={status} />
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <AppText style={styles.statLabel}>Next Visit</AppText>
              <AppText weight="bold" style={[styles.statValue, { color: primaryColor }]}>
                {isCancelled ? 'N/A' : nextVisitDate}
              </AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <AppText style={styles.statLabel}>Per Visit Cost</AppText>
              <AppText weight="bold" style={styles.statValue}>
                ₹{plan.pricePerVisit}
              </AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <AppText style={styles.statLabel}>Est. Monthly Cost</AppText>
              <AppText weight="bold" style={styles.statValue}>
                ₹{plan.estimatedMonthlyCost}
              </AppText>
            </View>
          </View>
        </View>

        {/* AutoPay Status Panel */}
        <View style={styles.autopayCard}>
          <View style={styles.autopayHeader}>
            <View style={styles.autopayLeft}>
              <Ionicons name="card" size={20} color={primaryColor} style={styles.autopayIcon} />
              <AppText weight="bold" style={styles.autopayTitle}>AutoPay Status</AppText>
            </View>
            <View style={styles.autopayBadge}>
              <AppText weight="bold" style={styles.autopayBadgeText}>
                {isCancelled ? 'Disabled' : 'Active'}
              </AppText>
            </View>
          </View>
          <AppText style={styles.autopayDesc}>
            {isCancelled 
              ? 'AutoPay is disabled as this plan is cancelled.' 
              : `Authorized via ${plan.paymentMethod.toUpperCase()} AutoPay. Payment triggers automatically after each visit completes.`}
          </AppText>
        </View>

        {/* Segmented Timeline Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'upcoming' && { backgroundColor: primaryColor }]}
            onPress={() => setActiveTab('upcoming')}
          >
            <AppText 
              weight={activeTab === 'upcoming' ? 'bold' : 'semibold'} 
              style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}
            >
              Upcoming Visits
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && { backgroundColor: primaryColor }]}
            onPress={() => setActiveTab('history')}
          >
            <AppText 
              weight={activeTab === 'history' ? 'bold' : 'semibold'} 
              style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}
            >
              Booking History
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'payments' && { backgroundColor: primaryColor }]}
            onPress={() => setActiveTab('payments')}
          >
            <AppText 
              weight={activeTab === 'payments' ? 'bold' : 'semibold'} 
              style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}
            >
              Payments
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Timeline Content */}
        <View style={styles.timelineContent}>
          {/* Tab 1: Upcoming Visits */}
          {activeTab === 'upcoming' && (
            <View style={styles.listContainer}>
              {isCancelled ? (
                <AppText style={styles.emptyText}>No upcoming visits. Plan is cancelled.</AppText>
              ) : upcomingVisits.length === 0 ? (
                <AppText style={styles.emptyText}>No upcoming visits scheduled.</AppText>
              ) : (
                upcomingVisits.map((visit, index) => (
                  <View key={visit.id} style={styles.timelineItem}>
                    <View style={styles.timelinePointContainer}>
                      <View style={[styles.timelinePoint, visit.status === 'skipped' && styles.timelinePointSkipped]} />
                      {index < upcomingVisits.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineBody}>
                      <View style={styles.timelineHeader}>
                        <AppText weight="bold" style={styles.timelineTitle}>
                          Cleaning Visit #{index + 1}
                        </AppText>
                        {visit.status === 'skipped' && (
                          <View style={styles.skippedBadge}>
                            <AppText weight="semibold" style={styles.skippedText}>Skipped</AppText>
                          </View>
                        )}
                      </View>
                      <AppText style={styles.timelineTime}>
                        {visit.date} • {visit.time}
                      </AppText>
                      
                      {visit.status !== 'skipped' && !isPaused && (
                        <View style={styles.timelineActions}>
                          <TouchableOpacity 
                            style={styles.timelineActionBtn}
                            onPress={() => triggerAction('skip')}
                          >
                            <Ionicons name="arrow-forward" size={14} color="#4B5563" />
                            <AppText weight="semibold" style={styles.timelineActionText}>Skip</AppText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.timelineActionBtn}
                            onPress={() => navigation.navigate('RecurringBooking', { editPlanId: plan.id })}
                          >
                            <Ionicons name="create-outline" size={14} color="#4B5563" />
                            <AppText weight="semibold" style={styles.timelineActionText}>Reschedule</AppText>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Tab 2: Booking History */}
          {activeTab === 'history' && (
            <View style={styles.listContainer}>
              {bookingHistory.length === 0 ? (
                <AppText style={styles.emptyText}>No cleaning history available yet.</AppText>
              ) : (
                bookingHistory.map((item, index) => (
                  <View key={item.id} style={styles.timelineItem}>
                    <View style={styles.timelinePointContainer}>
                      <View style={[styles.timelinePoint, styles.timelinePointCompleted]} />
                      {index < bookingHistory.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineBody}>
                      <AppText weight="bold" style={styles.timelineTitle}>
                        Cleaned by {item.cleanerName}
                      </AppText>
                      <AppText style={styles.timelineTime}>
                        {item.date} • {item.time}
                      </AppText>
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark" size={10} color="#065F46" />
                        <AppText weight="bold" style={styles.completedText}>Completed</AppText>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Tab 3: Payment History */}
          {activeTab === 'payments' && (
            <View style={styles.listContainer}>
              {paymentHistory.length === 0 ? (
                <AppText style={styles.emptyText}>No transaction history available yet.</AppText>
              ) : (
                paymentHistory.map((txn) => (
                  <View key={txn.id} style={styles.txnItem}>
                    <View style={styles.txnLeft}>
                      <View style={[styles.txnIconBg, { backgroundColor: primaryColor + '1A' }]}>
                        <Ionicons name="cash-outline" size={18} color={primaryColor} />
                      </View>
                      <View>
                        <AppText weight="bold" style={styles.txnTitle}>Payment Approved</AppText>
                        <AppText style={styles.txnDate}>{txn.date} • ID: {txn.transactionId}</AppText>
                      </View>
                    </View>
                    <View style={styles.txnRight}>
                      <AppText weight="bold" style={styles.txnAmount}>₹{txn.amount}</AppText>
                      <View style={styles.paidBadge}>
                        <AppText weight="bold" style={styles.paidText}>Paid</AppText>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Global Action Switches */}
        {!isCancelled && (
          <View style={styles.actionsPanel}>
            <PrimaryButton
              title={isPaused ? 'Resume Plan' : 'Pause Plan'}
              variant={isPaused ? 'primary' : 'outline'}
              onPress={() => triggerAction(isPaused ? 'resume' : 'pause')}
              iconName={isPaused ? 'play-outline' : 'pause-outline'}
              style={styles.actionBtn}
            />

            <PrimaryButton
              title="Cancel Subscription"
              variant="danger"
              onPress={() => triggerAction('cancel')}
              iconName="trash-outline"
              style={styles.cancelBtn}
            />
          </View>
        )}
      </ScrollView>

      {/* Action Confirmation Modals */}
      <ConfirmationModal
        visible={isModalVisible}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmTitle={modalConfig.confirmTitle}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setIsModalVisible(false);
          setModalAction(null);
        }}
        isDanger={modalConfig.isDanger}
        iconName={modalConfig.icon}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    color: '#111827',
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EFFDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 18,
    color: '#1F2937',
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  frequencyText: {
    fontSize: 12,
    color: '#6B7280',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 6,
  },
  scheduleText: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  autopayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
  },
  autopayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  autopayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autopayIcon: {
    marginRight: 8,
  },
  autopayTitle: {
    fontSize: 14,
    color: '#1F2937',
  },
  autopayBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  autopayBadgeText: {
    fontSize: 9,
    color: '#065F46',
    textTransform: 'uppercase',
  },
  autopayDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0F6A4B',
  },
  tabText: {
    fontSize: 12,
    color: '#4B5563',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  timelineContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
    minHeight: 140,
  },
  listContainer: {
    gap: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 30,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelinePointContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 12,
  },
  timelinePoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
    zIndex: 1,
  },
  timelinePointSkipped: {
    backgroundColor: '#F59E0B',
  },
  timelinePointCompleted: {
    backgroundColor: '#10B981',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    color: '#1F2937',
  },
  timelineTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  skippedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  skippedText: {
    fontSize: 9,
    color: '#D97706',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 3,
  },
  completedText: {
    fontSize: 9,
    color: '#065F46',
  },
  timelineActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  timelineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  timelineActionText: {
    fontSize: 11,
    color: '#4B5563',
  },
  txnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txnIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFFDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnTitle: {
    fontSize: 13,
    color: '#1F2937',
  },
  txnDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 14,
    color: '#1F2937',
  },
  paidBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  paidText: {
    fontSize: 8,
    color: '#065F46',
    textTransform: 'uppercase',
  },
  actionsPanel: {
    gap: 12,
  },
  actionBtn: {
    height: 50,
  },
  cancelBtn: {
    height: 50,
  },
});
