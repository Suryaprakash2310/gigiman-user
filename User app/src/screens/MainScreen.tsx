// src/screens/HomeScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { AppTabsParamList } from "../navigation/AppStack";

import { useAuthContext } from "@/src/context/AuthContext";
import { useCartContext } from "@/src/context/CartContext";
import { useNotifications } from "@/src/context/NotificationContext";
import { getBanners, getPopularServices } from "../api/dashboard.api";

const SPACING = 20;
const CARD_RADIUS = 24;

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

  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  const { user } = useAuthContext();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [popularRes, bannersRes] = await Promise.all([
          getPopularServices().catch(e => {
            console.log("popular error", e);
            return [];
          }),
          getBanners().catch(e => {
            console.log("banner error", e);
            return [];
          })
        ]);

        setPopularServices(popularRes);
        setBanners(bannersRes);
      } catch (e) {
        console.log("data load error", e);
      } finally {
        setLoadingPopular(false);
        setLoadingBanners(false);
      }
    };

    loadData();
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header user={user} navigation={navigation} />

        <Hero navigation={navigation} />

        <QuickActions navigation={navigation} />

        <OffersCarousel banners={banners} loading={loadingBanners} />

        <PopularSection
          navigation={navigation}
          loading={loadingPopular}
          services={popularServices}
        />

        <SectionHeader title="What Our Users Say" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: SPACING, paddingBottom: 16 }}
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

const Header = ({ user, navigation }: any) => {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();
  const { cartItems } = useCartContext();

  return (
    <View style={headerStyles.container}>
      <View style={{ flex: 1 }}>
        <AppText weight="bold" size="h2" style={{ color: theme.colors.text }}>
          Hi, {user?.fullName?.split(" ")[0] || "Guest"}! 👋
        </AppText>
        <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
          Find the best services for your home
        </AppText>
      </View>

      <View style={headerStyles.rightSection}>
        {/* Cart Icon Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ServiceTab", { screen: "CartScreen" } as any)}
          style={[headerStyles.actionBtn, { backgroundColor: theme.colors.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="cart-outline" size={22} color={theme.colors.button} />
          {cartItems.length > 0 && (
            <View style={[headerStyles.badge, { backgroundColor: theme.colors.primary }]}>
              <AppText
                weight="bold"
                style={{
                  color: "#fff",
                  fontSize: cartItems.length > 9 ? 8 : 10,
                  textAlign: "center",
                  lineHeight: 14,
                }}
              >
                {cartItems.length > 9 ? "9+" : cartItems.length}
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications" as any)}
          style={[headerStyles.actionBtn, { backgroundColor: theme.colors.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.colors.button} />
          {unreadCount > 0 && (
            <View style={[headerStyles.badge, { backgroundColor: theme.colors.danger }]}>
              <AppText
                weight="bold"
                style={{
                  color: "#fff",
                  fontSize: unreadCount > 9 ? 8 : 10,
                  textAlign: "center",
                  lineHeight: 14,
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 10,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  }
});

const Hero = ({ navigation }: any) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Deep indigo/navy gradient complement
  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={{ flex: 1, zIndex: 1 }}>
        <AppText size="h2" weight="bold" style={{ color: "#fff" }}>
          Need a hand?
        </AppText>

        <AppText style={styles.heroSub}>
          Expert home services just a tap away
        </AppText>

        <AppButton
          title="Explore Services"
          style={styles.heroBtn}
          textStyle={{ color: theme.colors.primary, fontWeight: '700' }}
          onPress={() => navigation.navigate("ServiceTab")}
        />
      </View>

      <Ionicons name="construct" size={70} color="rgba(255,255,255,0.15)" style={styles.heroIcon} />
    </LinearGradient>
  );
};

const OffersCarousel = ({ banners, loading }: { banners: any[], loading: boolean }) => {
  const styles = createStyles(useTheme().theme);
  const { width } = useWindowDimensions();
  const OFFER_WIDTH = width * 0.88;

  if (loading) {
    return (
      <View style={{ height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
        <AppText color="textMuted">Loading interesting offers...</AppText>
      </View>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: 28 }}>
      <SectionHeader title="Offers For You" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: SPACING }}
        snapToInterval={OFFER_WIDTH + SPACING}
        decelerationRate="fast"
      >
        {banners.map((o, i) => (
          <View key={o._id || i} style={[styles.offerCard, { width: OFFER_WIDTH }]}>
            <Image source={{ uri: o.img }} style={styles.offerImg} resizeMode="stretch" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const QuickActions = ({ navigation }: any) => {
  const { theme } = useTheme();

  const categories = [
    { name: "Cleaning", icon: "sparkles-outline", color: "#F5F3FF", iconColor: theme.colors.button },
    { name: "AC Repair", icon: "snow-outline", color: "#F5F3FF", iconColor: theme.colors.button },
    { name: "Electrical", icon: "flash-outline", color: "#F5F3FF", iconColor: theme.colors.button },
    { name: "Plumbing", icon: "water-outline", color: "#F5F3FF", iconColor: theme.colors.button },
  ];

  return (
    <View style={quickStyles.container}>
      <View style={quickStyles.headerRow}>
        <AppText weight="bold" size="h3">Services Category</AppText>
        <TouchableOpacity onPress={() => navigation.navigate("ServiceTab")} activeOpacity={0.6}>
          <AppText size="small" weight="semibold" style={{ color: theme.colors.primary }}>
            See All
          </AppText>
        </TouchableOpacity>
      </View>
      <View style={quickStyles.grid}>
        {categories.map((cat, idx) => (
          <TouchableOpacity
            key={idx}
            style={quickStyles.item}
            onPress={() => navigation.navigate("ServiceTab")}
            activeOpacity={0.7}
          >
            <View style={[quickStyles.iconCircle, { backgroundColor: cat.color }]}>
              <Ionicons name={cat.icon as any} size={24} color={cat.iconColor} />
            </View>
            <AppText weight="semibold" size="small" style={{ marginTop: 8, color: theme.colors.text }}>
              {cat.name}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const quickStyles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING,
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  item: {
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
});

const PopularServiceCard: React.FC<{ service: any; index: number }> = ({
  service,
  index,
}) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const styles = popularServiceStyles(theme, width);
  const navigation = useNavigation<Nav>();

  const image =
    service.servicecategoryImage || service.serviceImage || null;

  const handlePress = () => {
    const serviceId =
      service._id || service.serviceId || service.domainServiceId;

    navigation.navigate("ServiceTab" as any, {
      screen: "Booking",
      params: { serviceCategoryId: serviceId, fromMain: true },
    });
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 120).springify()}>
      <TouchableOpacity activeOpacity={0.92} onPress={handlePress}>
        <View style={styles.card}>
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
              </LinearGradient>
            )}

            <View style={styles.badge}>
              <AppText size="caption" weight="bold" style={{ color: "#fff" }}>
                BESTSELLER
              </AppText>
            </View>
          </View>

          <View style={styles.content}>
            <AppText weight="bold" numberOfLines={1} style={{ marginBottom: 4 }}>
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

  if (loading) {
    return (
      <View style={{ marginBottom: 28 }}>
        <SectionHeader title="Popular Now" />
        <AppText style={{ paddingLeft: SPACING }}>Loading services...</AppText>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 28 }}>
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
    </View>
  );
};

const UserReviewCard = ({ review, index }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const styles = reviewStyles(theme, width);

  return (
    <Animated.View entering={FadeInRight.delay(index * 120).springify()}>
      <View style={styles.card}>
        {/* Name and Stars Row (Name is first) */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" size="body" style={styles.userName}>
              {review.name}
            </AppText>
          </View>
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < review.rating ? "star" : "star-outline"}
                size={12}
                color={i < review.rating ? "#FFD700" : "#ccc"}
                style={{ marginLeft: 2 }}
              />
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Review Text */}
        <AppText size="small" color="textMuted" style={styles.reviewText}>
          "{review.review}"
        </AppText>

        <View style={styles.quoteIcon}>
          <Ionicons name="chatbubble" size={24} color={theme.colors.primary} style={{ opacity: 0.05 }} />
        </View>
      </View>
    </Animated.View>
  );
};

const SectionHeader = ({ title }: any) => {
  const styles = createStyles(useTheme().theme);

  return (
    <View style={styles.sectionHeader}>
      <AppText weight="bold" size="h3">{title}</AppText>
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
      padding: 24,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 28,
      position: 'relative',
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },

    heroSub: {
      color: "#fff",
      opacity: 0.9,
      marginVertical: 10,
      fontSize: 14,
    },

    heroBtn: {
      backgroundColor: "#fff",
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 12,
    },

    heroIcon: {
      position: 'absolute',
      right: 15,
      bottom: 5,
    },

    offerCard: {
      marginLeft: SPACING,
      borderRadius: CARD_RADIUS,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    offerImg: {
      width: "100%",
      height: 180,
    },

    sectionHeader: {
      paddingHorizontal: SPACING,
      marginBottom: 14,
    },
  });

const popularServiceStyles = (theme: any, screenWidth: number) =>
  StyleSheet.create({
    card: {
      width: screenWidth * 0.64,
      borderRadius: CARD_RADIUS,
      marginRight: 16,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    imageContainer: {
      height: 130,
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
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },

    content: {
      padding: 16,
    },
  });

const reviewStyles = (theme: any, screenWidth: number) =>
  StyleSheet.create({
    card: {
      width: screenWidth * 0.72,
      backgroundColor: theme.colors.surface,
      borderRadius: CARD_RADIUS,
      padding: 16,
      marginRight: 16,
      position: 'relative',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.02,
      shadowRadius: 8,
      elevation: 2,
    },

    quoteIcon: {
      position: 'absolute',
      bottom: 12,
      right: 12,
    },

    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },

    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    reviewText: {
      color: theme.colors.text,
      lineHeight: 20,
      fontSize: 13,
      fontStyle: 'italic',
    },

    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginBottom: 10,
    },

    userName: {
      fontSize: 14,
      color: theme.colors.text,
    },
  });