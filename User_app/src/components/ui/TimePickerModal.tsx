import { useTheme } from '@/src/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import AppText from './AppText';

interface TimePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    selectedTime: Date;
    selectedDate: Date;
}

export default function TimePickerModal({ visible, onClose, onSelect, selectedTime, selectedDate }: TimePickerModalProps) {
    const { theme } = useTheme();

    // Generate time slots from 8:00 AM to 9:00 PM
    const generateTimeSlots = () => {
        const slots = [];
        const startHour = 9;
        const endHour = 21; // 9 PM

        const now = new Date();
        const isToday = selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear();

        for (let h = startHour; h <= endHour; h++) {
            // :00 slot
            let d1 = createDateWithTime(h, 0);
            if (!isToday || d1 > now) {
                slots.push(d1);
            }

            // :30 slot
            if (h < endHour) {
                let d2 = createDateWithTime(h, 30);
                if (!isToday || d2 > now) {
                    slots.push(d2);
                }
            }
        }
        return slots;
    };

    const createDateWithTime = (hour: number, minute: number) => {
        const d = new Date();
        d.setHours(hour);
        d.setMinutes(minute);
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d;
    };

    const timeSlots = generateTimeSlots();

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const isSelected = (slotDate: Date) => {
        return slotDate.getHours() === selectedTime.getHours() && slotDate.getMinutes() === selectedTime.getMinutes();
    };

    const dynamicStyles = {
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            width: '100%',
            maxWidth: 340,
            maxHeight: '80%',
            elevation: 5,
            shadowColor: theme.colors.cardShadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        } as unknown as import('react-native').ViewStyle,
        slotItem: {
            backgroundColor: theme.dark ? theme.colors.background : '#f5f5f5',
        },
        iconColor: theme.colors.text
    };

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
                            <View style={styles.header}>
                                <AppText weight="bold" size="h3" style={{ color: theme.colors.text }}>Select Time</AppText>
                                <TouchableOpacity onPress={onClose}>
                                    <Ionicons name="close" size={24} color={dynamicStyles.iconColor} />
                                </TouchableOpacity>
                            </View>

                            <AppText style={styles.subText} color="textMuted">Available slots: 9:00 AM - 9:00 PM</AppText>

                            <FlatList
                                data={timeSlots}
                                keyExtractor={(item) => item.toISOString()}
                                showsVerticalScrollIndicator={false}
                                style={styles.list}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.slotItem,
                                            dynamicStyles.slotItem,
                                            isSelected(item) && { backgroundColor: theme.colors.primary }
                                        ]}
                                        onPress={() => {
                                            onSelect(item);
                                            onClose();
                                        }}
                                    >
                                        <AppText
                                            style={[
                                                styles.slotText,
                                                isSelected(item) && { color: theme.colors.surface, fontWeight: 'bold' },
                                                !isSelected(item) && { color: theme.colors.text }
                                            ]}
                                        >
                                            {formatTime(item)}
                                        </AppText>
                                        {isSelected(item) && <Ionicons name="checkmark" size={20} color={theme.colors.surface} />}
                                    </TouchableOpacity>
                                )}
                            />

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
    // Dynamic container styles handle background etc.
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    subText: {
        fontSize: 12,
        marginBottom: 15,
    },
    list: {
        width: '100%',
    },
    slotItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginVertical: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    slotText: {
        fontSize: 16,
    }
});
