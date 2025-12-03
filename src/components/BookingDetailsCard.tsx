import { useTheme } from '@/src/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import AppCard from './ui/AppCard';
import AppText from './ui/AppText';


interface BookingDetailsCardProps {
    name: string;
    role: string;
    experience: string;
    rating: number;
    reviews: number;
    image?: string;
}

export default function BookingDetailsCard({
    name,
    role,
    experience,
    rating,
    reviews,
    image,
}: BookingDetailsCardProps) {
    const { theme } = useTheme();

    return (
        <AppCard style={styles.card}>
            <View style={styles.content}>
                <View style={styles.imageContainer}>
                    {/* Placeholder for image if not provided, or use a default avatar */}
                    <Image
                        source={{ uri: image || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                        style={styles.image}
                    />
                </View>

                <AppText size="h3" weight="bold" style={styles.name}>
                    {name}
                </AppText>

                <AppText size="body" color="textMuted" style={styles.details}>
                    {role} • {experience}
                </AppText>

                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <AppText size="body" weight="bold" style={styles.ratingText}>
                        {' '}{rating} <AppText color="textMuted" size="body">({reviews} reviews)</AppText>
                    </AppText>
                </View>
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        paddingVertical: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 10,
        borderRadius: 24,
        marginHorizontal: 4,
        backgroundColor: 'white', // Force white background
    },
    content: {
        alignItems: 'center',
    },
    imageContainer: {
        marginBottom: 16,
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#F1F5F9',
    },
    name: {
        marginBottom: 6,
        textAlign: 'center',
        color: '#0F172A',
    },
    details: {
        marginBottom: 10,
        textAlign: 'center',
        color: '#64748B',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    ratingText: {
        marginLeft: 6,
        color: '#0F172A',
    },
});
