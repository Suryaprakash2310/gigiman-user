import AppText from '@/src/components/ui/AppText';
import AvatarUpload from '@/src/components/ui/AvatorUpload';
import PersonalDetailsCard from '@/src/components/ui/PersonalDetailsCard';
import EmailOtpModal from '@/src/components/ui/EmailOtpModal';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileAPI, updateProfile } from '../api/profile.api';
import { sendEmailOtpAPI } from '../api/email.api';
import { useTheme } from '@/src/theme/useTheme';
import { useAuth } from '@/src/hook/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function PersonalDetailsPage() {
    
      const { theme, setMode } = useTheme();
      const { user, setUser } = useAuth();

    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // ─── Email OTP modal state ────────────────────────────────────────────────
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [pendingValues, setPendingValues] = useState<any>(null);

    const handleBack = () => {
        navigation.goBack();
    };

    /** Persist the profile after email OTP is verified (or when email didn't change). */
    const saveProfile = async (values: any) => {
        try {
            const payload: any = { 
                fullName: values.fullName,
                email: values.email
            }; 
            if (avatar !== undefined) payload.avatar = avatar; // string | null

            const res = await updateProfile(payload);
            
            if (res.data?.success && res.data.user) {
                const updatedUserObj = res.data.user;
                setProfile(updatedUserObj);
                setAvatar(updatedUserObj.avatar || null);

                // Sync with AuthContext and AsyncStorage
                const updatedUser = {
                    ...user,
                    fullName: updatedUserObj.fullName || updatedUserObj.name,
                    email: updatedUserObj.email,
                    avatar: updatedUserObj.avatar || undefined,
                } as any;
                setUser(updatedUser);
                await AsyncStorage.setItem('gg_user', JSON.stringify(updatedUser));
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (err) {
            console.warn('Failed to update profile', err);
            Alert.alert('Error', 'Failed to update profile details');
        }
    };

    /**
     * Called by PersonalDetailsCard when the user taps "Save Changes".
     * If the email has changed we first send an OTP via Mailjet (backend),
     * then show the EmailOtpModal. If the email is unchanged we save directly.
     */
    const handleSubmit = (values: any) => {
        (async () => {
            const currentEmail = (profile?.email || '').trim().toLowerCase();
            const newEmail = (values.email || '').trim().toLowerCase();
            const emailChanged = newEmail.length > 0 && newEmail !== currentEmail;

            if (emailChanged) {
                try {
                    await sendEmailOtpAPI(values.email.trim());
                    setPendingValues(values);
                    setOtpModalVisible(true);
                } catch (err: any) {
                    const msg =
                        err?.response?.data?.message ||
                        err?.message ||
                        'Failed to send verification email. Please try again.';
                    Alert.alert('Email Verification', msg);
                }
            } else {
                // Email unchanged — save directly
                await saveProfile(values);
            }
        })();
    };

    /** Called by EmailOtpModal after a successful OTP verification. */
    const handleEmailVerified = async () => {
        setOtpModalVisible(false);
        if (pendingValues) {
            await saveProfile(pendingValues);
            setPendingValues(null);
        }
    };
    const [profile, setProfile] = useState<any>(user);
    const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);

    useEffect(() => {
        if (user) {
            setProfile(user);
            setAvatar(user.avatar || null);
        }
    }, [user]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await ProfileAPI.getProfileAPI();
                if (res.user) {
                    setProfile(res.user);
                    setAvatar(res.user.avatar || null);

                    // Sync backend updates to local storage / context
                    const updatedUser = {
                        ...user,
                        fullName: res.user.fullName || res.user.name,
                        email: res.user.email,
                        phone: res.user.phoneNo || user?.phone || '',
                        avatar: res.user.avatar || undefined,
                    } as any;
                    setUser(updatedUser);
                    await AsyncStorage.setItem('gg_user', JSON.stringify(updatedUser));
                }
            } catch (err) {
                console.warn('Failed to load profile', err);
            }
        };
        load();
    }, []);

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
                <AppText size="h3" weight="bold" style={{ color: theme.colors.text, flex: 1, textAlign: 'center', marginRight: 40 }}>
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

                <AppText size="h3" weight="bold" style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Manage your details
                </AppText>

                {profile && (
                    <PersonalDetailsCard
                        initialValues={{
                            fullName: profile.name || profile.fullName || '',
                            email: profile.email || '',
                            phoneNo: String(profile.phoneNo || profile.phone || '').replace(/^\+91/, '').trim(),
                        }}
                        onSubmit={handleSubmit}
                    />
                )}
            </ScrollView>

            {/* Email OTP verification modal (shown only when email changes) */}
            <EmailOtpModal
                visible={otpModalVisible}
                email={pendingValues?.email ?? ''}
                onVerified={handleEmailVerified}
                onDismiss={() => {
                    setOtpModalVisible(false);
                    setPendingValues(null);
                }}
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
