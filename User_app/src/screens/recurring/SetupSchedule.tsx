// src/screens/recurring/SetupSchedule.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppText from '../../components/ui/AppText';
import { useRecurringStore } from '../../store/recurringStore';
import PrimaryButton from '../../components/recurring/PrimaryButton';
import SectionHeader from '../../components/recurring/SectionHeader';
import InfoCard from '../../components/recurring/InfoCard';

export default function SetupSchedule() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editPlanId = route.params?.editPlanId;

  const { draft, updateDraft } = useRecurringStore();
  const isWeekly = draft.frequency === 'weekly' || draft.frequency === 'every-2-weeks';
  const isMonthly = draft.frequency === 'monthly';

  // State values
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [monthlyType, setMonthlyType] = useState<'date' | 'rule'>('date');
  const [dateOfMonth, setDateOfMonth] = useState<number>(1);
  const [monthlyRule, setMonthlyRule] = useState<string>('First Monday');
  const [selectedTime, setSelectedTime] = useState<string>('09:00 AM');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isNoEndDate, setIsNoEndDate] = useState<boolean>(true);

  // Load draft values if they exist
  useEffect(() => {
    // Set default start date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setStartDate(tomorrowStr);

    if (draft.schedule) {
      const sch = draft.schedule;
      setSelectedWeekdays(sch.weekdays || []);
      setMonthlyType(sch.monthlyType || 'date');
      setDateOfMonth(sch.dateOfMonth || 1);
      setMonthlyRule(sch.monthlyRule || 'First Monday');
      setSelectedTime(sch.time || '09:00 AM');
      if (sch.startDate) setStartDate(sch.startDate);
      if (sch.endDate) setEndDate(sch.endDate);
      setIsNoEndDate(sch.isNoEndDate ?? true);
    }
  }, [draft.schedule]);

  const toggleWeekday = (day: string) => {
    if (selectedWeekdays.includes(day)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
    } else {
      setSelectedWeekdays([...selectedWeekdays, day]);
    }
  };

  const handleContinue = () => {
    const scheduleData = {
      weekdays: isWeekly ? selectedWeekdays : [],
      monthlyType: isMonthly ? monthlyType : undefined,
      dateOfMonth: isMonthly && monthlyType === 'date' ? dateOfMonth : undefined,
      monthlyRule: isMonthly && monthlyType === 'rule' ? monthlyRule : undefined,
      time: selectedTime,
      startDate: startDate,
      endDate: isNoEndDate ? undefined : endDate,
      isNoEndDate: isNoEndDate,
    };

    updateDraft({ schedule: scheduleData });
    navigation.navigate('CleanerPreference', { editPlanId });
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const timeSlots = ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];
  
  const monthlyRules = ['First Monday', 'Second Saturday', 'Last Sunday', 'First Sunday', 'Third Friday'];

  const isFormValid = () => {
    if (isWeekly && selectedWeekdays.length === 0) return false;
    if (!startDate) return false;
    if (!isNoEndDate && !endDate) return false;
    return true;
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
            Step 3 of 6 • Setup Schedule
          </AppText>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <SectionHeader 
            title="Setup Schedule"
            subtitle="Configure when your cleanings should occur."
          />

          {/* Conditional Input: Weekly Weekday Selector */}
          {isWeekly && (
            <View style={styles.section}>
              <AppText weight="bold" style={styles.sectionLabel}>
                Select Weekdays
              </AppText>
              <AppText style={styles.sectionHint}>
                Select one or more days for cleaning.
              </AppText>
              
              <View style={styles.weekdayGrid}>
                {daysOfWeek.map((day) => {
                  const isSelected = selectedWeekdays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      activeOpacity={0.8}
                      onPress={() => toggleWeekday(day)}
                      style={[
                        styles.weekdayBtn,
                        isSelected && styles.weekdayBtnSelected,
                      ]}
                    >
                      <AppText 
                        weight={isSelected ? 'bold' : 'medium'}
                        style={[
                          styles.weekdayText,
                          isSelected && styles.weekdayTextSelected,
                        ]}
                      >
                        {day}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Conditional Input: Monthly Rules */}
          {isMonthly && (
            <View style={styles.section}>
              <AppText weight="bold" style={styles.sectionLabel}>
                Select Schedule Type
              </AppText>
              
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  onPress={() => setMonthlyType('date')}
                  style={[
                    styles.toggleButton,
                    monthlyType === 'date' && styles.toggleButtonActive
                  ]}
                >
                  <AppText weight="semibold" style={[styles.toggleButtonText, monthlyType === 'date' && styles.toggleButtonTextActive]}>
                    Specific Date
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMonthlyType('rule')}
                  style={[
                    styles.toggleButton,
                    monthlyType === 'rule' && styles.toggleButtonActive
                  ]}
                >
                  <AppText weight="semibold" style={[styles.toggleButtonText, monthlyType === 'rule' && styles.toggleButtonTextActive]}>
                    Week Day Rule
                  </AppText>
                </TouchableOpacity>
              </View>

              {monthlyType === 'date' ? (
                <View style={styles.inputContainer}>
                  <AppText style={styles.sectionHint}>
                    Choose the day of the month (1-31):
                  </AppText>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                      const isSelected = dateOfMonth === day;
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setDateOfMonth(day)}
                          style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                        >
                          <AppText weight="semibold" style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                            {day}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <AppText style={styles.sectionHint}>
                    Select rule:
                  </AppText>
                  <View style={styles.ruleGrid}>
                    {monthlyRules.map((rule) => {
                      const isSelected = monthlyRule === rule;
                      return (
                        <TouchableOpacity
                          key={rule}
                          onPress={() => setMonthlyRule(rule)}
                          style={[styles.ruleChip, isSelected && styles.ruleChipSelected]}
                        >
                          <AppText weight="semibold" style={[styles.ruleChipText, isSelected && styles.ruleChipTextSelected]}>
                            {rule}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Time Picker Slots */}
          <View style={styles.section}>
            <AppText weight="bold" style={styles.sectionLabel}>
              Preferred Start Time
            </AppText>
            <AppText style={styles.sectionHint}>
              Select a suitable morning or afternoon time slot.
            </AppText>

            <View style={styles.timeSlotGrid}>
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    style={[
                      styles.timeSlotBtn,
                      isSelected && styles.timeSlotBtnSelected,
                    ]}
                  >
                    <Ionicons 
                      name="time-outline" 
                      size={14} 
                      color={isSelected ? '#FFFFFF' : '#4B5563'} 
                      style={styles.timeIcon} 
                    />
                    <AppText 
                      weight="semibold"
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
                      ]}
                    >
                      {time}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Dates Setup */}
          <View style={styles.section}>
            <AppText weight="bold" style={styles.sectionLabel}>
              Plan Duration
            </AppText>

            {/* Start Date */}
            <View style={styles.dateField}>
              <AppText weight="semibold" style={styles.dateLabel}>
                Start Date (YYYY-MM-DD)
              </AppText>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-08-04"
                style={styles.textInput}
              />
            </View>

            {/* No End Date Toggle */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <AppText weight="semibold" style={styles.switchLabel}>
                  No End Date (Ongoing)
                </AppText>
                <AppText style={styles.switchDesc}>
                  Highly Recommended. Clean automatically until you pause or cancel.
                </AppText>
              </View>
              <Switch
                value={isNoEndDate}
                onValueChange={setIsNoEndDate}
                trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
                thumbColor={isNoEndDate ? '#0F6A4B' : '#F3F4F6'}
              />
            </View>

            {/* Conditional End Date Input */}
            {!isNoEndDate && (
              <View style={[styles.dateField, styles.endDateField]}>
                <AppText weight="semibold" style={styles.dateLabel}>
                  End Date (YYYY-MM-DD)
                </AppText>
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="2026-12-31"
                  style={styles.textInput}
                />
              </View>
            )}
          </View>

          <InfoCard 
            text="You can reschedule or skip individual visits later without altering the overall recurring plan settings."
            style={styles.info}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!isFormValid()}
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
    paddingBottom: 32,
  },
  container: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  sectionHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 14,
  },
  weekdayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  weekdayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  weekdayBtnSelected: {
    backgroundColor: '#0F6A4B',
    borderColor: '#0F6A4B',
  },
  weekdayText: {
    fontSize: 11,
    color: '#4B5563',
  },
  weekdayTextSelected: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginTop: 12,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#0F6A4B',
  },
  inputContainer: {
    marginTop: 8,
  },
  horizontalScroll: {
    paddingVertical: 6,
    gap: 8,
  },
  dateChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipSelected: {
    backgroundColor: '#0F6A4B',
  },
  dateChipText: {
    fontSize: 14,
    color: '#4B5563',
  },
  dateChipTextSelected: {
    color: '#FFFFFF',
  },
  ruleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ruleChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ruleChipSelected: {
    backgroundColor: '#0F6A4B',
  },
  ruleChipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  ruleChipTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  timeSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    width: '48%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeSlotBtnSelected: {
    backgroundColor: '#0F6A4B',
    borderColor: '#0F6A4B',
  },
  timeIcon: {
    marginRight: 6,
  },
  timeSlotText: {
    fontSize: 13,
    color: '#4B5563',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  dateField: {
    marginTop: 8,
    marginBottom: 16,
  },
  endDateField: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginTop: 16,
  },
  dateLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
  },
  switchDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },
  info: {
    marginTop: 10,
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
