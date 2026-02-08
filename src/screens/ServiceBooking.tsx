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
import CalendarModal from "../components/ui/CalendarModal";

//schudule imports 
import DateTimePicker from '@react-native-community/datetimepicker';
import { BOOKING_TYPE } from "../utils/enums/BookingType";
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

    // schudule state
    const [isScheduled, setIsScheduled] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    // const [scheduleDateTime, setScheduleDateTime] = useState<Date | null>(null);
    // const resetSchedule = () => {
    //     setIsScheduled(false);
    //     setSelectedDate(null);
    //     setSelectedTime(null);
    // };
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
    const domainService = category.domainServiceName;
    const serviceName = category.serviceCategoryName;
    const price = category.price;
    const duration = `${category.durationInMinutes} mins`;
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
        console.log("category", category);

        if (isScheduled && (!selectedDate || !selectedTime)) {
            Alert.alert("Select date & time", "Please choose when you want the service");
            return;
        }
        let scheduleDateTime: Date | null = null;

        if (isScheduled && selectedDate && selectedTime) {
            scheduleDateTime = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                selectedTime.getHours(),
                selectedTime.getMinutes()
            );
        }

        try {
            const { latitude, longitude } = await getCurrentLocation();

            const payload: any = {
                userId: user._id,
                serviceCategoryName: serviceName,
                domainService: domainService,
                address: user.address ?? "Saved address",
                coordinates: [longitude, latitude],
                serviceCount: count,
            };
            console.log("payload", payload);

            if (scheduleDateTime) {
                payload.isScheduled = true;
                payload.scheduleDateTime = scheduleDateTime;
                payload.status = "SCHEDULED";
                payload.assignmentStatus = "SCHEDULED";
                payload.bookingType = BOOKING_TYPE.SCHEDULED;
            }

            const res = await apiClient.post(
                scheduleDateTime ? "/booking/schedule" : "/booking/auto-assign",
                payload
            );

            if (scheduleDateTime) {
                Alert.alert(
                    "Booking Scheduled",
                    `Your service is scheduled on ${scheduleDateTime.toLocaleString()}`
                );
                //resetSchedule();
                tabNav.navigate("BookingTab", { screen: "MyBookings" } as any);
            } else {
                tabNav.navigate("BookingTab", {
                    screen: "Searching",
                    params: { bookingId: res.data.bookingId },
                } as any);
            }

        } catch (err: any) {
            console.error("Booking failed:", err?.response?.data || err);
            Alert.alert("Booking failed", "Please try again");
        }
    };





    return (
  <View style={[styles.container, { paddingTop: insets.top }]}>

    {/* SCROLLABLE CONTENT */}
    <ScrollView showsVerticalScrollIndicator={false}>
      <AppHeader showBack={true} />

      <Image source={image} style={styles.image} />

      <View style={styles.headerBox}>
        <AppText weight="bold" size="h2">{serviceName}</AppText>

        <View style={styles.priceBox}>
          <AppText weight="bold" size="h3">₹ {price}</AppText>
          <AppText color="textMuted">{duration}</AppText>
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

      {/* MODE SELECTOR */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, !isScheduled && styles.modeBtnActive]}
          onPress={() => {
            setIsScheduled(false);
            setSelectedDate(null);
            setSelectedTime(null);
          }}
        >
          <Ionicons
            name="flash-outline"
            size={18}
            color={!isScheduled ? "#fff" : theme.colors.text}
          />
          <AppText style={{ marginLeft: 6, color: !isScheduled ? "#fff" : theme.colors.text }}>
            Now
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, isScheduled && styles.modeBtnActive]}
          onPress={() => setIsScheduled(true)}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={isScheduled ? "#fff" : theme.colors.text}
          />
          <AppText style={{ marginLeft: 6, color: isScheduled ? "#fff" : theme.colors.text }}>
            Schedule
          </AppText>
        </TouchableOpacity>
      </View>

      {isScheduled && (
        <View style={styles.scheduleBox}>
          <TouchableOpacity
            style={styles.scheduleRow}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar-outline" size={18} />
            <AppText style={{ marginLeft: 8 }}>
              {selectedDate ? selectedDate.toDateString() : "Select date"}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scheduleRow}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={18} />
            <AppText style={{ marginLeft: 8 }}>
              {selectedTime ? selectedTime.toLocaleTimeString() : "Select time"}
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Spacer so content doesn't hide behind bottom bar */}
      <View style={{ height: 160 }} />
    </ScrollView>

    {/* FIXED BOTTOM BAR */}
    <View style={styles.bottomBox}>
      <TouchableOpacity
        disabled={isScheduled && (!selectedDate || !selectedTime)}
        style={[
          styles.primaryBtn,
          {
            backgroundColor:
              isScheduled && (!selectedDate || !selectedTime)
                ? "#ccc"
                : theme.colors.primary,
          },
        ]}
        onPress={handleBookNow}
      >
        <AppText weight="bold" style={styles.primaryText}>
          {isScheduled
            ? "Schedule Booking"
            : `Book Now – ₹${price * count}`}
        </AppText>
      </TouchableOpacity>
    </View>

    {/* MODALS */}
    <CalendarModal
      visible={showCalendar}
      selectedDate={selectedDate}
      onClose={() => setShowCalendar(false)}
      onSelect={setSelectedDate}
    />

    {showTimePicker && (
      <DateTimePicker
        mode="time"
        value={new Date()}
        onChange={(e, time) => {
          setShowTimePicker(false);
          if (time) setSelectedTime(time);
        }}
      />
    )}
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
        scheduleBtn: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "center",
            padding: 10,
            backgroundColor: theme.colors.surface,
            borderRadius: 10,
            elevation: 2,
            marginTop: 10,
        },
        modeRow: {
            flexDirection: "row",
            justifyContent: "center",
            gap: 12,
            marginVertical: 16,
        },

        modeBtn: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: "#eee",
        },

        modeBtnActive: {
            backgroundColor: theme.colors.primary,
        },

        scheduleBox: {
            marginTop: 10,
            backgroundColor: theme.colors.surface,
            borderRadius: 14,
            padding: 12,
            gap: 10,
        },

        scheduleRow: {
            flexDirection: "row",
            alignItems: "center",
        },
    });
