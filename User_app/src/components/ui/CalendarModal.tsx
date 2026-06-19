import { useTheme } from '@/src/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import AppText from './AppText';

interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    selectedDate: Date | null;
}

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarModal({ visible, onClose, onSelect, selectedDate }: CalendarModalProps) {
    const { theme } = useTheme();

    // State for the currently displayed month/year
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        if (visible) {
            setViewDate(selectedDate || new Date());
        }
    }, [visible, selectedDate]);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const changeMonth = (increment: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + increment, 1);

        const today = new Date();
        const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Next month

        if (newDate < minDate || newDate > maxDate) return;

        setViewDate(newDate);
    };

    const handleDayPress = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onSelect(newDate);
        onClose();
    };

    const renderDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = new Date(year, month, i);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today to midnight

            const isPast = currentDate < today;

            const isSelected = selectedDate &&
                selectedDate.getDate() === i &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

            // Check if today
            const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;

            days.push(
                <TouchableOpacity
                    key={i}
                    disabled={isPast}
                    style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
                    ]}
                    onPress={() => handleDayPress(i)}
                >
                    <AppText
                        style={[
                            styles.dayText,
                            isPast && { color: theme.dark ? "#555" : "#ccc" }, // Adjust grey for dark mode
                            isSelected && { color: theme.colors.surface, fontWeight: 'bold' },
                            !isSelected && !isPast && isToday && { color: theme.colors.primary, fontWeight: 'bold' },
                            !isSelected && !isPast && !isToday && { color: theme.colors.text }
                        ]}
                    >
                        {i}
                    </AppText>
                </TouchableOpacity>
            );
        }

        return days;
    };

    // Need to access theme in styles or use inline styles for dynamic theming
    const dynamicStyles = {
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            width: '100%',
            maxWidth: 350,
            elevation: 5,
            shadowColor: theme.colors.cardShadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        } as unknown as import('react-native').ViewStyle,
        arrowColor: theme.colors.text,
        textDefault: theme.colors.text,
    };

    // Navigation constraints
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const canGoBack = viewDate > minDate;
    const canGoForward = viewDate < maxDate;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={dynamicStyles.container}>

                            {/* Header */}
                            <View style={styles.header}>
                                <TouchableOpacity
                                    onPress={() => changeMonth(-1)}
                                    style={styles.arrowBtn}
                                    disabled={!canGoBack}
                                >
                                    <Ionicons
                                        name="chevron-back"
                                        size={20}
                                        color={canGoBack ? dynamicStyles.arrowColor : theme.colors.textMuted}
                                    />
                                </TouchableOpacity>

                                <AppText weight="bold" size="h3" style={{ color: theme.colors.text }}>
                                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                                </AppText>

                                <TouchableOpacity
                                    onPress={() => changeMonth(1)}
                                    style={styles.arrowBtn}
                                    disabled={!canGoForward}
                                >
                                    <Ionicons
                                        name="chevron-forward"
                                        size={20}
                                        color={canGoForward ? dynamicStyles.arrowColor : theme.colors.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Week Days Header */}
                            <View style={styles.weekRow}>
                                {weekDays.map(day => (
                                    <AppText key={day} style={styles.weekDayText} color="textMuted">{day}</AppText>
                                ))}
                            </View>

                            {/* Days Grid */}
                            <View style={styles.daysGrid}>
                                {renderDays()}
                            </View>

                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    // Removed static container style, moved to dynamicStyles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    arrowBtn: {
        padding: 10,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    weekDayText: {
        width: 30,
        textAlign: 'center',
        fontSize: 12,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
    },
    dayText: {
        fontSize: 14,
    }
});
