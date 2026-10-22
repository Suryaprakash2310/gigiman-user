import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import apiClient from '@/src/api/client';

export interface ShiftSlotData {
  slotId: string;
  label: string;
  startHour: number;
  endHour: number;
  timeString: string;
  isAvailable: boolean;
  isPast?: boolean;
  isBufferRestricted?: boolean;
  availableWorkersCount: number;
}

export interface DaySlotData {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  displayTitle: string;
  isToday: boolean;
  dayOffset: number;
  slots: ShiftSlotData[];
  acceptedSlotsCount?: number;
}

interface ScheduleSelectorProps {
  isInstant?: boolean;
  serviceCategoryId?: string;
  domainServiceId?: string;
  selectedDate: Date | null;
  selectedTime: Date | null;
  onDatePress?: () => void;
  onTimePress?: () => void;
  onSelectSlot?: (date: Date, time: Date, slotId: string, slotLabel: string) => void;
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  isInstant = false,
  serviceCategoryId,
  domainServiceId,
  selectedDate,
  selectedTime,
  onDatePress,
  onTimePress,
  onSelectSlot,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState<boolean>(true);
  const [daysData, setDaysData] = useState<DaySlotData[]>([]);
  const [selectedScheduleDayIndex, setSelectedScheduleDayIndex] = useState<number>(0);

  // Helper to format startHour into clean "10:00 AM", "01:00 PM"
  const formatSlotTime = useCallback((startHour: number) => {
    const ampm = startHour >= 12 ? 'PM' : 'AM';
    const displayHour = startHour % 12 === 0 ? 12 : startHour % 12;
    return `${String(displayHour).padStart(2, '0')}:00 ${ampm}`;
  }, []);

  // Fetch 4-day horizon slots from backend API based strictly on available employees
  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/shift/slots/available', {
        params: {
          onlyAccepted: 'true',
          serviceCategoryId: serviceCategoryId && serviceCategoryId !== 'cart' ? serviceCategoryId : undefined,
          domainServiceId: domainServiceId || undefined,
        },
      });

      if (res?.data?.success && Array.isArray(res?.data?.data) && res.data.data.length > 0) {
        setDaysData(res.data.data);
      } else {
        setDaysData([]);
      }
    } catch (err) {
      console.log('Error fetching shift slots:', err);
      setDaysData([]);
    } finally {
      setLoading(false);
    }
  }, [serviceCategoryId, domainServiceId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Today data (dayOffset === 0)
  const todayData: DaySlotData | undefined = useMemo(() => {
    return daysData.find((d) => d.isToday) || daysData[0];
  }, [daysData]);

  // Future days for Schedule Later: Tomorrow, Next Day, After Next Day (EXCLUDES TODAY)
  const scheduleDays: DaySlotData[] = useMemo(() => {
    return daysData.filter((d) => !d.isToday);
  }, [daysData]);

  // Tomorrow data (dayOffset === 1)
  const tomorrowData: DaySlotData | undefined = useMemo(() => {
    return daysData.find((d) => d.dayOffset === 1) || scheduleDays[0];
  }, [daysData, scheduleDays]);

  // Today accepted slots check
  const todayAcceptedSlots = useMemo(() => {
    if (!todayData || !Array.isArray(todayData.slots)) return [];
    return todayData.slots.filter(
      (slot) => slot.availableWorkersCount > 0 && slot.isAvailable && !slot.isPast && !slot.isBufferRestricted
    );
  }, [todayData]);

  // If employees are already available today, show today!
  // If NOT slot available today, book/show Tomorrow slot to the user!
  const isTodayAvailable = todayAcceptedSlots.length > 0;

  // Active day determined by mode:
  // 1) Instant Mode: Today if available; else fallback to Tomorrow
  // 2) Schedule Later Mode: Tomorrow, Next Day, After Next Day (never Today)
  const currentDay: DaySlotData | undefined = useMemo(() => {
    if (isInstant) {
      return isTodayAvailable ? todayData : tomorrowData;
    }
    return scheduleDays[selectedScheduleDayIndex] || scheduleDays[0];
  }, [isInstant, isTodayAvailable, todayData, tomorrowData, scheduleDays, selectedScheduleDayIndex]);

  // STRICT RULE: If servicer did NOT accept the slot, DO NOT show it in the user app!
  const visibleAcceptedSlots = useMemo(() => {
    if (!currentDay || !Array.isArray(currentDay.slots)) return [];
    return currentDay.slots.filter(
      (slot) => slot.availableWorkersCount > 0 && slot.isAvailable && !slot.isPast && !slot.isBufferRestricted
    );
  }, [currentDay]);

  // Auto-select earliest accepted slot for instant or scheduled mode if none selected
  useEffect(() => {
    if (visibleAcceptedSlots.length > 0 && !selectedTime && onSelectSlot && currentDay) {
      const earliest = visibleAcceptedSlots[0];
      const parts = currentDay.date.split('-');
      const slotDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      slotDate.setHours(earliest.startHour, 0, 0, 0);

      onSelectSlot(
        slotDate,
        slotDate,
        earliest.slotId,
        formatSlotTime(earliest.startHour)
      );
    }
  }, [isInstant, visibleAcceptedSlots, selectedTime, onSelectSlot, currentDay, formatSlotTime]);

  // Handle day tab click for Schedule Later mode
  const handleScheduleDaySelect = (index: number) => {
    setSelectedScheduleDayIndex(index);
    const targetDay = scheduleDays[index];
    if (targetDay && onSelectSlot) {
      const parts = targetDay.date.split('-');
      const dayDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (selectedTime) {
        const updatedTime = new Date(dayDate);
        updatedTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
        onSelectSlot(dayDate, updatedTime, '', '');
      } else {
        onSelectSlot(dayDate, dayDate, '', '');
      }
    }
  };

  // Handle slot click
  const handleSlotSelect = (slot: ShiftSlotData) => {
    if (!currentDay || !onSelectSlot) return;

    const parts = currentDay.date.split('-');
    const chosenDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    chosenDate.setHours(slot.startHour, 0, 0, 0);

    const chosenTime = new Date(chosenDate);
    chosenTime.setHours(slot.startHour, 0, 0, 0);

    const slotLabel = formatSlotTime(slot.startHour);
    onSelectSlot(chosenDate, chosenTime, slot.slotId, slotLabel);
  };

  const formatDateDisplay = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeDisplay = (time: Date) => {
    return time.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons
            name={isInstant ? 'flash' : 'calendar'}
            size={18}
            color={isInstant ? '#F59E0B' : (theme?.colors?.primary || '#26413C')}
          />
          <AppText weight="bold" size="body" style={[styles.title, { color: theme?.colors?.text || '#0F172A' }]}>
            {isInstant ? 'Select Instant Slot' : 'Schedule Later'}
          </AppText>
        </View>
        <AppText size="caption" color="textMuted">
          {isInstant
            ? (isTodayAvailable ? 'Today' : 'Tomorrow')
            : 'Next 3 Days'}
        </AppText>
      </View>

      {/* Fallback banner for Instant mode if today's slots are finished or unavailable */}
      {isInstant && !loading && !isTodayAvailable && (
        <View style={styles.fallbackNoticeBox}>
          <Ionicons name="information-circle" size={16} color="#D97706" />
          <AppText size="caption" weight="medium" style={{ color: '#B45309', marginLeft: 6, flex: 1 }}>
            No slots available today. Showing Tomorrow's earliest booking slots:
          </AppText>
        </View>
      )}

      {/* Schedule Later Mode: 3 Future Days (Tomorrow, Next Day, After Next Day) - NOT TODAY */}
      {!isInstant && scheduleDays.length > 0 && (
        <View style={styles.daysRow}>
          {scheduleDays.slice(0, 3).map((dayItem, index) => {
            const isSelected = selectedScheduleDayIndex === index;
            const parts = dayItem.date.split('-');
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            const subtitle = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

            return (
              <TouchableOpacity
                key={dayItem.date}
                style={[
                  styles.dayCard,
                  isSelected && styles.dayCardActive,
                ]}
                onPress={() => handleScheduleDaySelect(index)}
                activeOpacity={0.7}
              >
                <AppText
                  weight="bold"
                  size="caption"
                  style={[
                    styles.dayCardTitle,
                    isSelected && { color: theme?.colors?.primary || '#26413C' },
                  ]}
                >
                  {dayItem.displayTitle}
                </AppText>
                <AppText
                  size="caption"
                  style={[
                    styles.dayCardSubtitle,
                    isSelected && { color: theme?.colors?.text || '#0F172A' },
                  ]}
                >
                  {subtitle}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme?.colors?.primary || '#26413C'} />
          <AppText size="caption" color="textMuted" style={{ marginTop: 6 }}>
            Checking technician slots...
          </AppText>
        </View>
      ) : visibleAcceptedSlots.length > 0 ? (
        /* Rectangle Box Grid (10, 11, 12, 1, 2, 3, 4, 5) */
        /* Only accepted slots are shown! No mention of unaccepted or disabled slots */
        <View style={styles.slotsGrid}>
          {visibleAcceptedSlots.map((slot) => {
            const isSlotSelected =
              selectedTime &&
              selectedTime.getHours() === slot.startHour &&
              currentDay &&
              selectedDate &&
              selectedDate.toDateString() === new Date(
                Number(currentDay.date.split('-')[0]),
                Number(currentDay.date.split('-')[1]) - 1,
                Number(currentDay.date.split('-')[2])
              ).toDateString();

            return (
              <TouchableOpacity
                key={slot.slotId}
                onPress={() => handleSlotSelect(slot)}
                style={[
                  styles.slotBox,
                  isSlotSelected && styles.slotBoxActive,
                ]}
                activeOpacity={0.7}
              >
                <AppText
                  weight={isSlotSelected ? 'bold' : 'medium'}
                  size="caption"
                  style={[
                    styles.slotBoxText,
                    isSlotSelected && styles.slotBoxTextActive,
                  ]}
                >
                  {formatSlotTime(slot.startHour)}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Fallback when no servicer accepted slots for this day */
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={28} color="#94A3B8" />
          <AppText weight="bold" size="caption" style={{ color: '#64748B', marginTop: 6 }}>
            No slots available for this day
          </AppText>
          {!isInstant && (
            <AppText size="caption" color="textMuted" style={{ marginTop: 2, textAlign: 'center' }}>
              Please select another day to see available technician shifts.
            </AppText>
          )}
        </View>
      )}

      {/* Selected Slot Summary Badge */}
      {selectedTime && (
        <View style={styles.confirmationBox}>
          <Ionicons name="checkmark-circle" size={16} color={theme?.colors?.primary || '#26413C'} />
          <AppText size="caption" color="primary" weight="medium" style={{ marginLeft: 6 }}>
            Selected Slot: {formatDateDisplay(selectedDate || new Date())} • {formatTimeDisplay(selectedTime)}
          </AppText>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme?.spacing?.lg ?? 16,
      paddingVertical: theme?.spacing?.md ?? 12,
      marginVertical: theme?.spacing?.md ?? 12,
      backgroundColor: theme?.colors?.card || theme?.colors?.surface || '#FFFFFF',
      borderRadius: theme?.radius?.lg ?? 16,
      borderWidth: 1,
      borderColor: theme?.dark ? (theme?.colors?.border || '#334155') : '#EDF2F7',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 14,
    },
    fallbackNoticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      borderRadius: theme?.radius?.md ?? 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    daysRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    dayCard: {
      flex: 1,
      backgroundColor: theme?.dark ? '#1A202C' : '#F7FAFC',
      borderRadius: theme?.radius?.md ?? 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    dayCardActive: {
      borderColor: theme?.colors?.primary || '#26413C',
      backgroundColor: `${theme?.colors?.primary || '#26413C'}12`,
    },
    dayCardTitle: {
      color: theme?.colors?.text || '#0F172A',
      marginBottom: 2,
    },
    dayCardSubtitle: {
      color: '#718096',
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 10,
      marginVertical: 4,
    },
    slotBox: {
      width: '48%',
      height: 44,
      borderRadius: theme?.radius?.md ?? 10,
      borderWidth: 1.5,
      borderColor: theme?.dark ? '#334155' : '#E2E8F0',
      backgroundColor: theme?.dark ? '#1E293B' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotBoxActive: {
      borderColor: theme?.colors?.primary || '#26413C',
      backgroundColor: `${theme?.colors?.primary || '#26413C'}14`,
    },
    slotBoxText: {
      fontSize: 13,
      color: theme?.colors?.text || '#1E293B',
      letterSpacing: 0.3,
    },
    slotBoxTextActive: {
      color: theme?.colors?.primary || '#26413C',
      fontWeight: '700',
    },
    confirmationBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: `${theme?.colors?.primary || '#26413C'}0D`,
      borderRadius: theme?.radius?.md ?? 10,
    },
  });

export default ScheduleSelector;
