// src/screens/recurring/CleanerPreference.tsx
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
import { CleanerPreferenceType } from '../../types/recurring';

export default function CleanerPreference() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editPlanId = route.params?.editPlanId;

  const { draft, updateDraft } = useRecurringStore();
  const [selectedPref, setSelectedPref] = useState<CleanerPreferenceType | null>(null);

  useEffect(() => {
    if (draft.cleanerPreference) {
      setSelectedPref(draft.cleanerPreference);
    } else {
      setSelectedPref('best-available'); // default choice
    }
  }, [draft.cleanerPreference]);

  const handleContinue = () => {
    if (!selectedPref) return;
    updateDraft({ cleanerPreference: selectedPref });
    navigation.navigate('Payment', { editPlanId });
  };

  const preferences = [
    {
      id: 'same-cleaner' as const,
      title: 'Same Cleaner',
      subtitle: 'Highly Recommended. The same professional cleans your house every time, building trust and familiarity.',
      icon: 'person-outline' as const,
      badge: 'Best Value',
    },
    {
      id: 'best-available' as const,
      title: 'Best Available',
      subtitle: 'Schedules the highest-rated professional available at your selected date and time slot.',
      icon: 'star-outline' as const,
    },
    {
      id: 'professional-team' as const,
      title: 'Professional Team',
      subtitle: 'Sends 2-3 trained experts. Recommended for large villas, deep cleanings, or quick turns.',
      icon: 'people-outline' as const,
    },
  ];

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
            Step 4 of 6 • Cleaner Preference
          </AppText>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <SectionHeader 
            title="Cleaner Preference"
            subtitle="Who would you like to clean your home? Select matching preference."
          />

          <View style={styles.list}>
            {preferences.map((pref) => (
              <SelectionCard
                key={pref.id}
                selected={selectedPref === pref.id}
                onPress={() => setSelectedPref(pref.id)}
                style={styles.card}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.iconBg, selectedPref === pref.id && styles.iconBgSelected]}>
                    <Ionicons 
                      name={pref.icon} 
                      size={24} 
                      color={selectedPref === pref.id ? '#0F6A4B' : '#4B5563'} 
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                      <AppText weight="bold" style={styles.cardTitle}>
                        {pref.title}
                      </AppText>
                      {pref.badge && (
                        <View style={styles.badge}>
                          <AppText weight="bold" style={styles.badgeText}>
                            {pref.badge}
                          </AppText>
                        </View>
                      )}
                    </View>
                    <AppText style={styles.cardSubtitle}>
                      {pref.subtitle}
                    </AppText>
                  </View>
                </View>
              </SelectionCard>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedPref}
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
    paddingVertical: 18,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBg: {
    width: 46,
    height: 46,
    borderRadius: 12,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#0F6A4B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
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
