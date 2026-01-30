import AppText from '@/src/components/ui/AppText';
import AvatarUpload from '@/src/components/ui/AvatorUpload';
import PersonalDetailsCard from '@/src/components/ui/PersonalDetailsCard';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileAPI, updateProfile } from '../api/profile.api';

export default function PersonalDetailsPage() {
    // Force light theme colors as per requirement
    const themeColors = {
        background: '#F9FAFB',
        surface: '#FFFFFF',
        text: '#0F172A',
        border: '#E2E8F0',
        success: '#10B981',
    };

    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        navigation.goBack();
    };

    const handleSubmit = (values: any) => {
        // Call updateProfile API to save changes
        (async () => {
            try {
                const payload: any = { fullName: values.fullName };
                if (avatar !== undefined) payload.avatar = avatar; // string | null

                const res = await updateProfile(payload);
                console.log('Profile updated', res.data);
                // update local state
                setProfile((prev: any) => ({ ...(prev || {}), fullName: values.fullName, avatar }));
            } catch (err) {
                console.warn('Failed to update profile', err);
            }
        })();
    };
    const [profile, setProfile] = useState<any>(null);
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await ProfileAPI.getProfileAPI();
                setProfile(res.user || null);
            } catch (err) {
                console.warn('Failed to load profile', err);
            }
        };
        load();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Feather name="chevron-left" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <AppText size="h3" weight="bold" style={{ color: themeColors.text, flex: 1, textAlign: 'center', marginRight: 40 }}>
                    Personal details
                </AppText>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Image Section */}
                <View style={styles.profileSection}>
                    <View style={styles.imageContainer}>
                        <AvatarUpload size={100} initialUri={avatar} onChange={setAvatar} />
                    </View>
                </View>

                <AppText size="h3" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>
                    Manage your details
                </AppText>

                {profile && (
                    <PersonalDetailsCard
                        initialValues={{
                            fullName: profile.fullName,
                            email: profile.email,
                            phoneNo: profile.phoneNo,
                        }}
                        onSubmit={handleSubmit}
                    />
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
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0', // Hardcoded light border
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
    },
    profileSection: {
        alignItems: 'center',
        marginVertical: 24,
    },
    imageContainer: {
        position: 'relative',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E2E8F0',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    sectionTitle: {
        marginBottom: 16,
        marginLeft: 4,
    },
});
