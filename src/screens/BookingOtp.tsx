import AppCard from '@/src/components/ui/AppCard';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import BookingDetailsCard from '../components/BookingDetailsCard';
import { useBooking } from '../context/BookingContext';

export default function BookingDetailsPage() {
    const { theme } = useTheme();
    const { ongoingBooking } = useBooking();
    // Animation values
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12 });
        opacity.value = withDelay(300, withSpring(1));
    }, []);

    const animatedCircleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const animatedContentStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: (1 - opacity.value) * 20 }],
        };
    });

    // Custom colors from design
    const brightCyan = '#67E8F9'; // Cyan 300 - brighter, softer
    const otpBg = '#A5F3FC'; // Cyan 200
    const primaryTeal = '#0D9488'; // Teal 600
    if (!ongoingBooking)
    return <AppText>No booking found</AppText>;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <View style={styles.header}>
                    <Animated.View style={[styles.checkCircle, { backgroundColor: brightCyan }, animatedCircleStyle]}>
                        <Ionicons name="checkmark" size={32} color="#0F172A" />
                    </Animated.View>
                    <AppText size="h3" weight="bold" style={styles.headerTitle}>
                        Technician Assigned!
                    </AppText>
                </View>

                <Animated.View style={animatedContentStyle}>
                    {/* Technician Card */}
                    <BookingDetailsCard
                        name="Arun Kumar"
                        role="Plumbing"
                        experience="5 years exp"
                        rating={4.95}
                        reviews={845}
                        image="https://randomuser.me/api/portraits/men/32.jpg"
                    />

                    {/* OTP Section */}
                    <View style={[styles.otpContainer, { backgroundColor: otpBg, borderColor: brightCyan }]}>
                        <AppText weight="bold" style={styles.otpLabel}>Your Booking OTP</AppText>
                        <AppText size="h1" weight="bold" style={styles.otpValue}>3479</AppText>
                        <AppText size="small" style={styles.otpInstruction}>Share this code with the technician</AppText>
                    </View>

                    {/* Arrival Section */}
                    <AppCard style={styles.arrivalCard}>
                        <View style={styles.arrivalHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: primaryTeal }]}>
                                <Ionicons name="chevron-down" size={20} color="white" />
                            </View>
                            <AppText size="h3" weight="bold" style={styles.arrivalText}>
                                Arriving in : 20-25 mins
                            </AppText>
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: brightCyan }]}>
                                <Ionicons name="call" size={20} color="#0F172A" style={{ marginRight: 8 }} />
                                <AppText weight="bold" style={{ color: '#0F172A' }}>Call</AppText>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCFBF1' }]}>
                                <Ionicons name="chatbubble-ellipses-outline" size={20} color={primaryTeal} style={{ marginRight: 8 }} />
                                <AppText weight="bold" style={{ color: primaryTeal }}>Chat</AppText>
                            </TouchableOpacity>
                        </View>

                        {/* Booking Summary */}
                        <View style={styles.summaryContainer}>
                            <AppText weight="bold" size="h3" style={styles.summaryTitle}>Booking Summary</AppText>

                            <View style={styles.summaryRow}>
                                <AppText style={{ color: '#475569' }}>Service</AppText>
                                <AppText style={{ color: '#475569' }}>Inverter Service</AppText>
                            </View>
                            <View style={styles.summaryRow}>
                                <AppText style={{ color: '#475569' }}>Price</AppText>
                                <AppText style={{ color: '#475569' }}>₹199</AppText>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={20} color={primaryTeal} style={styles.detailIcon} />
                                <View>
                                    <AppText color="textMuted" size="small">Address</AppText>
                                    <AppText weight="medium" style={styles.detailText}>123 Park Street, Sector 21,{'\n'}Bangalore</AppText>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="time-outline" size={20} color={primaryTeal} style={styles.detailIcon} />
                                <View>
                                    <AppText color="textMuted" size="small">Scheduled</AppText>
                                    <AppText weight="medium" style={styles.detailText}>Today, 3:00 PM</AppText>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="card-outline" size={20} color={primaryTeal} style={styles.detailIcon} />
                                <View>
                                    <AppText color="textMuted" size="small">Payment</AppText>
                                    <AppText weight="medium" style={styles.detailText}>Cash on Delivery</AppText>
                                </View>
                            </View>

                        </View>
                    </AppCard>
                </Animated.View>

            </ScrollView>

            {/* Footer Button */}
            <View style={[styles.footer, { backgroundColor: '#F8FAFC' }]}>
                <TouchableOpacity style={[styles.trackButton, { backgroundColor: brightCyan }]}>
                    <AppText weight="bold" size="h3" style={{ color: '#0F172A' }}>Track Technician</AppText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    checkCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#67E8F9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headerTitle: {
        textAlign: 'center',
        color: '#0F172A',
    },
    otpContainer: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginHorizontal: 4,
    },
    otpLabel: {
        marginBottom: 6,
        color: '#0F172A',
    },
    otpValue: {
        color: '#0F766E',
        marginBottom: 6,
        letterSpacing: 3,
    },
    otpInstruction: {
        opacity: 0.7,
        color: '#0F172A',
    },
    arrivalCard: {
        padding: 0,
        overflow: 'hidden',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 10,
        marginHorizontal: 4,
        marginBottom: 20,
        backgroundColor: 'white', // Force white background
    },
    arrivalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    arrivalText: {
        flex: 1,
        color: '#0F172A',
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 20,
        gap: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryContainer: {
        padding: 20,
        paddingTop: 0,
    },
    summaryTitle: {
        marginBottom: 16,
        color: '#0F172A',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    detailIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    detailText: {
        marginTop: 2,
        lineHeight: 20,
        color: '#0F172A',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    trackButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#67E8F9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
});