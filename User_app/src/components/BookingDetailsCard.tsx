import { useTheme } from '@/src/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppCard from './ui/AppCard';
import AppText from './ui/AppText';


interface BookingDetailsCardProps {
    name: string;
    role: string;
    rating?: number;
    reviews?: number;
    image?: string;
    eta?: string;
    phone?: string;
    onCallPress?: () => void;
}

export default function BookingDetailsCard({
    name,
    role,
    rating,
    reviews,
    image,
    eta,
    phone,
    onCallPress,
}: BookingDetailsCardProps) {
    const { theme } = useTheme();

    return (
        <AppCard style={styles.card}>
            <View style={styles.content}>
                <View style={styles.imageContainer}>
                    {image && image.startsWith("http") ? (
                        <Image
                            source={{ uri: image }}
                            style={styles.image}
                        />
                    ) : (
                        <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                            <AppText size="h1" weight="bold" style={{ color: theme.colors.primary, fontSize: 36 }}>
                                {name ? name.charAt(0).toUpperCase() : "?"}
                            </AppText>
                        </View>
                    )}
                </View>

                <AppText size="h3" weight="bold" style={styles.name}>
                    {name}
                </AppText>

                <AppText size="body" color="textMuted" style={styles.details}>
                    {role}
                </AppText>

                {eta ? (
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                        <AppText size="body" weight="medium" style={styles.infoText}>
                            Estimated Arrival Time: {eta}
                        </AppText>
                    </View>
                ) : null}

                {phone ? (
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={16} color={theme.colors.primary} />
                        <AppText size="body" weight="medium" style={styles.infoText}>
                            Phone: {phone}
                        </AppText>
                    </View>
                ) : null}

                {onCallPress ? (
                    <TouchableOpacity style={[styles.callBtn, { backgroundColor: theme.colors.primary }]} onPress={onCallPress}>
                        <Ionicons name="call" size={16} color="white" />
                        <AppText weight="bold" style={styles.callBtnText}>
                            Call Technician
                        </AppText>
                    </TouchableOpacity>
                ) : null}
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        gap: 6,
    },
    infoText: {
        color: '#475569',
        fontSize: 14,
    },
    callBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 16,
        gap: 8,
    },
    callBtnText: {
        color: 'white',
        fontSize: 14,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
});
