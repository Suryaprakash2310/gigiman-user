import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

export interface Ticket {
    id: string;
    issueType: string;
    bookingId?: string;
    status: 'Pending' | 'In Review' | 'Resolved';
    date: string;
    description: string;
    adminResponse?: string;
}

export const MOCK_TICKETS: Ticket[] = [
    {
        id: 'TKT-99321',
        issueType: 'Service Quality',
        bookingId: 'BOK-123456',
        status: 'Resolved',
        date: '10 Mar 2026',
        description: 'The driver was very rude and drove recklessly during the trip.',
        adminResponse: 'We sincerely apologize for the experience. The driver has been suspended pending review, and we have refunded your trip amount.',
    },
    {
        id: 'TKT-99324',
        issueType: 'Payment Issue',
        status: 'In Review',
        date: '12 Mar 2026',
        description: 'I was double charged for my last ride. I see two transactions on my credit card statement.',
        adminResponse: 'We are investigating this with our payment provider. This usually takes 2-3 business days.',
    },
    {
        id: 'TKT-99330',
        issueType: 'Technical Issue',
        status: 'Pending',
        date: '14 Mar 2026',
        description: 'The app keeps crashing when I try to save a new address.',
    }
];

export default function SupportTicketsScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const handleBack = () => {
        navigation.goBack();
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Resolved': return theme.colors.success;
            case 'In Review': return theme.colors.accent; // fallback for warning
            case 'Pending': return theme.colors.primary;
            default: return theme.colors.textMuted;
        }
    };

    const renderTicket = ({ item }: { item: Ticket }) => (
        <TouchableOpacity 
            style={[styles.ticketCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TicketDetailScreen', { ticket: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.idContainer}>
                    <Feather name="file-text" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <AppText size="body" weight="medium" style={{ color: theme.colors.text }}>
                        {item.id}
                    </AppText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <AppText size="caption" weight="medium" style={{ color: getStatusColor(item.status) }}>
                        {item.status}
                    </AppText>
                </View>
            </View>
            
            <View style={styles.cardBody}>
                <AppText size="body" weight="medium" style={{ color: theme.colors.text, marginBottom: 4 }}>
                    {item.issueType}
                </AppText>
                <AppText size="caption" style={{ color: theme.colors.textMuted, marginBottom: 8 }} numberOfLines={1}>
                    {item.description}
                </AppText>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
                <AppText size="caption" style={{ color: theme.colors.textMuted }}>
                    Created: {item.date}
                </AppText>
                <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
            </View>
        </TouchableOpacity>
    );

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
                    My Support Tickets
                </AppText>
                <View style={styles.backButton} />
            </View>

            <FlatList
                contentContainerStyle={styles.listContent}
                data={MOCK_TICKETS}
                keyExtractor={(item) => item.id}
                renderItem={renderTicket}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                         <Feather name="inbox" size={48} color={theme.colors.border} style={{ marginBottom: 16 }} />
                         <AppText size="body" style={{ color: theme.colors.textMuted }}>
                            You have no support tickets yet.
                         </AppText>
                    </View>
                )}
            />
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
        zIndex: 10,
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
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    ticketCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cardBody: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
