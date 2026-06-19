import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import AppText from '@/src/components/ui/AppText';
import AppInput from '@/src/components/ui/AppInput';
import AppButton from '@/src/components/ui/AppButton';
import { useTheme } from '@/src/theme/useTheme';
import { ticketApi } from '@/src/api/ticket.api';
import { SupportType, TicketCategory } from '@/src/types/ticket';

const ISSUE_MAPPING: { [key: string]: { category: TicketCategory, supportType: SupportType } } = {
    'Service Quality': { category: 'Complaint', supportType: 'Ticket' },
    'Late Arrival': { category: 'Complaint', supportType: 'Ticket' },
    'Payment Issue': { category: 'Payment Issue', supportType: 'Ticket' },
    'Technical Issue': { category: 'Technical Issue', supportType: 'Ticket' },
    'Live Chat Support': { category: 'Query', supportType: 'Chat' },
    'Request Call Back': { category: 'Call Request', supportType: 'Call' },
    'Other': { category: 'Query', supportType: 'Ticket' }
};

const ISSUE_TYPES = Object.keys(ISSUE_MAPPING);

export default function CreateTicketScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
    const [bookingId, setBookingId] = useState('');
    const [description, setDescription] = useState('');
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a description');
            return;
        }

        setLoading(true);
        try {
            const mapping = ISSUE_MAPPING[issueType];
            const response = await ticketApi.createTicket({
                message: description,
                category: mapping.category,
                supportType: mapping.supportType,
                bookingId: bookingId || undefined,
                priority: 'Medium'
            });

            if (response.success) {
                Alert.alert('Success', 'Ticket submitted successfully!');
                if (mapping.supportType === 'Chat') {
                    navigation.replace('TicketDetailScreen', { ticketId: response.ticket._id });
                } else {
                    navigation.goBack();
                }
            } else {
                Alert.alert('Error', 'Failed to submit ticket');
            }
        } catch (error) {
            console.error('Submit ticket error:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
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
                    Create Ticket
                </AppText>
                <View style={styles.backButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <AppText size="body" style={{ color: theme.colors.textMuted, marginBottom: 24 }}>
                    Please provide details about your issue so we can help you as quickly as possible.
                </AppText>

                {/* Issue Type Dropdown */}
                <View style={[styles.inputGroup, { marginBottom: theme.spacing.lg, zIndex: 1000 }]}>
                    <AppText size="body" style={{ color: theme.colors.text, marginBottom: theme.spacing.xs }}>
                        Issue Type
                    </AppText>
                    <TouchableOpacity
                        style={[styles.dropdownButton, { 
                            backgroundColor: theme.colors.surface, 
                            borderColor: theme.colors.border,
                            borderRadius: theme.radius.md,
                            padding: theme.spacing.md,
                        }]}
                        onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                        activeOpacity={0.7}
                    >
                        <AppText size="body" style={{ color: theme.colors.text }}>{issueType}</AppText>
                        <Feather name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>

                    {showTypeDropdown && (
                        <View style={[styles.dropdownList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            {ISSUE_TYPES.map((type, index) => (
                                <TouchableOpacity 
                                    key={type} 
                                    style={[
                                        styles.dropdownItem, 
                                        index !== ISSUE_TYPES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }
                                    ]}
                                    onPress={() => {
                                        setIssueType(type);
                                        setShowTypeDropdown(false);
                                    }}
                                >
                                    <AppText size="body" style={{ color: type === issueType ? theme.colors.primary : theme.colors.text }}>
                                        {type}
                                    </AppText>
                                    {type === issueType && <Feather name="check" size={16} color={theme.colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Booking ID */}
                <AppInput
                    label="Booking ID (Optional)"
                    placeholder="e.g. BOK-123456"
                    value={bookingId}
                    onChangeText={setBookingId}
                />

                {/* Description */}
                <AppInput
                    label="Description"
                    placeholder="Please explain the issue in detail..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    style={{ height: 120, textAlignVertical: 'top' }}
                />

                {/* Image Upload (Mock for now, but placeholder for real implementation) */}
                <View style={{ marginBottom: 32 }}>
                    <AppText size="body" style={{ color: theme.colors.text, marginBottom: theme.spacing.xs }}>
                        Attachment (Optional)
                    </AppText>
                    <TouchableOpacity 
                        style={[styles.uploadButton, { 
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.surface,
                            borderRadius: theme.radius.md
                        }]}
                        activeOpacity={0.7}
                        onPress={() => Alert.alert('Coming Soon', 'Image upload will be available in the next update.')}
                    >
                        <View style={[styles.uploadIconContainer, { backgroundColor: theme.colors.background }]}>
                            <Feather name="upload-cloud" size={24} color={theme.colors.primary} />
                        </View>
                        <View>
                            <AppText size="body" weight="medium" style={{ color: theme.colors.primary, marginBottom: 4 }}>
                                Upload Image
                            </AppText>
                            <AppText size="caption" style={{ color: theme.colors.textMuted }}>
                                JPG, PNG up to 5MB
                            </AppText>
                        </View>
                    </TouchableOpacity>
                </View>

                <AppButton
                    title={loading ? "Submitting..." : "Submit Ticket"}
                    onPress={handleSubmit}
                    disabled={loading}
                    loading={loading}
                    style={{ width: '100%', marginBottom: 16 }}
                />
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
        padding: 20,
        paddingBottom: 40,
    },
    inputGroup: {
        zIndex: 5,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1.4,
    },
    dropdownList: {
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1001,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    uploadIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    }
});

