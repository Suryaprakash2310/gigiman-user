import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppText from '../../components/ui/AppText';
import { useRecurringStore } from '../../store/recurringStore';
import PrimaryButton from '../../components/recurring/PrimaryButton';
import SectionHeader from '../../components/recurring/SectionHeader';
import InfoCard from '../../components/recurring/InfoCard';
import CalendarModal from '../../components/ui/CalendarModal';

export default function SetupSchedule() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editPlanId = route.params?.editPlanId;

  const { draft, updateDraft } = useRecurringStore();
  const isEveryday = draft.frequency === 'everyday';

  // State values
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(
    isEveryday ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Mon', 'Wed', 'Fri']
  );
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showStartCalendar, setShowStartCalendar] = useState<boolean>(false);
  const [showEndCalendar, setShowEndCalendar] = useState<boolean>(false);

  // Load draft values if they exist
  useEffect(() => {
    // Set default start date to tomorrow and end date to 1 month from tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const oneMonthLater = new Date(tomorrow);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const oneMonthStr = oneMonthLater.toISOString().split('T')[0];

    setStartDate(tomorrowStr);
    setEndDate(oneMonthStr);

    if (isEveryday) {
      setSelectedWeekdays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    }

    if (draft.schedule) {
      const sch = draft.schedule;
      if (isEveryday) {
        setSelectedWeekdays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
      } else if (sch.weekdays && sch.weekdays.length > 0) {
        setSelectedWeekdays(sch.weekdays);
      }
      if (sch.time) setSelectedTime(sch.time);
      if (sch.startDate) setStartDate(sch.startDate);
      if (sch.endDate) setEndDate(sch.endDate);
    }
  }, [draft.schedule, draft.frequency]);

  const toggleWeekday = (day: string) => {
    if (isEveryday) {
      // For everyday, Mon-Sat are all selected, Sunday is excluded
      return;
    }
    if (selectedWeekdays.includes(day)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, day]);
    }
  };

  const handleContinue = () => {
    const finalWeekdays = isEveryday 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : selectedWeekdays;

    const scheduleData = {
      weekdays: finalWeekdays,
      time: selectedTime,
      startDate: startDate,
      endDate: endDate,
      isNoEndDate: false,
    };

    updateDraft({ schedule: scheduleData });
    navigation.navigate('CleanerPreference', { editPlanId });
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Separated time slots between 10:00 AM and 06:00 PM
  const timeSlots = [
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
  ];

  const isFormValid = () => {
    if (selectedWeekdays.length === 0) return false;
    if (!startDate || !startDate.trim()) return false;
    if (!endDate || !endDate.trim()) return false;
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
      if (e < s) return false;
    } catch {
      return false;
    }
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
            subtitle="Configure days, time slots, and plan duration."
          />

          {/* Weekdays Selector */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="calendar-outline" size={18} color="#0F6A4B" />
              <AppText weight="bold" style={styles.sectionLabel}>
                {isEveryday ? 'Scheduled Days (Mon - Sat)' : 'Select Custom Days (Mon - Sat)'}
              </AppText>
            </View>
            <AppText style={styles.sectionHint}>
              {isEveryday 
                ? 'Every day from Monday to Saturday is automatically included (Sundays excluded).'
                : 'Select specific weekdays for your recurring cleanings (Sundays excluded).'}
            </AppText>
            
            <View style={styles.weekdayGrid}>
              {daysOfWeek.map((day) => {
                const isSelected = selectedWeekdays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    activeOpacity={isEveryday ? 1 : 0.8}
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
            <View style={styles.everydayNote}>
              <Ionicons name="information-circle-outline" size={14} color="#0F6A4B" />
              <AppText style={styles.everydayNoteText}>
                Sundays are non-working days. All cleanings occur between Monday and Saturday.
              </AppText>
            </View>
          </View>

          {/* Time Picker Slots (10:00 AM - 06:00 PM separated) */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="time-outline" size={18} color="#0F6A4B" />
              <AppText weight="bold" style={styles.sectionLabel}>
                Preferred Service Time (10 AM - 6 PM)
              </AppText>
            </View>
            <AppText style={styles.sectionHint}>
              Choose a separated 1-hour time slot for cleaner arrival.
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

          {/* Dates Setup (Mandatory Start and End Dates) */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="calendar" size={18} color="#0F6A4B" />
              <AppText weight="bold" style={styles.sectionLabel}>
                Plan Duration (Mandatory)
              </AppText>
            </View>
            <AppText style={styles.sectionHint}>
              Select the start date and ending date for your recurring plan.
            </AppText>

            {/* Start Date */}
            <View style={styles.dateField}>
              <AppText weight="semibold" style={styles.dateLabel}>
                Start Date (YYYY-MM-DD) *
              </AppText>
              <TouchableOpacity
                style={styles.dateInputTouchable}
                activeOpacity={0.8}
                onPress={() => setShowStartCalendar(true)}
              >
                <View style={styles.dateDisplayBox}>
                  <AppText style={styles.dateDisplayText}>
                    {startDate || 'Select start date'}
                  </AppText>
                  <Ionicons name="calendar-outline" size={20} color="#0F6A4B" />
                </View>
              </TouchableOpacity>
            </View>

            {/* End Date (Mandatory) */}
            <View style={[styles.dateField, styles.endDateField]}>
              <AppText weight="semibold" style={styles.dateLabel}>
                End Date (YYYY-MM-DD) *
              </AppText>
              <TouchableOpacity
                style={styles.dateInputTouchable}
                activeOpacity={0.8}
                onPress={() => setShowEndCalendar(true)}
              >
                <View style={styles.dateDisplayBox}>
                  <AppText style={styles.dateDisplayText}>
                    {endDate || 'Select end date'}
                  </AppText>
                  <Ionicons name="calendar-outline" size={20} color="#0F6A4B" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <InfoCard 
            text="Your recurring cleaning subscription will be automatically generated between your selected start and end dates."
            style={styles.info}
          />
        </View>
      </ScrollView>

      {/* Start Date Calendar Modal */}
      <CalendarModal
        visible={showStartCalendar}
        minDate={new Date()}
        selectedDate={startDate ? new Date(startDate) : new Date()}
        onClose={() => setShowStartCalendar(false)}
        onSelect={(date) => {
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          const newStart = `${yyyy}-${mm}-${dd}`;
          setStartDate(newStart);

          // If current endDate is before newStart, advance endDate by 1 month
          if (endDate) {
            const currentEnd = new Date(endDate);
            if (currentEnd <= date) {
              const nextMonth = new Date(date);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              const endY = nextMonth.getFullYear();
              const endM = String(nextMonth.getMonth() + 1).padStart(2, '0');
              const endD = String(nextMonth.getDate()).padStart(2, '0');
              setEndDate(`${endY}-${endM}-${endD}`);
            }
          }
          setShowStartCalendar(false);
        }}
      />

      {/* End Date Calendar Modal */}
      <CalendarModal
        visible={showEndCalendar}
        minDate={startDate ? new Date(startDate) : new Date()}
        selectedDate={endDate ? new Date(endDate) : (startDate ? new Date(startDate) : new Date())}
        onClose={() => setShowEndCalendar(false)}
        onSelect={(date) => {
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          setEndDate(`${yyyy}-${mm}-${dd}`);
          setShowEndCalendar(false);
        }}
      />

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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  weekdayBtnDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.4,
  },
  weekdayTextDisabled: {
    color: '#9CA3AF',
  },
  everydayNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  everydayNoteText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
  },
  dateInputTouchable: {
    width: '100%',
  },
  dateDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  dateDisplayText: {
    fontSize: 14,
    color: '#1F2937',
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
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
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
