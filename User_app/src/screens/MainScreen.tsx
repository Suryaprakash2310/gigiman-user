import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import AnimatedRN, {
  FadeInLeft,
  FadeInRight
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DomainService, ServiceAPI } from "@/src/api/service.api";
import CategoryCard from "@/src/components/home/CategoryCard";
import CategorySkeleton from "@/src/components/home/CategorySkeleton";
import AppText from "@/src/components/ui/AppText";
import { prefetchImages } from "@/src/components/ui/OptimizedImage";
import { useAuthContext } from "@/src/context/AuthContext";
import { useCartContext } from "@/src/context/CartContext";
import { useNotifications } from "@/src/context/NotificationContext";
import {
  getStatusBadgeConfig,
  isComingSoon,
  sortServicesByAvailability,
} from "@/src/utils/serviceStatus";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { getBanners, getPopularServices } from "../api/dashboard.api";
import { AppTabsParamList } from "../navigation/AppStack";

/* ══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS  — 2026 Visual Language
   Each section owns its background. No shared white surface.
   ══════════════════════════════════════════════════════════════════════ */
const C = {
  // ① Hero — Ultra-deep forest green
  h1: "#04110D",
  h2: "#0D2A1A",
  hAccent: "#4ade80",    // vibrant neon-green accent

  // ② Categories — Soft lavender
  catBg: "#F3EFFF",
  catAccent: "#0D2A1A", // purple

  // ③ Popular — Midnight cinema
  popBg: "#07101C",
  popAccent: "#4ade80",

  // ④ Why — Mint / sage
  whyBg: "#EDF9F4",
  whyAccent: "#059669", // emerald

  // ⑤ Reviews — Deep navy
  revBg: "#0B1422",

  // ⑥ Refer — Amber gold
  refBg1: "#92400e",
  refBg2: "#F59E0B",
};

const CURVE = 44;   // shared border-radius for section transitions
type Nav = BottomTabNavigationProp<AppTabsParamList, "HomeTab">;

const TESTIMONIALS = [
  { name: "Sebastin.", avatar: "https://randomuser.me/api/portraits/women/44.jpg", review: "I truly appreciate their hard work and would highly recommend Gigi to anyone looking for reliable and efficient house cleaning services. One of the best cleaning services I have experienced. Thank you, Gigiman Services, for the excellent work!", rating: 5, service: "Deep Cleaning" },
  { name: "James.", avatar: "https://randomuser.me/api/portraits/men/36.jpg", review: "I recently used Gigi House Cleaning Service, and I am extremel The team was professional, punctual, and paid great attention to detail. Every area of my home was cleaned thoroughly, leaving the house fresh, spotless, and well-organized.", rating: 5, service: "Home Cleaning" },
  { name: "Aisha M.", avatar: "https://randomuser.me/api/portraits/women/68.jpg", review: "Their dedication, friendly attitude, and high-quality service exceeded my expectations. I truly appreciate their hard work and would highly recommend Gigiman Company to anyone looking for reliable and efficient house cleaning services.", rating: 5, service: "Deep Cleaning" },
];

/* ══════════════════════════════════════════════════════════════════════
   ROOT SCREEN
   ══════════════════════════════════════════════════════════════════════ */
export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();

  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pop, ban] = await Promise.all([
          getPopularServices().catch(() => []),
          getBanners().catch(() => []),
        ]);
        setPopularServices(pop);
        setBanners(ban);
      } catch { }
      finally {
        setLoadingPopular(false);
        setLoadingBanners(false);
      }
    })();
  }, []);

  return (
    /* Outer shell — dark matches hero for top overscroll */
    <View style={{ flex: 1, backgroundColor: C.h1 }}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ① HERO — Dark Forest, curved bottom */}
        <HeroSection user={user} navigation={navigation} insets={insets} />

        {/* ② CATEGORIES — Lavender strip (no gap, hero curves into it) */}
        <View style={{ backgroundColor: C.catBg }}>
          <CategorySection navigation={navigation} />
        </View>

        {/* ③ OFFERS — on lavender, if banners exist */}
        <View style={{ backgroundColor: C.catBg }}>
          <OffersSection banners={banners} loading={loadingBanners} />
        </View>

        {/* ④ POPULAR — Midnight, curved top sitting on lavender */}
        <View style={{ backgroundColor: C.catBg }}>
          <PopularSection
            navigation={navigation}
            loading={loadingPopular}
            services={popularServices}
          />
        </View>

        {/* ⑤ WHY GIGIMAN — Mint, curved top on midnight */}
        <View style={{ backgroundColor: C.popBg }}>
          <WhySection />
        </View>

        {/* ⑥ REVIEWS — Dark navy, curved top on mint */}
        <View style={{ backgroundColor: C.whyBg }}>
          <ReviewsSection />
        </View>

        {/* ⑦ REFER & EARN — Amber, curved top on dark navy */}
        <View style={{ backgroundColor: C.revBg }}>
          <ReferSection navigation={navigation} />
        </View>

      </ScrollView>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ① HERO SECTION & TOP APP BAR (Native Mobile App Experience)
   ══════════════════════════════════════════════════════════════════════ */
function HeroSection({ user, navigation, insets }: any) {
  const { unreadCount } = useNotifications();
  const { cartItems } = useCartContext();

  // Notification dot pulse
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [unreadCount]);

  const userName = user?.fullName?.split(" ")[0] || "Guest";

  return (
    <View style={[hS.shell, { paddingTop: insets.top + 8 }]}>
      {/* ── TOP APP BAR (Location & Action Icons) ── */}
      <View style={hS.topBar}>
        {/* Left: Location & User Greeting */}
        <View style={hS.locationContainer}>
          {/* <View style={hS.locationIconBg}>
            <Ionicons name="location" size={20} color="#4ade80" />
          </View> */}
          <View style={{ marginLeft: 10, justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <AppText weight="bold" style={{ color: "#ffffff", fontSize: 20 }}>
                Hi, {userName}
              </AppText>
              {/* <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} /> */}
            </View>
            {/* <AppText style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 1 }} numberOfLines={1}>
              Hi, {userName} • Tap to set address
            </AppText> */}
          </View>
        </View>

        {/* Right: Cart & Notifications */}
        <View style={hS.actionRow}>
          <Pressable
            onPress={() => navigation.navigate("ServiceTab", { screen: "CartScreen" } as any)}
            style={({ pressed }) => [hS.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="cart-outline" size={20} color="#ffffff" />
            {cartItems.length > 0 && (
              <View style={hS.badge}>
                <AppText weight="bold" style={hS.badgeText}>
                  {cartItems.length > 9 ? "9+" : cartItems.length}
                </AppText>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Notifications" as any)}
            style={({ pressed }) => [hS.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="notifications-outline" size={20} color="#ffffff" />
            {unreadCount > 0 && (
              <Animated.View style={[hS.badge, { backgroundColor: "#ef4444", transform: [{ scale: pulse }] }]}>
                <AppText weight="bold" style={hS.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </AppText>
              </Animated.View>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── NATIVE SEARCH BAR ── */}
      {/* <Pressable onPress={() => navigation.navigate("ServiceTab")} style={hS.searchBar}>
        <Ionicons name="search-outline" size={19} color="#26413C" style={{ marginRight: 10 }} />
        <AppText style={hS.searchPlaceholder}>
          Search for "Cleaning", "AC Service"...
        </AppText>
        <View style={hS.filterBtn}>
          <Ionicons name="options-outline" size={16} color="#ffffff" />
        </View>
      </Pressable> */}

      {/* ── NATIVE FEATURED PROMO HERO CARD ── */}
      <View style={hS.promoCard}>
        <LinearGradient
          colors={["#16352E", "#0B201B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Subtle geometric pattern overlay */}
        <View style={hS.promoPattern} />

        <View style={hS.promoContent}>
          {/* <View style={hS.promoTag}>
            <Ionicons name="flash" size={12} color="#4ade80" />
            <AppText weight="bold" style={hS.promoTagText}>
              GIGIMAN EXPRESS
            </AppText>
          </View> */}

          <AppText weight="bold" style={hS.promoTitle}>
            Quality Home Care{"\n"}At Your Doorstep
          </AppText>

          <AppText style={hS.promoSubtitle}>
            Certified professionals • 100% Guaranteed
          </AppText>

          <Pressable
            onPress={() => navigation.navigate("ServiceTab")}
            style={({ pressed }) => [hS.ctaButton, { opacity: pressed ? 0.85 : 1 }]}
          >
            <AppText weight="bold" style={hS.ctaText}>
              Explore Services
            </AppText>
            <Ionicons name="arrow-forward" size={14} color="#0D2A1A" style={{ marginLeft: 6 }} />
          </Pressable>
        </View>

        {/* Floating Quick Benefit Chips on Right Side */}
        <View style={hS.benefitColumn}>
          <View style={hS.benefitChip}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <AppText weight="bold" style={hS.benefitText}>4.9★ Rated</AppText>
          </View>
          <View style={hS.benefitChip}>
            <Ionicons name="shield-checkmark" size={12} color="#4ade80" />
            <AppText weight="bold" style={hS.benefitText}>Verified</AppText>
          </View>
          <View style={hS.benefitChip}>
            <Ionicons name="time" size={12} color="#38bdf8" />
            <AppText weight="bold" style={hS.benefitText}>Fast Arrival</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const hS = StyleSheet.create({
  shell: {
    backgroundColor: C.h1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: CURVE,
    borderBottomRightRadius: CURVE,


  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  locationIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4ade80",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#04110D",
    fontSize: 9,
    lineHeight: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 8,
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  searchPlaceholder: {
    flex: 1,
    color: "#64748B",
    fontSize: 13,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#26413C",
    justifyContent: "center",
    alignItems: "center",
  },
  promoCard: {
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },
  promoPattern: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(74, 222, 128, 0.05)",
  },
  promoContent: {
    flex: 1,
    paddingRight: 10,
  },
  promoTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  promoTagText: {
    color: "#4ade80",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  promoTitle: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
  },
  promoSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 14,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4ade80",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  ctaText: {
    color: "#0D2A1A",
    fontSize: 12,
  },
  benefitColumn: {
    gap: 8,
    justifyContent: "center",
  },
  benefitChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  benefitText: {
    color: "#ffffff",
    fontSize: 10,
  },
});

const CACHE_KEY_SERVICES = "@gigiman_cached_services";

  function CategorySection({ navigation }: any) {
  const [services, setServices] = useState<DomainService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { width } = useWindowDimensions();

  const isCompact = width < 600;
  const columns = isCompact ? 2 : 3;
  const cardWidth = (width - 48 - (columns - 1) * 12) / columns;
  const maxVisibleCount = isCompact ? 6 : 9;

  const fetchAndCacheServices = useCallback(async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY_SERVICES);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setServices(parsed);
          setLoading(false);

          const cachedUrls = parsed
            .map((s: any) => s.domainImage || s.serviceImage || s.image)
            .filter(Boolean);
          prefetchImages(cachedUrls);
        }
      }

      const res = await ServiceAPI.getServicesAPI();
      const rawList = res?.services || [];
      const activeServices = (rawList as DomainService[]).filter(
        (s) => !isComingSoon(s.status)
      );

      const freshUrls = activeServices
        .map((s: any) => s.domainImage || s.serviceImage || s.image)
        .filter(Boolean);
      prefetchImages(freshUrls);

      const serializedFresh = JSON.stringify(activeServices);
      if (cachedData !== serializedFresh) {
        await AsyncStorage.setItem(CACHE_KEY_SERVICES, serializedFresh);
        setServices(activeServices);
      }
    } catch (error) {
      console.error("CategorySection load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndCacheServices();
  }, [fetchAndCacheServices]);

  const activeServices = useMemo(() => {
    return services.filter((service) => !isComingSoon(service.status));
  }, [services]);

  const displayItems = useMemo(() => {
    return activeServices.slice(0, maxVisibleCount);
  }, [activeServices, maxVisibleCount]);

  return (
    <View style={styles.categorySection}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleWrap}>
          <View style={styles.eyebrowDot} />
          <AppText style={styles.eyebrowText}>Browse</AppText>
        </View>
        <View style={styles.headerRow}>
          <AppText weight="bold" style={styles.sectionTitle}>
            Professional Home Services
          </AppText>
          <TouchableOpacity onPress={() => navigation.navigate("ServiceTab")} activeOpacity={0.7}>
            <AppText weight="semibold" style={styles.seeAllText}>See all</AppText>
          </TouchableOpacity>
        </View>
        <AppText style={styles.sectionSubtitle}>
          Choose the service you need and get started instantly.
        </AppText>
      </View>

      {loading && services.length === 0 ? (
        <CategorySkeleton count={isCompact ? 4 : 6} columns={columns} />
      ) : (
        <>
          <View style={styles.listContent}>
            <View style={styles.gridRow}>
              {displayItems.map((item, index) => {
                const isLastInRow = (index + 1) % columns === 0;
                return (
                  <View
                    key={item._id}
                    style={[
                      styles.gridItem,
                      !isLastInRow && styles.gridItemSpacing,
                    ]}
                  >
                    <CategoryCard
                      service={item}
                      cardWidth={cardWidth}
                      onPress={() => navigation.navigate("ServiceTab")}
                    />
                  </View>
                );
              })}
            </View>
          </View>
          {activeServices.length > displayItems.length ? (
            <TouchableOpacity onPress={() => navigation.navigate("ServiceTab")} activeOpacity={0.85} style={styles.viewAllButton}>
              <Ionicons name="apps-outline" size={16} color="#0D2A1A" />
              <AppText weight="semibold" style={styles.viewAllButtonText}>View All Services</AppText>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categorySection: {
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.catAccent,
  },
  eyebrowText: {
    color: C.catAccent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 22,
    lineHeight: 28,
    flex: 1,
  },
  seeAllText: {
    color: C.catAccent,
    fontSize: 13,
  },
  sectionSubtitle: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 320,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  gridItem: {
    marginBottom: 12,
  },
  gridItemSpacing: {
    marginRight: 12,
  },
  viewAllButton: {
    marginTop: 6,
    marginHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(13, 42, 26, 0.04)",
    gap: 8,
  },
  viewAllButtonText: {
    color: "#0D2A1A",
    fontSize: 13,
  },
});

/* ══════════════════════════════════════════════════════════════════════
   ③ OFFERS SECTION
   Visual: Edge-to-edge banners on lavender. Animated dot indicators.
   ══════════════════════════════════════════════════════════════════════ */
function OffersSection({ banners, loading }: { banners: any[]; loading: boolean }) {
  const { width } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const OFFER_W = width - 48;

  if (loading || !banners?.length) return null;

  return (
    <View style={{ paddingBottom: 8 }}>
      <View style={{ paddingHorizontal: 24, marginBottom: 16, marginTop: 8 }}>
        <AppText weight="bold" style={{ color: "#1a1a2e", fontSize: 20 }}>
          🎁 Exclusive Offers
        </AppText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, gap: 16 }}
        snapToInterval={OFFER_W + 16}
        decelerationRate="fast"
        onScroll={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / (OFFER_W + 16)))}
        scrollEventThrottle={16}
      >
        {banners.map((o: any, i: number) => (
          <View key={i} style={[offS.card, { width: OFFER_W }]}>
            <Image source={{ uri: o.img }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      {banners.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 14 }}>
          {banners.map((_: any, i: number) => (
            <View
              key={i}
              style={{
                height: 5, borderRadius: 3,
                width: i === idx ? 22 : 6,
                backgroundColor: i === idx ? C.catAccent : "#c4b5fd",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const offS = StyleSheet.create({
  card: {
    borderRadius: 20, overflow: "hidden",
    height: "100%",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14 },
      android: { elevation: 4 },
    }),
  },
});

/* ══════════════════════════════════════════════════════════════════════
   ④ POPULAR SECTION — Cinema Dark Mode
   Visual: Midnight navy bg, curved top on lavender.
   Cards = full-photo with gradient overlay text. NO white frames.
   ══════════════════════════════════════════════════════════════════════ */
function PopularSection({ navigation, loading, services }: any) {
  const { width } = useWindowDimensions();
  const sorted = sortServicesByAvailability(services || []);

  return (
    <View style={popS.shell}>
      {/* Section header */}
      <View style={{ paddingHorizontal: 24, marginBottom: 28, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View>
          <AppText style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: "700", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>
            Trending This Week
          </AppText>
          <AppText weight="bold" style={{ color: "#fff", fontSize: 28 }}>
            Popular Now
          </AppText>
        </View>
        <Pressable
          onPress={() => navigation.navigate("ServiceTab")}
          style={popS.seeAllChip}
        >
          <AppText weight="semibold" style={{ color: C.popAccent, fontSize: 12 }}>
            See All →
          </AppText>
        </Pressable>
      </View>

      {loading ? (
        <AppText style={{ color: "rgba(255,255,255,0.3)", paddingLeft: 24, marginBottom: 24 }}>
          Loading services…
        </AppText>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, gap: 14 }}
        >
          {sorted.map((svc: any, i: number) => (
            <CinemaCard key={`${svc._id || i}`} service={svc} index={i} screenW={width} navigation={navigation} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const popS = StyleSheet.create({
  shell: {
    backgroundColor: C.popBg,
    borderTopLeftRadius: CURVE,
    borderTopRightRadius: CURVE,
    paddingTop: 40,
    paddingBottom: 44,
  },
  seeAllChip: {
    backgroundColor: "rgba(74,222,128,0.1)",
    borderWidth: 1, borderColor: "rgba(74,222,128,0.28)",
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
});

/* Cinema-style service card — image IS the card */
function CinemaCard({ service, index, screenW, navigation }: any) {
  const image = service.servicecategoryImage || service.serviceImage || null;
  const badgeConfig = getStatusBadgeConfig(service.status);
  const comingSoon = isComingSoon(service.status);
  const CARD_W = Math.min(screenW * 0.55, 215);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  const handlePress = () => {
    if (comingSoon) {
      Alert.alert("Coming Soon", "This service is coming soon and cannot be booked yet.");
      return;
    }
    const serviceId = service._id || service.serviceId || service.domainServiceId;
    navigation.navigate("ServiceTab" as any, {
      screen: "Booking",
      params: { serviceCategoryId: serviceId, fromMain: true },
    });
  };

  return (
    <AnimatedRN.View entering={FadeInRight.delay(index * 90).springify()}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={[cinS.card, { width: CARD_W }]}>
            {/* Full-card photo */}
            {image
              ? <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : <LinearGradient colors={["#1a3020", "#0d2016"]} style={StyleSheet.absoluteFill} />
            }
            {/* Vignette overlay */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.94)"]}
              style={cinS.vignette}
            />
            {/* Status badge */}
            {badgeConfig ? (
              <View style={[cinS.topBadge, { backgroundColor: badgeConfig.bgColor, borderColor: badgeConfig.borderColor, borderWidth: 1 }]}>
                <AppText size="caption" weight="bold" style={{ color: badgeConfig.textColor }}>{badgeConfig.label}</AppText>
              </View>
            ) : (
              <View style={[cinS.topBadge, { backgroundColor: "#059669" }]}>
                <AppText size="caption" weight="bold" style={{ color: "#fff" }}>★ TOP</AppText>
              </View>
            )}
            {/* Bottom text overlay */}
            <View style={cinS.textOverlay}>
              <AppText weight="bold" style={{ color: "#fff", fontSize: 14 }} numberOfLines={1}>
                {service.serviceCategoryName || service.name || "Service"}
              </AppText>
              <AppText style={{ color: "rgba(255,255,255,0.52)", fontSize: 11, marginTop: 3 }} numberOfLines={1}>
                {comingSoon ? "Coming Soon" : service.totalBookings ? `${service.totalBookings} bookings` : "Popular"}
              </AppText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 9 }}>
                <AppText weight="semibold" style={{ color: C.popAccent, fontSize: 11 }}>
                  {comingSoon ? "Notify me" : "Book now"}
                </AppText>
                <Ionicons name="arrow-forward" size={11} color={C.popAccent} />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </AnimatedRN.View>
  );
}

const cinS = StyleSheet.create({
  card: {
    height: 235,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1a2e1f",
  },
  vignette: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: "72%",
  },
  topBadge: {
    position: "absolute", top: 12, left: 12,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  textOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 14,
  },
});

/* ══════════════════════════════════════════════════════════════════════
   ⑤ WHY SECTION — Mint / Sage Green
   Visual: Curved top on midnight. Pure layout rows — NO white cards.
   Ghost number + icon + text. Alternating left/right offset.
   ══════════════════════════════════════════════════════════════════════ */
function WhySection() {
  const FEATURES = [
    { num: "01", title: "Verified Professionals", desc: "Background-checked, certified experts every time.", icon: "shield-checkmark-outline" as const, color: "#059669" },
    { num: "02", title: "Always On Time", desc: "We respect your schedule. Guaranteed.", icon: "time-outline" as const, color: "#059669" },
    { num: "03", title: "Safe Payments", desc: "100 % encrypted by razorpay. Zero hidden charges.", icon: "lock-closed-outline" as const, color: "#059669" },
    { num: "04", title: "Satisfaction First", desc: "Not happy? We'll make it right — no questions.", icon: "heart-outline" as const, color: "#059669" },
  ];

  return (
    <View style={whyS.shell}>
      {/* Section headline */}
      <View style={{ paddingHorizontal: 24, marginBottom: 36 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <View style={{ width: 30, height: 3, borderRadius: 2, backgroundColor: C.whyAccent }} />
          <AppText style={{ color: C.whyAccent, fontSize: 10, fontWeight: "700", letterSpacing: 2.5, textTransform: "uppercase" }}>
            Our Promise
          </AppText>
        </View>
        <AppText weight="bold" style={{ color: "#052014", fontSize: 30, lineHeight: 40 }}>
          Why Millions{"\n"}Choose GigiMan
        </AppText>
      </View>

      {/* Feature list — alternating offset, NO cards */}
      <View style={{ paddingHorizontal: 24 }}>
        {FEATURES.map((f, i) => (
          <AnimatedRN.View key={i} entering={FadeInLeft.delay(80 + i * 90).springify()}>
            <View style={[whyS.row, i % 2 === 1 && whyS.rowShifted]}>
              {/* Ghost number behind */}
              <AppText weight="bold" style={[whyS.ghost, { color: f.color }]}>{f.num}</AppText>
              {/* Icon */}
              <View style={[whyS.iconBox, { backgroundColor: f.color + "1A" }]}>
                <Ionicons name={f.icon} size={24} color={f.color} />
              </View>
              {/* Text */}
              <View style={{ flex: 1, marginLeft: 16 }}>
                <AppText weight="bold" style={{ color: "#052014", fontSize: 15, marginBottom: 4 }}>
                  {f.title}
                </AppText>
                <AppText style={{ color: "#3d7055", fontSize: 12, lineHeight: 18 }}>
                  {f.desc}
                </AppText>
              </View>
              {/* Right accent bar */}
              <View style={[whyS.accentBar, { backgroundColor: f.color }]} />
            </View>
            {i < FEATURES.length - 1 && (
              <View style={{ height: 1, backgroundColor: "#c8e8d8", marginVertical: 6, marginLeft: i % 2 === 1 ? 40 : 0 }} />
            )}
          </AnimatedRN.View>
        ))}
      </View>

      {/* Bottom trust strip */}
      <View style={whyS.trustStrip}>
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <AppText weight="bold" style={{ color: "#fff", fontSize: 14, marginLeft: 10, flex: 1 }}>
          Trusted by 500+ happy customers
        </AppText>
        <View style={{ flexDirection: "row" }}>
          {[1, 2, 3, 4, 5].map(k => <Ionicons key={k} name="star" size={12} color="#fbbf24" />)}
        </View>
      </View>
    </View>
  );
}

const whyS = StyleSheet.create({
  shell: {
    backgroundColor: C.whyBg,
    borderTopLeftRadius: CURVE,
    borderTopRightRadius: CURVE,
    paddingTop: 44, paddingBottom: 0,
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  rowShifted: {
    paddingLeft: 20,   // asymmetric offset for alternating rows
  },
  ghost: {
    position: "absolute", left: -4, top: 4,
    fontSize: 52, opacity: 0.07, lineHeight: 52,
    fontWeight: "900",
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 18,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  accentBar: {
    width: 3, height: 36, borderRadius: 2,
    marginLeft: 12, flexShrink: 0,
  },
  trustStrip: {
    backgroundColor: C.whyAccent,
    marginTop: 36,
    paddingHorizontal: 24, paddingVertical: 20,
    flexDirection: "row", alignItems: "center",
  },
});

/* ══════════════════════════════════════════════════════════════════════
   ⑥ REVIEWS SECTION — Dark Navy Editorial
   Visual: Curved top on mint. Giant ghost quote mark. No card borders —
   just translucent frosted panels on deep navy canvas.
   ══════════════════════════════════════════════════════════════════════ */
function ReviewsSection() {
  const { width } = useWindowDimensions();

  return (
    <View style={revS.shell}>
      {/* Ghost quote mark — editorial flavour */}
      <View style={{ paddingHorizontal: 24 }}>
        <AppText weight="bold" style={{ color: "rgba(255,255,255,0.06)", fontSize: 130, lineHeight: 96 }}>
          "
        </AppText>
      </View>

      {/* Label + headline */}
      <View style={{ paddingHorizontal: 24, marginTop: -20, marginBottom: 28 }}>
        <AppText style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: "700", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>
          Testimonials
        </AppText>
        <AppText weight="bold" style={{ color: "#fff", fontSize: 28, lineHeight: 36 }}>
          Our Users{"\n"}Love Us ❤️
        </AppText>
      </View>

      {/* Horizontal frosted review panels */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, gap: 14 }}
      >
        {TESTIMONIALS.map((r, i) => (
          <AnimatedRN.View key={i} entering={FadeInRight.delay(i * 110).springify()}>
            <View style={[revS.panel, { width: Math.min(width * 0.75, 300) }]}>
              {/* Star rating */}
              <View style={{ flexDirection: "row", gap: 3, marginBottom: 14 }}>
                {[...Array(5)].map((_, si) => (
                  <Ionicons key={si} name={si < r.rating ? "star" : "star-outline"} size={14}
                    color={si < r.rating ? "#fbbf24" : "rgba(255,255,255,0.2)"} />
                ))}
              </View>
              {/* Review text */}
              <AppText style={{ color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 22, fontStyle: "italic", marginBottom: 20 }}>
                "{r.review}"
              </AppText>
              <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginBottom: 16 }} />
              {/* User row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {/* <Image source={{ uri: r.avatar }} style={revS.avatar} /> */}
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <AppText weight="bold" style={{ color: "#fff", fontSize: 13 }}>{r.name}</AppText>
                    <Ionicons name="checkmark-circle" size={14} color={C.hAccent} />
                  </View>
                  <AppText style={{ color: "rgba(255,255,255,0.38)", fontSize: 11 }}>{r.service}</AppText>
                </View>
              </View>
            </View>
          </AnimatedRN.View>
        ))}
      </ScrollView>

      <View style={{ height: 44 }} />
    </View>
  );
}

const revS = StyleSheet.create({
  shell: {
    backgroundColor: C.revBg,
    borderTopLeftRadius: CURVE,
    borderTopRightRadius: CURVE,
    paddingTop: 40,
  },
  panel: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 24, padding: 22,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderColor: C.hAccent,
  },
});

/* ══════════════════════════════════════════════════════════════════════
   ⑦ REFER & EARN SECTION — Amber Gold
   Visual: Curved top on dark navy. Full-bleed amber gradient.
   Animated bouncing gift icon. Frosted steps row.
   ══════════════════════════════════════════════════════════════════════ */
function ReferSection({ navigation }: any) {
  // Bouncing gift
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -14, duration: 700, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 4, duration: 400, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 900, useNativeDriver: true }), // pause
    ])).start();
  }, []);

  // Button pulse
  const btnScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(btnScale, { toValue: 1.04, duration: 700, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);

  const STEPS = [
    { icon: "share-social-outline" as const, label: "Share\nyour code" },
    { icon: "person-add-outline" as const, label: "Friend\nsigns up" },
    { icon: "wallet-outline" as const, label: "Both save\n5% off" },
  ];

  return (
    <LinearGradient
      colors={[C.refBg1, "#C2680A", C.refBg2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={refS.shell}
    >
      {/* Decorative blobs */}
      <View style={refS.blob1} />
      <View style={refS.blob2} />
      <View style={refS.blob3} />

      {/* Floating gift */}
      <Animated.View style={[refS.giftWrap, { transform: [{ translateY: bounce }] }]}>
        <Ionicons name="gift" size={90} color="rgba(255,255,255,0.18)" />
      </Animated.View>

      {/* Tag label */}
      <View style={refS.tag}>
        <AppText weight="bold" style={{ color: "#92400e", fontSize: 11, letterSpacing: 0.8 }}>
          🎁  REFER &amp; EARN
        </AppText>
      </View>

      {/* Headline */}
      <AppText weight="bold" style={{ color: "#fff", fontSize: 32, lineHeight: 42, marginTop: 18, marginBottom: 12 }}>
        Invite Friends.{"\n"}Earn Rewards.
      </AppText>

      <AppText style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 22, marginBottom: 30 }}>
        Share your code — they get 5% off, you get 5% off. Win-win!
      </AppText>

      {/* CTA button */}
      <Animated.View style={{ transform: [{ scale: btnScale }], alignSelf: "flex-start" }}>
        <Pressable
          onPress={() => navigation.navigate("ProfileTab", { screen: "InviteReferralScreen" } as any)}
          style={({ pressed }) => [refS.ctaBtn, { opacity: pressed ? 0.82 : 1 }]}
        >
          <AppText weight="bold" style={{ color: "#92400e", fontSize: 15 }}>
            Start Inviting →
          </AppText>
        </Pressable>
      </Animated.View>

      {/* How it works steps */}
      <View style={refS.stepsBox}>
        <AppText weight="bold" style={{ color: "#92400e", fontSize: 12, marginBottom: 16, textAlign: "center", letterSpacing: 1 }}>
          HOW IT WORKS
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <View style={{ alignItems: "center", flex: 1 }}>
                <View style={refS.stepIcon}>
                  <Ionicons name={s.icon} size={20} color={C.refBg1} />
                </View>
                <AppText weight="semibold" style={{ color: "#92400e", fontSize: 11, textAlign: "center", marginTop: 8, lineHeight: 16 }}>
                  {s.label}
                </AppText>
              </View>
              {i < 2 && (
                <View style={{ paddingTop: 14, flexShrink: 0 }}>
                  <Ionicons name="chevron-forward" size={16} color="rgba(146,64,14,0.4)" />
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const refS = StyleSheet.create({
  shell: {
    borderTopLeftRadius: CURVE,
    borderTopRightRadius: CURVE,
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 64,
    overflow: "hidden",
    position: "relative",
  },
  blob1: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -70, right: -60,
  },
  blob2: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: 50, left: -30,
  },
  blob3: {
    position: "absolute", width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: "55%", right: 30,
  },
  giftWrap: {
    position: "absolute", right: 20, top: 64, zIndex: 1,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.88)",
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  ctaBtn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 26, paddingVertical: 14,
  },
  stepsBox: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 22,
    padding: 20,
    marginTop: 32,
  },
  stepIcon: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#fde68a",
    justifyContent: "center", alignItems: "center",
  },
});