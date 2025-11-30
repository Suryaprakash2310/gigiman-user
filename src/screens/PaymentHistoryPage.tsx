import AppText from '@/src/components/ui/AppText';
import BookingCard from '@/src/components/ui/BookingCard';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

// Mock Data matching the design image fields
const TRANSACTIONS = [
    {
        id: '1',
        serviceName: 'Home Cleaning',
        date: 'Wed, Oct 10',
        time: '10:00 AM',
        amount: '₹149',
        status: 'Paid' as const,
        paymentInfo: 'Visa **** 1234',
    },
    {
        id: '2',
        serviceName: 'Plumbing',
        date: 'Wed, Oct 10',
        time: '10:00 AM',
        amount: '₹149',
        status: 'Failed' as const,
        paymentInfo: 'Card decline',
    },
    {
        id: '3',
        serviceName: 'Electrical Maintenance',
        date: 'Mon, Oct 08',
        time: '11:15 AM',
        amount: '₹200',
        status: 'Paid' as const,
        paymentInfo: 'Visa **** 1234',
    },
    {
        id: '4',
        serviceName: 'AC Repair',
        date: 'Fri, Oct 05',
        time: '09:00 AM',
        amount: '₹500',
        status: 'Paid' as const,
        paymentInfo: 'Cash',
    },
    {
        id: '5',
        serviceName: 'Gardening',
        date: 'Tue, Oct 02',
        time: '04:30 PM',
        amount: '₹350',
        status: 'Paid' as const,
        paymentInfo: 'Visa **** 1234',
    },
];

export default function PaymentHistoryPage() {
    // Force light theme colors
    const themeColors = {
        background: '#F9FAFB',
        surface: '#FFFFFF',
        text: '#0F172A',
        border: '#E2E8F0',
    };

    const navigation = useNavigation();

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Feather name="chevron-left" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <AppText size="h3" weight="bold" style={{ color: themeColors.text, flex: 1, textAlign: 'center', marginRight: 40 }}>
                    Payment History
                </AppText>
            </View>

            {/* Content */}
            <FlatList
                data={TRANSACTIONS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <BookingCard
                        amount={item.amount}
                        date={item.date}
                        time={item.time}
                        status={item.status}
                        serviceName={item.serviceName}
                        paymentInfo={item.paymentInfo}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
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
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
});
