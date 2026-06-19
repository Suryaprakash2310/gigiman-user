// BookingCard.tsx

import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";

interface Props {
    type: "completed" | "assigned";
    serviceName: string;
    amount: string;
    date: string;
    time: string;

    // For completed
    paymentMode?: string;

    // For assigned
    name?: string;

    // For both
    onPress?: () => void;
    onInvoiceDownload?: () => void;
}

export default function BookingCard({
    type,
    serviceName,
    amount,
    date,
    time,
    paymentMode,
    name,
    onPress,
    onInvoiceDownload,
}: Props) {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
        >
            {/* TOP ROW */}
            <View style={styles.header}>
                {/* Icon for assigned type */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                    {type === "assigned" && (
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
                            <MaterialIcons name="cleaning-services" size={26} color={theme.colors.primary} />
                        </View>
                    )}

                    <AppText weight="bold" size="h3" style={{ color: theme.colors.text }}>
                        {serviceName}
                    </AppText>
                </View>

                {/* Invoice icon for completed */}
                {type === "completed" && (
                    <TouchableOpacity onPress={onInvoiceDownload}>
                        <MaterialIcons
                            name="file-download"
                            size={22}
                            color={theme.colors.primary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Technician info (Assigned) */}
            {type === "assigned" && name && (
                <AppText size="small" weight="medium" style={{ marginBottom: 8 }}>
                    Technician : {name}
                </AppText>
            )}

            {/* Divider Line */}
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Date + Time  */}
            <View style={styles.rowBetween}>
                <View>
                    <AppText size="small" color="textMuted">{date}</AppText>
                    <AppText size="small" color="textMuted" style={{ marginTop: 3 }}>
                        {time}
                    </AppText>
                </View>

                {/* <AppText weight="bold" size="body" style={{ color: theme.colors.text }}>
                    ₹{amount}
                </AppText> */}
            </View>


            {/* BOTTOM SECTION */}
            <View style={styles.bottom}>
                {type === "completed" && (
                    <>
                        <View style={[styles.statusPaid, { backgroundColor: "#D4FFD6" }]}>
                            <AppText size="small" weight="bold" style={{ color: theme.colors.success }}>
                                Paid
                            </AppText>
                        </View>

                        <AppText size="small" color="textMuted">
                            Payment Mode : {paymentMode}
                        </AppText>
                    </>
                )}

                {type === "assigned" && (
                    <View style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}>
                        <AppText weight="bold" size="small" style={{ color: "white" }}>
                            View
                        </AppText>

                    </View>
                )}
                <AppText weight="bold" size="body" style={{ color: theme.colors.text }}>
                    {amount}
                </AppText>
            </View>
        </TouchableOpacity>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        card: {
            padding: 18,
            borderRadius: 18,
            marginBottom: 18,
            shadowColor: theme.colors.cardShadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.16,
            shadowRadius: 8,
            elevation: 3,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
        },
        iconContainer: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 8,
        },
        divider: {
            height: 1,
            marginVertical: 10,
            width: "100%",
        },
        rowBetween: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingBottom: 12,
        },
        bottom: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },

        statusPaid: {
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 8,
        },

        viewButton: {
            paddingHorizontal: 18,
            paddingVertical: 6,
            borderRadius: 10,
        },
    });
