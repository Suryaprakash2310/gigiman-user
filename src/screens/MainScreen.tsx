// src/screens/HomeScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FanInstall from '@/assets/images/FanInstall.svg';
import AppButton from '@/src/components/ui/AppButton';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { getPopularServices } from '../api/dashboard.api';
import { ServiceAPI } from '../api/service.api';
import { AppTabsParamList } from '../navigation/AppStack';
type Nav = BottomTabNavigationProp<AppTabsParamList, "HomeTab">;
const { width } = Dimensions.get('window');

/* -------------------------------------------------------------------------- */
/*                               MOCK CONFIG DATA                             */
/* -------------------------------------------------------------------------- */

type ServiceCategory = {
  id: string;
  label: string;
  icon: any;
};

type PopularService = {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
};

export type RecentService = {
  id: string;
  name: string;
  icon: any;
};


const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'hair', label: 'Electrical', icon: FanInstall },
  { id: 'clean', label: 'Cleaning', icon: FanInstall },
  { id: 'paint', label: 'Painting', icon: FanInstall },
  { id: 'cook', label: 'Plumbing', icon: FanInstall },
];



export const RECENT_SERVICES: RecentService[] = [
  { id: '1', name: 'AC Repair', icon: FanInstall },
  { id: '2', name: 'Fan Installation', icon: FanInstall },
  { id: '3', name: 'Home Cleaning', icon: FanInstall },
];


/* -------------------------------------------------------------------------- */
/*                                  SCREEN                                     */
/* -------------------------------------------------------------------------- */

const HomeScreen: React.FC = () => {
  const { theme, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const navigation = useNavigation<Nav>();

  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(DEFAULT_SERVICE_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(true);


  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const data = await getPopularServices();
        setPopularServices(data);
      } catch (err) {
        console.log("Popular service error:", err);
      } finally {
        setLoadingPopular(false);
      }
    };

    fetchPopular();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await ServiceAPI.getServicesAPI();
        const items = Array.isArray(data) ? data : (data?.services ?? data?.serviceNames ?? []);
        const mapped = (items || []).slice(0, 6).map((it: any) => ({
          id: it._id || it.id || String(it),
          label: it.domainName || it.serviceName || it.serviceCategoryName || String(it),
          icon: it.serviceImage,
        }));
        if (mapped.length > 0) setServiceCategories(mapped);

      } catch (err) {
        console.log('Service categories error:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);



  useEffect(() => {
    setMode?.('light');
  }, [setMode]);

  const Header = () => (
    <View style={styles.headerContainer}>
      <AppText weight="bold" size="h1" style={styles.headerTitle}>GigiMan</AppText>
    </View>
  );

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        {/* --------------------------- HERO CARD --------------------------- */}
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={{ flex: 1 }}>
                <AppText
                  weight="bold"
                  size="h2"
                  style={{ color: '#fff', marginBottom: 4 }}
                >
                  Need a hand?
                </AppText>
                <AppText
                  size="small"
                  style={{
                    color: '#E2F3F4',
                    marginBottom: 16,
                    lineHeight: 20,
                    opacity: 0.9,
                  }}
                >
                  Expert services for your home needs, just a tap away.
                </AppText>
                <AppButton
                  title="Explore Services"
                  variant="primary" // Changed to primary but we will override style for white look
                  textStyle={{ color: theme.colors.primary }}
                  style={styles.exploreButton}
                  onPress={() => { navigation.navigate("ServiceTab") }}
                />
              </View>

              {/* Enhanced Illustration Placeholder */}
              <View style={styles.heroIllustration}>
                <View style={[styles.glassCircle, { top: -20, right: -20, width: 80, height: 80 }]} />
                <View style={[styles.glassCircle, { bottom: -10, left: -10, width: 50, height: 50 }]} />
                {/* <FanInstall width={100} height={100} fill="rgba(255,255,255,0.2)" /> */}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={{ height: 24 }} />

        {/* ------------------------ RECENT BOOKINGS ------------------------ */}
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
          <SectionHeader
            title="Recent Activity"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {RECENT_SERVICES.map((s, index) => (
              <RecentServiceCard key={s.id} service={s} index={index} />
            ))}
          </ScrollView>
        </Animated.View>

        <View style={{ height: 24 }} />

        {/* ------------------------ POPULAR SERVICES ----------------------- */}
        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
          <SectionHeader
            title="Popular Now"
            onPressViewAll={() => { navigation.navigate("ServiceTab") }}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >

            {loadingPopular && (
              <AppText size="small" color="textMuted" style={{ paddingLeft: 20 }}>
                Loading popular services...
              </AppText>
            )}

            {!loadingPopular && popularServices.length === 0 && (
              <AppText size="small" color="textMuted" style={{ paddingLeft: 20 }}>
                No popular services yet
              </AppText>
            )}




            {popularServices.map((service, index) => (
              <PopularServiceCard
                key={index}
                service={service}
                index={index} />
            ))}

          </ScrollView>
        </Animated.View>

        <View style={{ height: 24 }} />

        {/* ----------------------- SERVICE CATEGORIES ---------------------- */}
        <SectionHeader
          title="Service Categories"
          onPressViewAll={() => { navigation.navigate("ServiceTab") }}
        />

        <View style={styles.categoryGrid}>
          {loadingCategories ? (
            <AppText size="small" color="textMuted" style={{ paddingLeft: 20 }}>
              Loading services...
            </AppText>
          ) : (
            serviceCategories.map((cat, index) => (
              <ServiceCategoryCard key={cat.id} category={cat} index={index} />
            ))
          )}
        </View>


      </ScrollView>
    </View>
  );
};

export default HomeScreen;

/* -------------------------------------------------------------------------- */
/*                          SMALL REUSABLE COMPONENTS                         */
/* -------------------------------------------------------------------------- */

const SectionHeader: React.FC<{
  title: string;
  onPressViewAll?: () => void;
}> = ({ title, onPressViewAll }) => {
  const { theme } = useTheme();
  return (
    <View style={sectionHeaderStyles.container}>
      <AppText weight="bold" size="h3" style={{ color: theme.colors.text }}>
        {title}
      </AppText>
      {onPressViewAll && (
        <TouchableOpacity
          onPress={onPressViewAll}
          activeOpacity={0.7}
          style={sectionHeaderStyles.viewAllBtn}
        >
          <AppText
            size="small"
            weight="bold"
            style={{ color: theme.colors.primary }}
          >
            See All
          </AppText>
          <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const ServiceCategoryCard: React.FC<{ category: ServiceCategory; index: number }> = ({
  category,
  index
}) => {
  const { theme } = useTheme();
  const s = categoryCardStyles(theme);
  const IconSvg = category.icon;
  const navigation = useNavigation<Nav>();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50 + 200).springify()} style={{ width: '48%' }}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('ServiceTab' as any, { serviceId: category.id, categoryName: category.label })}>
        <View style={s.card}>
          <View style={s.iconCircle}>
            {/* Render either an Image (for URL strings) or an SVG React component */}
            {typeof IconSvg === 'string' ? (
              <Image
                source={{ uri: IconSvg }}
                style={{ width: 90, height: 90 }}
                resizeMode="contain"
              />
            ) : IconSvg ? (
              <IconSvg width={90} height={90} fill={theme.colors.primary} />
            ) : null}
          </View>
          <AppText weight="semibold" style={s.label}>
            {category.label}
          </AppText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PopularServiceCard: React.FC<{ service: any; index: number }> = ({
  service,
  index
}) => {
  const { theme } = useTheme();
  const s = popularServiceStyles(theme);
  const navigation = useNavigation<Nav>();

  const handlePress = () => {
    // Log the service object to understand its structure
   
    
    // Try to navigate with the available ID
    // First try with _id, then with other possible IDs
    const serviceId = service._id || service.serviceId || service.domainServiceId;
    
    // navigation.navigate("ServiceTab" as any, { 
    //   screen: "Booking", 
    //   params: { 
    //     serviceCategoryId: serviceId,
    //     serviceData: service // Pass the full service data as fallback
    //   } 
    // });
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
      <TouchableOpacity activeOpacity={0.95} onPress={handlePress}>
        <View style={s.card}>
          <View style={s.imagePlaceholder}>
            {/* Display image from backend if available */}
            {service.servicecategroyImage || service.serviceImage ? (
              <Image
                source={{ uri: service.servicecategroyImage || service.serviceImage }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[theme.colors.surface, theme.colors.border]}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              >
                <FanInstall width='60%' height='60%' fill={theme.colors.textMuted} style={{ opacity: 0.5 }} />
              </LinearGradient>
            )}
            <View style={s.badge}>
              <AppText size="caption" weight="bold" style={{ color: '#fff' }}>BESTSELLER</AppText>
            </View>
          </View>
          <View style={s.textContainer}>
            <AppText weight="bold" numberOfLines={1} size="body">
              {service.serviceCategoryName || service.name || service._id}
            </AppText>
            <AppText
              size="caption"
              color="textMuted"
              numberOfLines={1}
              style={{ marginTop: 4 }}
            >
              {service.totalBookings ? `${service.totalBookings} bookings • ₹${service.totalRevenue}` : 'Popular service'}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RecentServiceCard: React.FC<{ service: RecentService; index: number }> = ({ service, index }) => {
  const { theme } = useTheme();
  const s = recentCardStyles(theme);
  const IconSvg = service.icon;

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
      <TouchableOpacity activeOpacity={0.8} style={{ marginRight: 16 }}>
        <View style={s.card}>
          <View style={s.iconContainer}>
            {/* <IconSvg width={48} height={48} fill="#fff" /> */}
            <View style={[s.iconContainer, {
              backgroundColor: 'linear-gradient(45deg, #6a11cb, #2575fc)',
              borderRadius: 24,
              justifyContent: 'center',
              alignItems: 'center'
            }]}>
              <AppText weight="bold" style={{ color: '#fff', fontSize: 40 }}>
                {service.name.charAt(0)}
              </AppText>
            </View>

          </View>
          <AppText weight="medium" style={s.serviceName} numberOfLines={2}>
            {service.name}
          </AppText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: {
      flex: 1,
    },
    scroll: {
      paddingBottom: 40,
    },
    headerContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 12,
      alignItems: 'center',
    },
    headerTitle: {
      color: theme.colors.primary,
      fontSize: 34,
      textAlign: 'center',
    },
    heroGradient: {
      marginHorizontal: 20,
      borderRadius: 24,
      padding: 24,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    heroContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    exploreButton: {
      backgroundColor: '#fff',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      alignSelf: 'flex-start',
      elevation: 2,
    },
    heroIllustration: {
      width: 100,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    glassCircle: {
      position: 'absolute',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 999,
    },
    horizontalList: {
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      rowGap: 16,
    },
  });

const sectionHeaderStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 91, 91, 0.08)', // Using primary with opacity
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  }
});

const categoryCardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: '100%',
      paddingVertical: 20,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.cardShadow,  //0.1 opacity
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1, // theme handles the opacity in string
      shadowRadius: 12,
      elevation: 4,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'transparent',
    },
    iconCircle: {
      width: 110,
      height: 110,
      borderRadius: 35,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    label: {
      fontSize: 15,
      textAlign: 'center',
      color: theme.colors.text,
    },
  });

const popularServiceStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: 240,
      borderRadius: 20,
      marginRight: 16,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'transparent',
      overflow: 'hidden',
    },
    imagePlaceholder: {
      height: 120,
      width: '100%',
      backgroundColor: theme.colors.border,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    textContainer: {
      padding: 16,
    },
  });

const recentCardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      alignItems: "center",
      justifyContent: "center",
    },
    iconContainer: {
      width: 90,
      height: 90,
      borderRadius: 30,
      backgroundColor: theme.colors.primary, // Using primary for recent to make them pop
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    serviceName: {
      fontSize: 13,
      textAlign: "center",
      width: 90,
      color: theme.colors.text
    },
  });

