import apiClient from "@/src/api/client";
import AppLoader from "@/src/components/ui/AppLoader";
import AppText from "@/src/components/ui/AppText";
import { useAuthContext } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme/useTheme";
import { getCurrentLocation } from "@/src/utils/location";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceAPI } from "../api/service.api";
import AppHeader from "../components/ui/AppHeader";
import { AppTabsParamList } from "../navigation/AppStack";

type Nav = BottomTabNavigationProp<AppTabsParamList, "BookingTab">;

interface Props {
    route: {
        params: {
            serviceCategoryId: string;
        };
    };
}

const ServiceBookingScreen: React.FC<Props> = ({ route }) => {
    const { serviceCategoryId } = route.params;
    const { user } = useAuthContext();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const tabNav = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    //   const { createBooking } = useBooking();

    const [category, setCategory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(1);

    useEffect(() => {
        loadService();
    }, []);

    const loadService = async () => {
        try {
            const res = await ServiceAPI.getServiceCategoryByIdAPI(serviceCategoryId);
            setCategory(res.serviceCategory);
        } catch (err) {
            console.error("Load service error", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1 }}>
                <AppLoader visible={true} text={"Loading service details..."} />
            </View>
        );
    }

    if (!category) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <AppText color="danger">Service not found</AppText>
            </View>
        );
    }

    const serviceName = category.serviceCategoryName;
    const price = category.price;
    const time = `${category.durationInMinutes} mins`;
    const description = category.description;

    const parseDescription = (html?: string) => {
        if (!html) return [] as string[];
        // Convert paragraph and <br> tags to newlines
        let text = html.replace(/<\/p>\s*<p>/gi, '\n');
        text = text.replace(/<br\s*\/?>/gi, '\n');
        // Remove remaining tags
        text = text.replace(/<[^>]+>/g, '');
        // Decode common HTML entities
        text = text
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        // Split into non-empty trimmed lines
        return text
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
    };

    const image = category.servicecategoryImage
        ? { uri: category.servicecategoryImage }
        : require("../../assets/images/SampleService.png");

    const increase = () => setCount((p) => p + 1);
    const decrease = () => setCount((p) => (p > 1 ? p - 1 : 1));

    //   const handleBookNow = () => {
    //     const booking = createBooking({
    //       serviceName,
    //       amount: price * count,
    //       dateLabel: "Today",
    //       timeLabel: time,
    //       address: "Default saved address",
    //     });

    //     tabNav.navigate("BookingTab", {
    //       screen: "Searching",
    //       params: { bookingId: booking.id },
    //     } as any);
    //   };


    const handleBookNow = async () => {
        if (!user?._id) {
            Alert.alert("Please login to book a service");
            return;
        }

        try {
            // ✅ 1. GET LIVE GPS LOCATION
            const { latitude, longitude } = await getCurrentLocation();

            // ✅ 2. SAVE LOCATION TO BACKEND USER
            // await apiClient.post("/user/update-location", {
            //   userId: user._id,
            //   coordinates: [longitude, latitude], // lng, lat
            // });

            // ✅ 3. CALL AUTO-ASSIGN
            const res = await apiClient.post("/booking/auto-assign", {
                userId: user._id,
                serviceCategoryName: serviceName,
                domainService: category?.domainService ?? null,
                address: user.address ?? "Saved address",
                coordinates: [78.73752232787717, 10.926784394142894],
                serviceCount: count,
            });


            const bookingId = res.data.bookingId;
            console.log("----------Booking created with ID:", bookingId);

            tabNav.navigate("BookingTab", {
                screen: "Searching",
                params: { bookingId },
            } as any);

        } catch (err: any) {
            console.error("Booking failed:", err?.response?.data || err);

            Alert.alert(
                "Booking failed",
                err?.response?.data?.message ??
                "Please enable location and try again"
            );
        }
    };





    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Scrollable Content */}
            <ScrollView showsVerticalScrollIndicator={false}>
                <AppHeader showBack={true} />

                <Image source={image} style={styles.image} />

                <View style={styles.headerBox}>
                    <AppText weight="bold" size="h2">{serviceName}</AppText>

                    <View style={styles.priceBox}>
                        <AppText weight="bold" size="h3">₹ {price}</AppText>
                        <AppText color="textMuted">{time}</AppText>
                    </View>
                </View>

                <View style={styles.section}>
                    <AppText weight="bold" size="h3">Description</AppText>

                    <View style={{ marginTop: 8 }}>
                        {parseDescription(description).map((line, idx) => (
                            <View key={idx} style={styles.bulletRow}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={18}
                                    color={theme.colors.primary}
                                />
                                <AppText style={{ marginLeft: 8 }}>{line}</AppText>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.counterBox}>
                    <AppText weight="bold">How many installations?</AppText>

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

            <View style={styles.bottomBox}>
                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={handleBookNow}
                >
                    <AppText weight="bold" style={styles.primaryText}>
                        Book Now – ₹{price * count}
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
