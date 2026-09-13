// src/screens/recurring/ChooseFrequency.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppText from '../../components/ui/AppText';
import { useRecurringStore } from '../../store/recurringStore';
import FrequencyCard from '../../components/recurring/FrequencyCard';
import PrimaryButton from '../../components/recurring/PrimaryButton';
import SectionHeader from '../../components/recurring/SectionHeader';
import { RecurringFrequencyType } from '../../types/recurring';

export default function ChooseFrequency() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editPlanId = route.params?.editPlanId;

  const { draft, updateDraft } = useRecurringStore();
  const [selectedFreq, setSelectedFreq] = useState<RecurringFrequencyType | null>(null);

  useEffect(() => {
    if (draft.frequency) {
      setSelectedFreq(draft.frequency);
    }
  }, [draft.frequency]);

  const handleContinue = () => {
    if (!selectedFreq) return;
    updateDraft({ frequency: selectedFreq });
    navigation.navigate('SetupSchedule', { editPlanId });
  };

  const frequencies = [
    {
      id: 'weekly' as const,
      title: 'Weekly',
      subtitle: 'Cleaner visits every week. Ideal for active households.',
      icon: 'calendar-outline' as const,
      badge: 'Popular',
    },
    {
      id: 'every-2-weeks' as const,
      title: 'Every 2 Weeks',
      subtitle: 'Great middle ground. Keeps home clean with less visits.',
      icon: 'repeat-outline' as const,
    },
    {
      id: 'monthly' as const,
      title: 'Monthly',
      subtitle: 'Best for thorough regular upkeep and deep cleanings.',
      icon: 'leaf-outline' as const,
    },
    {
      id: 'custom' as const,
      title: 'Custom',
      subtitle: 'Define your own intervals and customized schedule.',
      icon: 'options-outline' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Premium Header */}
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
            Step 2 of 6 • Select Frequency
          </AppText>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <SectionHeader 
            title="Choose Frequency"
            subtitle="How often would you like your home to be cleaned? Select one option."
          />

          <View style={styles.list}>
            {frequencies.map((freq) => (
              <FrequencyCard
                key={freq.id}
                title={freq.title}
                subtitle={freq.subtitle}
                icon={freq.icon}
                badge={freq.badge}
                selected={selectedFreq === freq.id}
                onPress={() => setSelectedFreq(freq.id)}
                style={styles.card}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedFreq}
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
  list: {
    gap: 14,
    marginTop: 8,
  },
  card: {
    marginBottom: 2,
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
