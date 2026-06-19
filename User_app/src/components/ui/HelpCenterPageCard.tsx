import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface Props {
    title: string;
    subtitle?: string;
    icon?: keyof typeof Feather.glyphMap;
    type: 'faq' | 'contact';
    onPress?: () => void;
}

export default function HelpCenterPageCard({
    title,
    subtitle,
    icon,
    type,
    onPress,
    answer,
}: Props & { answer?: string }) {
    const { theme } = useTheme();
    const [expanded, setExpanded] = React.useState(false);

    const isFaq = type === 'faq';

    const handlePress = () => {
        if (isFaq) {
            setExpanded(!expanded);
        }
        if (onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.surface,
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: isFaq ? 1 : 0,
                }
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View style={styles.contentContainer}>
                {/* Icon for Contact type */}
                {!isFaq && icon && (
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.background }]}>
                        <Feather name={icon} size={20} color={theme.colors.text} />
                    </View>
                )}

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <AppText weight={isFaq ? "medium" : "bold"} style={{ color: theme.colors.text }}>
                        {title}
                    </AppText>
                    {subtitle && (
                        <AppText size="small" style={{ color: theme.colors.textMuted, marginTop: 2 }}>
                            {subtitle}
                        </AppText>
                    )}
                </View>

                {/* Chevron */}
                <Feather
                    name={isFaq ? (expanded ? "chevron-up" : "chevron-down") : "chevron-right"}
                    size={20}
                    color={theme.colors.textMuted}
                />
            </View>

            {/* Answer Section */}
            {isFaq && expanded && answer && (
                <View style={styles.answerContainer}>
                    <AppText size="body" style={{ color: theme.colors.textMuted, lineHeight: 20 }}>
                        {answer}
                    </AppText>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        paddingHorizontal: 4, // Minimal horizontal padding as it might be inside a container
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    answerContainer: {
        marginTop: 12,
        paddingRight: 16,
    },
});
