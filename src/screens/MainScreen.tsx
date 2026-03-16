
// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInRight } from "react-native-reanimated";

import { useTheme } from "@/src/theme/useTheme";
import AppText from "@/src/components/ui/AppText";
import AppButton from "@/src/components/ui/AppButton";

import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { AppTabsParamList } from "../navigation/AppStack";

import { getPopularServices } from "../api/dashboard.api";
import FanInstall from '@/assets/images/FanInstall.svg';
import { BannerAPI } from "../api/banner.api";

const { width } = Dimensions.get("window");

const SPACING = 20;
const CARD_RADIUS = 20;
const OFFER_WIDTH = width * 0.82;
const POPULAR_WIDTH = width * 0.68;

type Nav = BottomTabNavigationProp<AppTabsParamList, "HomeTab">;

const testimonials = [
  {
    name: 'Priya S.',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    review: 'Great service! The booking was easy and the cleaner was very professional.',
    rating: 5,
  },
  {
    name: 'Rahul K.',
    avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
    review: 'Quick response and excellent support. Highly recommend GigiMan!',
    rating: 4,
  },
  {
    name: 'Aisha M.',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    review: 'Affordable and reliable. Will use again!',
    rating: 5,
  },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const styles = createStyles(theme);

  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPopularServices();
        setPopularServices(res);
      } catch (e) {
        console.log("popular error", e);
      } finally {
        setLoadingPopular(false);
      }
    };

    load();
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />

        <Hero navigation={navigation} />

        <OffersCarousel />

        <QuickActions navigation={navigation} />

        <PopularSection
          navigation={navigation}
          loading={loadingPopular}
          services={popularServices}
        />

        <SectionHeader title="What Our Users Say" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: SPACING }}
        >
          {testimonials.map((review, index) => (
            <UserReviewCard
              key={index}
              review={review}
              index={index}
            />
          ))}
        </ScrollView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}








const Header = () => {
  const { theme } = useTheme();

  return (
    <View style={headerStyles.container}>
      <AppText weight="bold" size="h1">
        GigiMan
      </AppText>

      {/* <TouchableOpacity>
        <Ionicons
          name="notifications-outline"
          size={26}
          color={theme.colors.primary}
        />
      </TouchableOpacity> */}
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
});


const Hero = ({ navigation }: any) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark]}
      style={styles.hero}
    >
      <View style={{ flex: 1 }}>
        <AppText size="h2" weight="bold" style={{ color: "#fff" }}>
          Need a hand?
        </AppText>

        <AppText style={styles.heroSub}>
          Expert home services just a tap away
        </AppText>

        <AppButton
          title="Explore Services"
          style={styles.heroBtn}
          textStyle={{ color: theme.colors.primary }}
          onPress={() => navigation.navigate("ServiceTab")}
        />
      </View>

      <Ionicons name="construct" size={60} color="rgba(255,255,255,0.2)" />
    </LinearGradient>
  );
};



const OffersCarousel = () => {
  const styles = createStyles(useTheme().theme);
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const banners = await BannerAPI.getBanners();
        setOffers(banners);
      } catch (err) {
        console.log("Failed to load banners", err);
      }
    };

    fetchBanners();
  }, []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 30 }}
    >
      {offers.map((o, i) => (
        <View key={i} style={[styles.offerCard, { width: OFFER_WIDTH }]}>
          <Image source={{ uri: o.img }} style={styles.offerImg} />

          <View style={styles.offerOverlay}>
            <AppText weight="bold" style={{ color: "#fff" }}>
              {o.title}
            </AppText>

            <AppText style={{ color: "#fff" }}>
              {o.description}
            </AppText>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const QuickActions = ({ navigation }: any) => {
  const styles = createStyles(useTheme().theme);

  return (
    <View style={styles.quickRow}>
      <TouchableOpacity
        style={styles.quickBtn}
        onPress={() => navigation.navigate("ServiceTab")}
      >
        <Ionicons name="flash" size={22} color="#fff" />
        <AppText style={styles.quickTxt}>Book Now</AppText>
      </TouchableOpacity>
    </View>
  );
};


const PopularServiceCard: React.FC<{ service: any; index: number }> = ({
  service,
  index,
}) => {
  const { theme } = useTheme();
  const styles = popularServiceStyles(theme);
  const navigation = useNavigation<Nav>();

  const image =
    service.servicecategoryImage || service.serviceImage || null;

  const handlePress = () => {
    const serviceId =
      service._id || service.serviceId || service.domainServiceId;

    navigation.navigate("ServiceTab" as any, {
      serviceCategoryId: serviceId,
    });
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 120).springify()}>
      <TouchableOpacity activeOpacity={0.92} onPress={handlePress}>
        <View style={styles.card}>
          {/* IMAGE */}
          <View style={styles.imageContainer}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[theme.colors.surface, theme.colors.border]}
                style={styles.placeholder}
              >
                {/* <FanInstall
                  width="60%"
                  height="60%"
                  fill={theme.colors.textMuted}
                  style={{ opacity: 0.4 }}
                /> */}
              </LinearGradient>
            )}

            <View style={styles.badge}>
              <AppText size="caption" weight="bold" style={{ color: "#fff" }}>
                BESTSELLER
              </AppText>
            </View>
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            <AppText weight="bold" numberOfLines={1}>
              {service.serviceCategoryName || service.name || service._id}
            </AppText>

            <AppText size="caption" color="textMuted" numberOfLines={1}>
              {service.totalBookings
                ? `${service.totalBookings} bookings • ₹${service.totalRevenue}`
                : "Popular service"}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PopularSection = ({ services, loading }: any) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (loading) {
    return (
      <>
        <SectionHeader title="Popular Now" />
        <AppText style={{ paddingLeft: SPACING }}>Loading services...</AppText>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Popular Now" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: SPACING }}
      >
        {services.map((service: any, index: number) => (
          <PopularServiceCard
            key={service._id || index}
            service={service}
            index={index}
          />
        ))}
      </ScrollView>
    </>
  );
};



const UserReviewCard = ({ review, index }: any) => {
  const { theme } = useTheme();
  const styles = reviewStyles(theme);

  return (
    <Animated.View entering={FadeInRight.delay(index * 120).springify()}>
      <View style={styles.card}>
        
        {/* USER HEADER */}
        <View style={styles.header}>
          <Image source={{ uri: review.avatar }} style={styles.avatar} />

          <View style={{ flex: 1 }}>
            <AppText weight="bold">{review.name}</AppText>

            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < review.rating ? "star" : "star-outline"}
                  size={14}
                  color={i < review.rating ? "#FFD700" : "#ccc"}
                />
              ))}
            </View>
          </View>
        </View>

        {/* REVIEW TEXT */}
        <AppText size="small" style={styles.reviewText}>
          "{review.review}"
        </AppText>
      </View>
    </Animated.View>
  );
};




const SectionHeader = ({ title }: any) => {
  const styles = createStyles(useTheme().theme);

  return (
    <View style={styles.sectionHeader}>
      <AppText weight="bold">{title}</AppText>
    </View>
  );
};




const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    hero: {
      marginHorizontal: SPACING,
      borderRadius: CARD_RADIUS,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 28,
    },

    heroSub: {
      color: "#fff",
      opacity: 0.9,
      marginVertical: 8,
    },

    heroBtn: {
      backgroundColor: "#fff",
      alignSelf: "flex-start",
    },

    offerCard: {
      marginLeft: SPACING,
      borderRadius: CARD_RADIUS,
      overflow: "hidden",
    },

    offerImg: {
      width: "100%",
      height: 120,
    },

    offerOverlay: {
      position: "absolute",
      bottom: 10,
      left: 10,
    },

    quickRow: {
      paddingHorizontal: SPACING,
      marginBottom: 30,
    },

    quickBtn: {
      backgroundColor: theme.colors.primary,
      padding: 14,
      borderRadius: 12,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },

    quickTxt: {
      color: "#fff",
      marginLeft: 8,
    },

    popularCard: {
      marginLeft: SPACING,
      borderRadius: CARD_RADIUS,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
    },

    popularImg: {
      height: 120,
      width: "100%",
    },

    popularContent: {
      padding: 12,
    },

    testimonial: {
      marginLeft: SPACING,
      padding: 16,
      borderRadius: CARD_RADIUS,
      backgroundColor: theme.colors.surface,
      width: 220,
    },

    sectionHeader: {
      paddingHorizontal: SPACING,
      marginBottom: 14,
    },
  });

const popularServiceStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: width * 0.68,
      borderRadius: 20,
      marginRight: 16,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",

      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 5,
    },

    imageContainer: {
      height: 140,
      width: "100%",
      position: "relative",
      backgroundColor: theme.colors.border,
    },

    image: {
      width: "100%",
      height: "100%",
    },

    placeholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    badge: {
      position: "absolute",
      top: 10,
      left: 10,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },

    content: {
      padding: 16,
    },
  });

  const reviewStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: width * 0.75,
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 18,
      marginRight: 16,

      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },

    ratingRow: {
      flexDirection: "row",
      marginTop: 2,
    },

    reviewText: {
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
  });