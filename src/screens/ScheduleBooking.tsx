import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import AppText from "@/src/components/ui/AppText";
import CalendarModal from "@/src/components/ui/CalendarModal";
import TimePickerModal from "@/src/components/ui/TimePickerModal";
import { AppTheme } from "@/src/theme";
import { useTheme } from "@/src/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScheduleBookingProps { }

const ScheduleBooking: React.FC<ScheduleBookingProps> = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const route = useRoute();
    // @ts-ignore
    const { serviceName } = route.params || { serviceName: "Service" };

    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [zip, setZip] = useState("");

    const [errors, setErrors] = useState<{ address?: string; city?: string; zip?: string }>({});

    const styles = createStyles(theme);

    const validate = () => {
        let valid = true;
        let newErrors: { address?: string; city?: string; zip?: string } = {};

        if (!address.trim()) {
            newErrors.address = "Address is required";
            valid = false;
        } else if (address.trim().length <= 5) {
            newErrors.address = "Address must be longer than 5 characters";
            valid = false;
        }

        if (!city.trim()) {
            newErrors.city = "City is required";
            valid = false;
        } else if (city.trim().length < 3) {
            newErrors.city = "City must be longer than 3 characters or more";
            valid = false;
        }

        if (!zip.trim()) {
            newErrors.zip = "ZIP code is required";
            valid = false;
        } else if (zip.trim().length !== 6) {
            newErrors.zip = "ZIP code must be exactly 6 digits";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleBook = () => {
        if (validate()) {
            Alert.alert(
                "Booking Confirmed",
                `Service: ${serviceName}\nDate: ${date.toDateString()}\nTime: ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\nAddress: ${address}, ${city}, ${zip}`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        }
    };

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={styles.headerContainer}>
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons name="chevron-back" size={24} color={theme.colors.surface} />
                        </TouchableOpacity>

                        <View style={{ marginTop: 20 }}>
                            <AppText style={styles.headerTitle} weight="bold">
                                Book {serviceName}
                            </AppText>
                            <AppText style={styles.headerSubtitle}>
                                Schedule your home service
                            </AppText>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Overlapping Form Card */}
            <View style={styles.formContainer}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Date Section */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                            <AppText style={styles.labelText}>Select Date</AppText>
                        </View>

                        <TouchableOpacity
                            style={styles.dropdownInput}
                            onPress={() => setShowCalendar(true)}
                        >
                            <AppText style={styles.inputText}>{date.toDateString()}</AppText>
                            <Ionicons name="chevron-down" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        <CalendarModal
                            visible={showCalendar}
                            onClose={() => setShowCalendar(false)}
                            onSelect={(newDate) => setDate(newDate)}
                            selectedDate={date}
                        />
                    </View>

                    {/* Time Section */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                            <AppText style={styles.labelText}>Select Time</AppText>
                        </View>

                        <TouchableOpacity
                            style={styles.dropdownInput}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <AppText style={styles.inputText}>
                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </AppText>
                            <Ionicons name="chevron-down" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        <TimePickerModal
                            visible={showTimePicker}
                            onClose={() => setShowTimePicker(false)}
                            onSelect={(newTime) => setTime(newTime)}
                            selectedTime={time}
                            selectedDate={date}
                        />
                    </View>

                    {/* Address Section */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                            <AppText style={styles.labelText}>Service Address</AppText>
                        </View>

                        <AppInput
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Enter Address"
                            error={errors.address}
                            style={{ marginBottom: 0 }}
                            maxLength={100}
                        />

                        <View style={styles.rowInputs}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <AppInput
                                    value={city}
                                    onChangeText={setCity}
                                    placeholder="City"
                                    error={errors.city}
                                    style={{ marginBottom: 0 }}
                                    maxLength={50}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <AppInput
                                    value={zip}
                                    onChangeText={setZip}
                                    placeholder="ZIP code"
                                    keyboardType="numeric"
                                    error={errors.zip}
                                    style={{ marginBottom: 0 }}
                                    maxLength={6}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />

                </ScrollView>
            </View>

            {/* Bottom Button */}
            <View style={styles.footer}>
                <AppButton
                    title="Book Appointment"
                    onPress={handleBook}
                    style={styles.bookButton}
                    textStyle={styles.bookButtonText}
                />
            </View>
        </View>
    );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerContainer: {
        backgroundColor: theme.colors.primary,
        height: 200,
        paddingHorizontal: theme.spacing.lg,
    },
    headerContent: {
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.h1 ? theme.typography.h1 - 4 : 24, // Fallback if undefined but h1 is usually ~28
        color: theme.colors.surface,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: theme.typography.body,
        color: "rgba(255,255,255,0.8)", // Keep this translucent white for header text on primary color
    },
    formContainer: {
        flex: 1,
        marginTop: -40,
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        marginHorizontal: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
        elevation: 5,
        shadowColor: theme.colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    inputGroup: {
        marginBottom: theme.spacing.lg,
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    labelText: {
        marginLeft: 10,
        fontSize: theme.typography.h3,
        color: theme.colors.textMuted,
        fontWeight: "500",
    },
    dropdownInput: {
        backgroundColor: theme.dark ? theme.colors.background : "#F8F9FA",
        borderRadius: theme.radius.md,
        padding: theme.spacing.md, // 16 matches md+4 or assume spacing.md=12, padding 16 is close to spacing.lg(20) or custom
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    inputText: {
        fontSize: theme.typography.body,
        color: theme.colors.text,
    },
    rowInputs: {
        flexDirection: "row",
        marginTop: theme.spacing.md,
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    bookButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 30, // Custom roundness for big button
        paddingVertical: 16,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    bookButtonText: {
        fontSize: theme.typography.h3,
        fontWeight: "bold",
        color: theme.colors.surface,
    }
});

export default ScheduleBooking;
