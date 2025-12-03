import React, { useState } from "react";
import {
    View,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import AppText from "@/src/components/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/useTheme";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { AppTabsParamList } from "../navigation/AppStack";
type Nav = BottomTabNavigationProp<AppTabsParamList, "BookingTab">;
interface ServiceBookingProps {
    route: {
        params: {
            serviceName: string;
            price: number;
            time: string;
            image: any;
            description?: string[];
            reviews?: number;
            rating?: number;
        };
    };
    navigation: any;
}

const ServiceBookingScreen: React.FC<ServiceBookingProps> = ({
    route,
    navigation,
}) => {

    const { serviceName, price, time, image, description, rating, reviews } =
        route.params;

    const { theme } = useTheme();

    const styles = createStyles(theme);

    const [count, setCount] = useState(1);

    const increase = () => setCount((p) => p + 1);
    const decrease = () => setCount((p) => (p > 1 ? p - 1 : 1));

    return (
        <View style={styles.container}>
            {/* Scrollable Content */}
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* --- IMAGE BANNER --- */}
                <Image source={image} style={styles.image} />

                {/* --- TITLE SECTION --- */}
                <View style={styles.headerBox}>
                    <AppText weight="bold" size="h2">{serviceName}</AppText>

                    {/* Rating */}
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={18} color="#F4C430" />
                        <AppText weight="bold" style={{ marginLeft: 4 }}>
                            {rating ?? 4.9}
                        </AppText>
                        <AppText color="textMuted" style={{ marginLeft: 4 }}>
                            ({reviews ?? 1500} reviews)
                        </AppText>
                    </View>

                    {/* Price Box */}
                    <View style={styles.priceBox}>
                        <AppText weight="bold" size="h3">₹ {price}</AppText>
                        <AppText color="textMuted">{time}</AppText>
                    </View>
                </View>

                {/* --- DESCRIPTION --- */}
                <View style={styles.section}>
                    <AppText weight="bold" size="h3">Description</AppText>

                    {description?.map((item, index) => (
                        <View key={index} style={styles.bulletRow}>
                            <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                            <AppText style={{ marginLeft: 8 }}>{item}</AppText>
                        </View>
                    ))}
                </View>

                {/* --- COUNT SECTION --- */}
                <View style={styles.counterBox}>
                    <AppText weight="bold" size="body">
                        How many installations?
                    </AppText>

                    <View style={styles.counterRow}>
                        <TouchableOpacity onPress={decrease} style={styles.counterBtn}>
                            <Ionicons name="remove" size={22} />
                        </TouchableOpacity>

                        <View style={styles.countDisplay}>
                            <AppText weight="bold" size="h3">{count}</AppText>
                        </View>

                        <TouchableOpacity onPress={increase} style={styles.counterBtn}>
                            <Ionicons name="add" size={22} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 140 }} />
            </ScrollView>

            {/* --- BOTTOM CTA SECTION --- */}
            <View style={styles.bottomBox}>

                {/* PRIMARY BUTTON */}
                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() =>
                        navigation.navigate("BookingTab", {
                            screen: "Searching",
                            params: {
                                serviceName: "Fan Installation",
                                amount: "149",
                                date: "Today",
                                time: "4:30–5:00 PM",
                            },
                        })


                    }
                >
                    <AppText weight="bold" style={styles.primaryText}>
                        Book Now – ₹{price}
                    </AppText>
                </TouchableOpacity>

                {/* SECONDARY */}
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate("BookingTab", {
                            screen: "Searching",
                            params: {
                                serviceName: "Fan Installation",
                                amount: "149",
                            },
                        })
                    }

                    style={styles.secondaryBtn}
                >
                    <AppText weight="semibold" style={{ color: theme.colors.primary }}>
                        Schedule for later →
                    </AppText>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ServiceBookingScreen;

/* ------------------------------------------------------------------------ */
/*                               STYLES                                     */
/* ------------------------------------------------------------------------ */

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        image: {
            width: "100%",
            height: 220,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
        },
        headerBox: {
            padding: 16,
        },
        ratingRow: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
        },
        priceBox: {
            marginTop: 14,
            padding: 12,
            borderRadius: 14,
            backgroundColor: theme.colors.surface,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            elevation: 3,
        },
        section: {
            padding: 16,
        },
        bulletRow: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
        },
        counterBox: {
            padding: 16,
        },
        counterRow: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 14,
        },
        counterBtn: {
            width: 42,
            height: 42,
            borderRadius: 10,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
            elevation: 2,
        },
        countDisplay: {
            width: 60,
            height: 42,
            marginHorizontal: 14,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.surface,
        },
        bottomBox: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        primaryBtn: {
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
        },
        primaryText: {
            color: "#fff",
            fontSize: 18,
        },
        secondaryBtn: {
            alignSelf: "center",
        },
    });
