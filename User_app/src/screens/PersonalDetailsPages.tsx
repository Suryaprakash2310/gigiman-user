import AppText from '@/src/components/ui/AppText';
import AvatarUpload from '@/src/components/ui/AvatorUpload';
import PersonalDetailsCard from '@/src/components/ui/PersonalDetailsCard';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileAPI, updateProfile } from '../api/profile.api';
import { useTheme } from '@/src/theme/useTheme';
import { useAuth } from '@/src/hook/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function PersonalDetailsPage() {
    
      const { theme, setMode } = useTheme();
      const { user, setUser } = useAuth();

    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        navigation.goBack();
    };

    const handleSubmit = (values: any) => {
        // Call updateProfile API to save changes
        (async () => {
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
        })();
    };
    const [profile, setProfile] = useState<any>(null);
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await ProfileAPI.getProfileAPI();
                if (res.user) {
                    setProfile(res.user);
                    setAvatar(res.user.avatar || null);
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
                            phoneNo: profile.phoneNo ? String(profile.phoneNo) : '',
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
