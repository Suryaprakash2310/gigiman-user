import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
    View, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    FlatList, 
    TextInput, 
    KeyboardAvoidingView, 
    Platform,
    Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { ticketApi } from '@/src/api/ticket.api';
import { Ticket, TicketMessage } from '@/src/types/ticket';
import { socket } from '@/src/socket/socket';

export default function TicketDetailScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<any>();
    
    const ticketId = route.params?.ticketId;
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    
    const flatListRef = useRef<FlatList>(null);

    const fetchTicketDetails = useCallback(async () => {
        if (!ticketId) return;
        setLoading(true);
        try {
            const response = await ticketApi.getTicketById(ticketId);
            if (response.success) {
                setTicket(response.ticket);
                setMessages(response.messages || []);
            }
        } catch (error) {
            console.error('Failed to fetch ticket details:', error);
            Alert.alert('Error', 'Failed to load ticket details.');
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    useEffect(() => {
        fetchTicketDetails();
        
        if (ticketId) {
            // Join ticket chat room
            socket.connect();
            socket.emit('join-ticket-chat', { ticketId });

            // Listen for new messages
            const handleNewMessage = (payload: { ticketId: string, message: TicketMessage }) => {
                if (payload.ticketId === ticketId) {
                    setMessages(prev => [...prev, payload.message]);
                }
            };

            socket.on('receive-ticket-chat-message', handleNewMessage);

            return () => {
                socket.off('receive-ticket-chat-message', handleNewMessage);
            };
        }
    }, [ticketId, fetchTicketDetails]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !ticketId || sending) return;

        setSending(true);
        try {
            // We use the socket to emit the message as per the backend handler
            socket.emit('send-ticket-chat-message', {
                ticketId,
                message: newMessage.trim(),
                type: 'text'
            });

            // Optimistically add the message or wait for socket response?
            // The backend socket handler emits "receive-ticket-chat-message" to EVERYONE ELSE.
            // So we should manually add our own message or the backend should confirm.
            // Let's call the API to send the message for better reliability and then clearing input.
            const response = await ticketApi.sendChatMessage(ticketId, newMessage.trim());
            if (response.success) {
                setMessages(prev => [...prev, response.message]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderMessage = ({ item }: { item: TicketMessage }) => {
        const isMe = item.senderModel === 'User';
        return (
            <View style={[
                styles.messageContainer, 
                isMe ? styles.myMessage : styles.theirMessage,
                { backgroundColor: isMe ? theme.colors.primary : theme.colors.surface }
            ]}>
                <AppText size="body" style={{ color: isMe ? '#FFFFFF' : theme.colors.text }}>
                    {item.message}
                </AppText>
                <AppText size="caption" style={{ 
                    color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textMuted,
                    alignSelf: 'flex-end',
                    marginTop: 4
                }}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </AppText>
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Status Header Card */}
            <View style={[styles.detailCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.idContainer}>
                        <Feather name="file-text" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                        <AppText size="h3" weight="bold" style={{ color: theme.colors.text }}>
                            {ticket!._id.substring(ticket!._id.length - 8).toUpperCase()}
                        </AppText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket!.status) + '20' }]}>
                        <AppText size="caption" weight="medium" style={{ color: getStatusColor(ticket!.status) }}>
                            {ticket!.status}
                        </AppText>
                    </View>
                </View>

                <View style={styles.dividerContainer}>
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                </View>

                <View style={styles.infoRow}>
                    <Feather name="calendar" size={16} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                    <AppText size="body" style={{ color: theme.colors.textMuted }}>
                        {formatDate(ticket!.createdAt)}
                    </AppText>
                </View>
            </View>

            {/* Issue Details Card */}
            <View style={[styles.detailCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <AppText size="body" weight="bold" style={{ color: theme.colors.text, marginBottom: 8 }}>
                    {ticket!.category}
                </AppText>
                <AppText size="body" style={{ color: theme.colors.text, lineHeight: 20 }}>
                    {ticket!.message}
                </AppText>
            </View>
            
            {ticket!.supportType === 'Chat' && <AppText size="caption" weight="bold" style={{ color: theme.colors.textMuted, marginVertical: 8, textAlign: 'center' }}>MESSAGE HISTORY</AppText>}
        </View>
    );

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
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

            {ticket.supportType === 'Chat' ? (
                <>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item._id}
                        renderItem={renderMessage}
                        ListHeaderComponent={renderHeader}
                        contentContainerStyle={styles.chatContent}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Chat Input */}
                    <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingBottom: insets.bottom + 8 }]}>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                            placeholder="Type your message..."
                            placeholderTextColor={theme.colors.textMuted}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                            onPress={handleSendMessage}
                            disabled={sending || !newMessage.trim()}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Feather name="send" size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {renderHeader()}
                    
                    {/* Admin Response Card for non-chat tickets */}
                    {ticket.adminReply && (
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
                                {ticket.adminReply}
                            </AppText>
                        </View>
                    )}
                </ScrollView>
            )}
        </KeyboardAvoidingView>
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
    headerContainer: {
        padding: 16,
    },
    chatContent: {
        paddingBottom: 20,
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
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        marginHorizontal: 16,
    },
    myMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
        borderWidth: 1,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

