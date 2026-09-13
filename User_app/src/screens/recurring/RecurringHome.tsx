import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppText from '../../components/ui/AppText';
import { useRecurringStore } from '../../store/recurringStore';
import EmptyState from '../../components/recurring/EmptyState';
import PlanCard from '../../components/recurring/PlanCard';
import SectionHeader from '../../components/recurring/SectionHeader';
import ConfirmationModal from '../../components/recurring/ConfirmationModal';
import { useTheme } from '../../theme/useTheme';

export default function RecurringHome() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
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

  useEffect(() => {
    fetchPlans();
  }, []);

  // Modal states for plan actions
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'pause' | 'resume' | 'skip' | 'cancel' | 'reschedule' | null>(null);

  // Reschedule temporary states
  const [rescheduleDate, setRescheduleDate] = useState('2026-08-15');
  const [rescheduleTime, setRescheduleTime] = useState('10:00 AM');

  const activePlans = plans.filter(p => p.status !== 'cancelled');

  const handleAction = (planId: string, type: 'pause' | 'resume' | 'skip' | 'cancel' | 'reschedule') => {
    setSelectedPlanId(planId);
    setActionType(type);
  };

  const confirmAction = () => {
    if (!selectedPlanId || !actionType) return;

    if (actionType === 'pause') {
      pausePlan(selectedPlanId);
    } else if (actionType === 'resume') {
      resumePlan(selectedPlanId);
    } else if (actionType === 'skip') {
      skipNextVisit(selectedPlanId);
    } else if (actionType === 'cancel') {
      cancelPlan(selectedPlanId);
    } else if (actionType === 'reschedule') {
      reschedulePlan(selectedPlanId, rescheduleDate, rescheduleTime);
    }

    setSelectedPlanId(null);
    setActionType(null);
  };

  const getModalConfig = () => {
    switch (actionType) {
      case 'pause':
        return {
          title: 'Pause Recurring Plan?',
          description: 'This will temporarily halt all future scheduled cleanings. You can resume at any time.',
          confirmTitle: 'Pause Plan',
          isDanger: false,
          iconName: 'pause-circle-outline' as const,
        };
      case 'resume':
        return {
          title: 'Resume Recurring Plan?',
          description: 'This will re-schedule your upcoming cleaning visits.',
          confirmTitle: 'Resume Plan',
          isDanger: false,
          iconName: 'play-circle-outline' as const,
        };
      case 'skip':
        return {
          title: 'Skip Next Visit?',
          description: 'Are you sure you want to skip the next scheduled visit? You will not be charged.',
          confirmTitle: 'Skip Visit',
          isDanger: false,
          iconName: 'arrow-forward-circle-outline' as const,
        };
      case 'cancel':
        return {
          title: 'Cancel Recurring Plan?',
          description: 'Are you sure you want to cancel this plan permanently? You will lose cleaner preference benefits.',
          confirmTitle: 'Cancel Plan',
          isDanger: true,
          iconName: 'trash-outline' as const,
        };
      case 'reschedule':
        return {
          title: 'Reschedule Next Visit?',
          description: `Confirm rescheduling your next visit to ${rescheduleDate} at ${rescheduleTime}?`,
          confirmTitle: 'Reschedule',
          isDanger: false,
          iconName: 'calendar-outline' as const,
        };
      default:
        return {
          title: '',
          description: '',
          confirmTitle: '',
          isDanger: false,
          iconName: 'alert-circle-outline' as const,
        };
    }
  };

  const modalConfig = getModalConfig();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => {
            const fromServiceBooking = route.params?.fromServiceBooking ?? false;
            if (fromServiceBooking) {
              navigation.navigate('ServiceTab', { screen: 'Booking' });
            } else {
              navigation.navigate('HomeTab', { screen: 'Home' });
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <AppText weight="bold" style={styles.headerTitle}>
            Recurring Plans
          </AppText>
          <AppText style={styles.headerSubtitle}>
            Automate your home cleaning schedule.
          </AppText>
        </View>

        {activePlans.length > 0 && (
          <TouchableOpacity 
            style={[styles.createBadge, { backgroundColor: primaryColor }]}
            onPress={() => navigation.navigate('ChooseService')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <AppText weight="semibold" style={styles.createBadgeText}>New</AppText>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activePlans.length === 0 ? (
          <EmptyState 
            onActionPress={() => navigation.navigate('ChooseService')} 
          />
        ) : (
          <View style={styles.plansContainer}>
            <SectionHeader 
              title="My Recurring Plans"
              subtitle="Manage your automated cleaning subscriptions and schedule."
              style={styles.sectionHeader}
            />
            
            <View style={styles.plansList}>
              {activePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onPress={() => navigation.navigate('PlanDetails', { 
                    planId: plan.id,
                    fromServiceBooking: route.params?.fromServiceBooking 
                  })}
                  onPauseToggle={() => handleAction(plan.id, plan.status === 'paused' ? 'resume' : 'pause')}
                  onSkipNext={() => handleAction(plan.id, 'skip')}
                  onReschedule={() => handleAction(plan.id, 'reschedule')}
                  onEdit={() => navigation.navigate('ChooseService', { editPlanId: plan.id })}
                  onCancel={() => handleAction(plan.id, 'cancel')}
                  style={styles.card}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Dialog Modal */}
      <ConfirmationModal
        visible={selectedPlanId !== null}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmTitle={modalConfig.confirmTitle}
        onConfirm={confirmAction}
        onCancel={() => {
          setSelectedPlanId(null);
          setActionType(null);
        }}
        isDanger={modalConfig.isDanger}
        iconName={modalConfig.iconName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA', // theme requested bg
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
  createBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F6A4B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 2,
  },
  createBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  plansContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  plansList: {
    gap: 16,
  },
  card: {
    marginBottom: 4,
  },
});
