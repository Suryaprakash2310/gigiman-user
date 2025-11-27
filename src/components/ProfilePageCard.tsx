import AppText from '@/src/components/ui/AppText';
import { lightTheme } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProfilePageCardProps {
    label: string;
    icon?: React.ReactNode;
    onPress?: () => void;
    showChevron?: boolean;
    textColor?: string;
}

export default function ProfilePageCard({
    label,
    icon,
    onPress,
    showChevron = true,
    textColor,
}: ProfilePageCardProps) {
    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: lightTheme.colors.surface,
                    borderColor: lightTheme.colors.border,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <AppText
                    weight="regular"
                    size="body"
                    style={[
                        styles.label,
                        { color: textColor || lightTheme.colors.text },
                    ]}
                >
                    {label}
                </AppText>
            </View>
            {showChevron && (
                <Feather
                    name="chevron-right"
                    size={20}
                    color={lightTheme.colors.textMuted}
                />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        marginRight: 12,
    },
    label: {
        flex: 1,
    },
});
