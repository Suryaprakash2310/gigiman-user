import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { ticketApi } from '@/src/api/ticket.api';
import { Ticket } from '@/src/types/ticket';

export default function SupportTicketsScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTickets = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        try {
            const response = await ticketApi.getMyTickets();
            if (response.success) {
                setTickets(response.tickets);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTickets();
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchTickets(true);
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Resolved': return theme.colors.success;
            case 'In progress': return theme.colors.accent;
            case 'Open': return theme.colors.primary;
            case 'Closed': return theme.colors.textMuted;
            default: return theme.colors.textMuted;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const renderTicket = ({ item }: { item: Ticket }) => (
        <TouchableOpacity 
            style={[styles.ticketCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TicketDetailScreen', { ticketId: item._id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.idContainer}>
                    <Feather name="file-text" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <AppText size="body" weight="medium" style={{ color: theme.colors.text }}>
                        {item._id.substring(item._id.length - 8).toUpperCase()}
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
                    {item.category} - {item.supportType}
                </AppText>
                <AppText size="caption" style={{ color: theme.colors.textMuted, marginBottom: 8 }} numberOfLines={1}>
                    {item.message}
                </AppText>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
                <AppText size="caption" style={{ color: theme.colors.textMuted }}>
                    Created: {formatDate(item.createdAt)}
                </AppText>
                <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

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
                data={tickets}
                keyExtractor={(item) => item._id}
                renderItem={renderTicket}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
                }
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

