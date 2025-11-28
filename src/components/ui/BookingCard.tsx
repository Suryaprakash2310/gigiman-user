import AppText from '@/src/components/ui/AppText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
    amount: string;
    date: string;
    time: string;
    status: 'Paid' | 'Failed';
    serviceName: string;
    paymentInfo: string; // e.g., "Visa **** 1234" or "Card decline"
}

export default function BookingCard({
    amount,
    date,
    time,
    status,
    serviceName,
    paymentInfo,
}: Props) {
    // Force light theme colors
    const themeColors = {
        surface: '#FFFFFF',
        text: '#0F172A',
        textMuted: '#94A3B8', // Lighter gray for date/time
        border: '#E2E8F0',
        success: '#10B981',
        successBg: '#DCFCE7', // Light green bg
        danger: '#EF4444',
        dangerBg: '#FEE2E2', // Light red bg
        cardShadow: 'rgba(0,0,0,0.06)',
    };

    const isSuccess = status === 'Paid';

    return (
        <View style={[styles.card, { backgroundColor: themeColors.surface, shadowColor: themeColors.cardShadow }]}>

            {/* Top Row: Service Name */}
            <View style={styles.topRow}>
                <AppText size="h3" weight="bold" style={{ color: themeColors.text }}>
                    {serviceName}
                </AppText>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

            {/* Middle Row: Date/Time and Amount */}
            <View style={styles.middleRow}>
                <View>
                    <AppText size="small" style={{ color: themeColors.textMuted }}>
                        {date}
                    </AppText>
                    <AppText size="small" style={{ color: themeColors.textMuted, marginTop: 2 }}>
                        {time}
                    </AppText>
                </View>
                <AppText size="body" weight="bold" style={{ color: themeColors.text }}>
                    {amount}
                </AppText>
            </View>

            {/* Bottom Row: Status and Payment Info */}
            <View style={styles.bottomRow}>
                {/* Status Badge */}
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: isSuccess ? themeColors.successBg : themeColors.dangerBg }
                ]}>
                    <AppText
                        size="small"
                        weight="bold"
                        style={{ color: isSuccess ? themeColors.success : themeColors.danger }}
                    >
                        {status}
                    </AppText>
                </View>

                {/* Payment Info */}
                <AppText size="small" weight="medium" style={{ color: themeColors.textMuted }}>
                    {paymentInfo}
                </AppText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
        marginHorizontal: 4,
    },
    topRow: {
        marginBottom: 12,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 12,
    },
    middleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align items to top in case of multiline
        marginBottom: 16,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
});
