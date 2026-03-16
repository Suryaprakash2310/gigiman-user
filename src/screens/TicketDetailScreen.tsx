import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { Ticket } from './SupportTicketsScreen';

export default function TicketDetailScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    
    // In a real app we'd type the navigation route
    const route = useRoute<any>();
    const ticket: Ticket = route.params?.ticket;

    const handleBack = () => {
        navigation.goBack();
    };

    if (!ticket) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <AppText size="body" style={{ color: theme.colors.textMuted }}>Ticket not found.</AppText>
                <TouchableOpacity onPress={handleBack} style={{ marginTop: 16 }}>
                    <AppText size="body" weight="medium" style={{ color: theme.colors.primary }}>Go Back</AppText>
                </TouchableOpacity>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Resolved': return theme.colors.success;
            case 'In Review': return theme.colors.accent; // fallback for warning
            case 'Pending': return theme.colors.primary;
            default: return theme.colors.textMuted;
        }
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
                    Ticket Details
                </AppText>
                <View style={styles.backButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Status Header Card */}
                <View style={[styles.detailCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={styles.cardHeader}>
                         <View style={styles.idContainer}>
                            <Feather name="file-text" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                            <AppText size="h3" weight="bold" style={{ color: theme.colors.text }}>
                                {ticket.id}
                            </AppText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                            <AppText size="caption" weight="medium" style={{ color: getStatusColor(ticket.status) }}>
                                {ticket.status}
                            </AppText>
                        </View>
                    </View>

                    <View style={styles.dividerContainer}>
                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    </View>

                    <View style={styles.infoRow}>
                        <Feather name="calendar" size={16} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                        <AppText size="body" style={{ color: theme.colors.textMuted }}>
                            Submitted on {ticket.date}
                        </AppText>
                    </View>
                </View>

                {/* Issue Details Card */}
                <View style={[styles.detailCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <AppText size="h3" weight="bold" style={{ color: theme.colors.text, marginBottom: 16 }}>
                        Issue Details
                    </AppText>
                    
                    <View style={styles.detailGroup}>
                        <AppText size="caption" style={{ color: theme.colors.textMuted, marginBottom: 4 }}>
                            Issue Type
                        </AppText>
                        <AppText size="body" weight="medium" style={{ color: theme.colors.text }}>
                            {ticket.issueType}
                        </AppText>
                    </View>

                    {ticket.bookingId && (
                        <View style={styles.detailGroup}>
                            <AppText size="caption" style={{ color: theme.colors.textMuted, marginBottom: 4 }}>
                                Related Booking
                            </AppText>
                            <AppText size="body" weight="medium" style={{ color: theme.colors.text }}>
                                {ticket.bookingId}
                            </AppText>
                        </View>
                    )}

                    <View style={styles.detailGroup}>
                        <AppText size="caption" style={{ color: theme.colors.textMuted, marginBottom: 4 }}>
                            Description
                        </AppText>
                        <AppText size="body" style={{ color: theme.colors.text, lineHeight: 22 }}>
                            {ticket.description}
                        </AppText>
                    </View>
                </View>

                {/* Admin Response Card */}
                {ticket.adminResponse && (
                    <View style={[
                        styles.detailCard, 
                        { 
                            backgroundColor: theme.colors.primary + '10', 
                            borderColor: theme.colors.primary + '30' 
                        }
                    ]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Feather name="message-circle" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                            <AppText size="h3" weight="bold" style={{ color: theme.colors.text }}>
                                Support Response
                            </AppText>
                        </View>
                        <AppText size="body" style={{ color: theme.colors.text, lineHeight: 22 }}>
                            {ticket.adminResponse}
                        </AppText>
                    </View>
                )}

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
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    detailCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    dividerContainer: {
        marginVertical: 16,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailGroup: {
        marginBottom: 16,
    }
});
