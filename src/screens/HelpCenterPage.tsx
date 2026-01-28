import AppButton from '@/src/components/ui/AppButton';
import AppText from '@/src/components/ui/AppText';
import HelpCenterPageCard from '@/src/components/ui/HelpCenterPageCard';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

export default function HelpCenterPage() {
    // Force light theme colors
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Feather name="chevron-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <AppText size="h3" weight="bold" style={[styles.headerTitle, { color: theme.colors.text }]}>
                    Help center
                </AppText>
                <View style={styles.backButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
                    <Feather name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        placeholder="How can we help you?"
                        placeholderTextColor={theme.colors.textMuted}
                        style={[styles.searchInput, { color: theme.colors.text }]}
                    />
                </View>

                {/* Frequently Asked Questions */}
                <View style={styles.section}>
                    <AppText size="h3" weight="bold" style={{ color: theme.colors.text, marginBottom: 16 }}>
                        Frequently Asked Questions
                    </AppText>

                    <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <HelpCenterPageCard
                            type="faq"
                            title="How do I cancel a booking?"
                            answer="You can cancel a booking by going to 'My Bookings', selecting the active booking, and tapping 'Cancel Booking'. Cancellation fees may apply depending on the timing."
                        />
                        <HelpCenterPageCard
                            type="faq"
                            title="How can I update my payment method?"
                            answer="Go to 'Profile' > 'Payment Methods' to add, remove, or update your cards and other payment options."
                        />
                        <HelpCenterPageCard
                            type="faq"
                            title="Where can I see my payment history?"
                            answer="Your payment history is available under 'Profile' > 'Payment History'. You can view and download invoices there."
                        />
                        <HelpCenterPageCard
                            type="faq"
                            title="I'm having a technical issue with the app."
                            answer="Please try clearing the app cache or reinstalling the app. If the issue persists, contact our support team via the 'Call Us' or 'Email Us' options below."
                        />
                    </View>
                </View>

                {/* Need More Help? */}
                <View style={styles.section}>
                    <AppText size="h3" weight="bold" style={{ color: theme.colors.text, marginBottom: 16 }}>
                        Need More Help?
                    </AppText>

                    <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16 }]}>
                        <HelpCenterPageCard
                            type="contact"
                            title="Call Us"
                            subtitle="Speak with our team directly."
                            icon="phone"
                        />
                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                        <HelpCenterPageCard
                            type="contact"
                            title="Email Us"
                            subtitle="Get a response within 24 hours."
                            icon="mail"
                        />
                    </View>
                </View>

                {/* Create a Support Ticket */}
                <View style={styles.ticketSection}>
                    <AppText size="h3" weight="bold" style={{ color: theme.colors.text, textAlign: 'center', marginBottom: 8 }}>
                        Create a Support Ticket
                    </AppText>
                    <AppText size="body" style={{ color: theme.colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
                        Get a detailed response from our team for complex issues.
                    </AppText>

                    <AppButton
                        title="Submit a New Ticket"
                        onPress={() => { }}
                        style={{ backgroundColor: theme.colors.primaryDark, width: '100%' }}
                        textStyle={{ color: theme.colors.text }}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 32,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'System', // Or your app's font
    },
    section: {
        marginBottom: 32,
    },
    cardContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 4,
    },
    ticketSection: {
        alignItems: 'center',
        marginTop: 8,
    },
});
