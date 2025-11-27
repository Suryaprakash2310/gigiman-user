import ProfilePageCard from '@/src/components/ProfilePageCard';
import AppText from '@/src/components/ui/AppText';
import { lightTheme } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfilePage() {
    const handleBackPress = () => {
        console.log('Back button pressed');
        // Add navigation logic here
    };

    const handlePersonalDetails = () => {
        console.log('Personal details pressed');
        // Add navigation to personal details screen
    };

    const handleMyBookings = () => {
        console.log('My bookings pressed');
        // Add navigation to bookings screen
    };

    const handleSavedAddresses = () => {
        console.log('Saved addresses pressed');
        // Add navigation to addresses screen
    };

    const handlePaymentHistory = () => {
        console.log('Payment history pressed');
        // Add navigation to payment history screen
    };

    const handleSupport = () => {
        console.log('Support pressed');
        // Add navigation to support screen
    };

    const handleLogout = () => {
        console.log('Logout pressed');
        // Add logout logic here
    };

    return (
        <View style={[styles.container, { backgroundColor: lightTheme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: lightTheme.colors.surface }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackPress}
                    activeOpacity={0.7}
                >
                    <Feather name="chevron-left" size={24} color={lightTheme.colors.text} />
                </TouchableOpacity>
                <AppText weight="bold" size="h3" style={[styles.headerTitle, { color: lightTheme.colors.text }]}>
                    Profile
                </AppText>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: lightTheme.colors.border }]}>
                            <Feather name="user" size={48} color={lightTheme.colors.textMuted} />
                        </View>
                    </View>
                    <AppText weight="bold" size="h2" style={[styles.userName, { color: lightTheme.colors.text }]}>
                        Alex Martinez
                    </AppText>
                    <AppText
                        weight="regular"
                        size="body"
                        style={[styles.userEmail, { color: lightTheme.colors.textMuted }]}
                    >
                        alex.math@gmail.com
                    </AppText>
                </View>

                {/* Menu Items Section */}
                <View style={styles.menuSection}>
                    <ProfilePageCard
                        label="Personal details"
                        icon={
                            <View style={styles.iconCircle}>
                                <Feather name="user" size={20} color="#3B82F6" />
                            </View>
                        }
                        onPress={handlePersonalDetails}
                        showChevron={true}
                    />
                    <ProfilePageCard
                        label="My bookings"
                        onPress={handleMyBookings}
                        showChevron={true}
                    />
                    <ProfilePageCard
                        label="Saved addresses"
                        onPress={handleSavedAddresses}
                        showChevron={true}
                    />
                    <ProfilePageCard
                        label="Payment history"
                        onPress={handlePaymentHistory}
                        showChevron={true}
                    />
                </View>

                {/* Support Section */}
                <View style={styles.supportSection}>
                    <ProfilePageCard
                        label="Support / Help"
                        onPress={handleSupport}
                        showChevron={true}
                    />
                </View>

                {/* Logout Section */}
                <View style={styles.logoutSection}>
                    <ProfilePageCard
                        label="Log Out"
                        onPress={handleLogout}
                        showChevron={false}
                        textColor={lightTheme.colors.danger}
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 32,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userName: {
        marginBottom: 4,
    },
    userEmail: {
        marginBottom: 0,
    },
    menuSection: {
        marginBottom: 20,
    },
    supportSection: {
        marginBottom: 20,
    },
    logoutSection: {
        marginBottom: 0,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
