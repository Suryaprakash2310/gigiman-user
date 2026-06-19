import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import AppText from '@/src/components/ui/AppText';
import AppButton from '@/src/components/ui/AppButton';
import { useTheme } from '@/src/theme/useTheme';

export default function InviteReferralScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [copied, setCopied] = useState(false);
    const referralCode = 'SURYA847';

    const handleBack = () => {
        navigation.goBack();
    };

    const handleShare = async () => {
        try {
            const message = `Book trusted home services with Gigiman.\n\nUse my referral code ${referralCode}\nand get 5% OFF on your first booking.\n\nDownload Gigiman now.`;
            await Share.share({
                message,
            });
        } catch (error: any) {
            console.log('Error sharing:', error);
        }
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(referralCode);
        setCopied(true);
        // Show success toast
        // alert("Referral code copied");
        
        setTimeout(() => {
            setCopied(false);
        }, 2000);
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
                    Invite Friends & Earn
                </AppText>
                <View style={styles.backButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Top illustration placeholder */}
                <View style={styles.illustrationContainer}>
                    <View style={[styles.circleBg, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Feather name="gift" size={64} color={theme.colors.primary} />
                    </View>
                    <AppText size="h3" weight="bold" style={{ color: theme.colors.text, marginTop: 24, textAlign: 'center' }}>
                        Give 5%, Get 5%
                    </AppText>
                    <AppText size="body" style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
                        Invite your friends to Gigiman. They get 5% off their first booking, and you get 5% off your next one!
                    </AppText>
                </View>

                {/* Referral Code Section */}
                <View style={styles.section}>
                    <AppText size="body" weight="medium" style={{ color: theme.colors.text, marginBottom: 12 }}>
                        Your Referral Code
                    </AppText>
                    
                    <View style={[styles.codeBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <AppText size="h2" weight="bold" style={{ color: theme.colors.primary, letterSpacing: 2 }}>
                            {referralCode}
                        </AppText>
                    </View>

                    {copied && (
                        <AppText size="caption" weight="medium" style={{ color: theme.colors.success, textAlign: 'center', marginTop: 8 }}>
                            ✓ Referral code copied
                        </AppText>
                    )}

                    <View style={styles.buttonRow}>
                        <AppButton
                            title="Copy Code"
                            onPress={handleCopy}
                            variant="outline"
                            style={styles.actionButton}
                        />
                        <View style={{ width: 16 }} />
                        <AppButton
                            title="Share Invite"
                            onPress={handleShare}
                            style={styles.actionButton}
                        />
                    </View>
                </View>

                {/* Stats Section */}
                <View style={styles.section}>
                    <AppText size="body" weight="medium" style={{ color: theme.colors.text, marginBottom: 12 }}>
                        Your Rewards
                    </AppText>
                    
                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <Feather name="users" size={24} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                            <AppText size="h3" weight="bold" style={{ color: theme.colors.text }}>
                                0
                            </AppText>
                            <AppText size="caption" style={{ color: theme.colors.textMuted }}>
                                Friends Joined
                            </AppText>
                        </View>
                        
                        <View style={{ width: 16 }} />
                        
                        <View style={[styles.statBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <Feather name="award" size={24} color={theme.colors.accent || theme.colors.primary} style={{ marginBottom: 8 }} />
                            <AppText size="h3" weight="bold" style={{ color: theme.colors.text }}>
                                ₹0
                            </AppText>
                            <AppText size="caption" style={{ color: theme.colors.textMuted }}>
                                Rewards Earned
                            </AppText>
                        </View>
                    </View>
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
    illustrationContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    circleBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginTop: 32,
    },
    codeBox: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
    },
    statBox: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
