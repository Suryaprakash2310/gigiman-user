import AppText from '@/src/components/ui/AppText';
import PersonalDetailsCard from '@/src/components/ui/PersonalDetailsCard';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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

    const handleBack = () => {
        navigation.goBack();
    };

    const handleSubmit = (values: any) => {
        console.log('Submitted values:', values);
        // Here you would typically make an API call to save the data
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
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
                        <Image
                            source={{ uri: 'https://i.pravatar.cc/300?img=12' }} // Placeholder avatar
                            style={styles.profileImage}
                        />
                        <TouchableOpacity style={[styles.editIconBadge, { backgroundColor: themeColors.success }]}>
                            {/* Edit Pencil Icon representation */}
                            <AppText size="small" style={{ color: 'white' }}>✎</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                <AppText size="h3" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>
                    Manage your details
                </AppText>

                <PersonalDetailsCard onSubmit={handleSubmit} />

            </ScrollView>
        </SafeAreaView>
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
