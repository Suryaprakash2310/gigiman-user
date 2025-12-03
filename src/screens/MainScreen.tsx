// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/src/theme/useTheme';
import AppText from '@/src/components/ui/AppText';
import AppCard from '@/src/components/ui/AppCard';
import AppButton from '@/src/components/ui/AppButton';
import FanInstall from '@/assets/images/FanInstall.svg';
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { AppTabsParamList } from '../navigation/AppStack';
type Nav = BottomTabNavigationProp<AppTabsParamList, "HomeTab">;

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
  icon: any;    //React.FC<React.SVGProps<SVGSVGElement>>;
};


const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'hair', label: 'Electical', icon: FanInstall },
  { id: 'clean', label: 'Cleaning', icon: FanInstall },
  { id: 'paint', label: 'Painting', icon: FanInstall },
  { id: 'cook', label: 'Plumbing', icon: FanInstall },
];

const POPULAR_SERVICES: PopularService[] = [
  { id: 'ps1', title: 'Home Deep Cleaning', subtitle: 'Full home • 2-3 hrs', icon: FanInstall },
  { id: 'ps2', title: 'Kitchen Cleanup', subtitle: 'Oil & stain removal', icon: FanInstall },
  { id: 'ps3', title: 'AC Service', subtitle: 'Cooling issues fixed', icon: FanInstall },
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
  const styles = createStyles(theme);
  const [search, setSearch] = useState('');
  const navigation = useNavigation<Nav>();


  useEffect(() => {
    setMode?.('light');
  }, [setMode]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ------------------------------ HEADER ------------------------------ */}
        <View style={styles.headerRow}>
          <View>
            <AppText size="caption" color="textMuted">
              Your Location
            </AppText>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-sharp"
                size={14}
                color={theme.colors.primary}
                style={{ marginRight: 4 }}
              />
              <AppText weight="semibold">Trichy, Tamil Nadu</AppText>
              <Ionicons
                name="chevron-down"
                size={16}
                color={theme.colors.textMuted}
                style={{ marginLeft: 2 }}
              />
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconCircle} activeOpacity={0.8}>
              <Feather name="bell" size={18} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.avatarCircle}>
              <AppText weight="bold" style={{ color: '#fff', fontSize: 12 }}>
                G
              </AppText>
            </View>
          </View>
        </View>

        {/* -------------------------- SEARCH BAR --------------------------- */}
        <View style={styles.searchWrapper}>
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={theme.colors.textMuted}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search for a service.."
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.searchInput, { color: theme.colors.text }]}
            />
          </View>
        </View>

        {/* --------------------------- HERO CARD --------------------------- */}
        <AppCard
          style={[
            styles.heroCard,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <View style={{ flex: 1 }}>
            <AppText
              weight="bold"
              size="h2"
              style={{ color: '#fff', marginBottom: 4 }}
            >
              Your solution, one tap away!
            </AppText>
            <AppText
              size="small"
              style={{
                color: '#E2F3F4',
                marginBottom: 12,
                maxWidth: 210,
              }}
            >
              Seamless, fast & reliable services at your fingertips.
            </AppText>
            <AppButton
              title="Explore"
              variant="outline"
              onPress={() => {navigation.navigate("ServiceTab")}}
              //size="small"
              style={styles.exploreButton}
            />
          </View>

          {/* Minimal line-style illustration – simple geometric block */}
          <View style={styles.heroIllustration}>
            <View style={styles.heroBoxOuter}>
              <View style={styles.heroBoxInner} />
              <View style={styles.heroLine} />
              <View style={styles.heroDot} />
            </View>
          </View>
        </AppCard>

        {/* ----------------------- SERVICE CATEGORIES ---------------------- */}
        <SectionHeader
          title="Service Categories"
          onPressViewAll={() => {navigation.navigate("ServiceTab")}}
        />

        <View style={styles.categoryGrid}>
          {SERVICE_CATEGORIES.map((cat) => (
            <ServiceCategoryCard key={cat.id} category={cat} />
          ))}
        </View>

        {/* ------------------------ POPULAR SERVICES ----------------------- */}
        <SectionHeader
          title="Popular Services"
          onPressViewAll={() => {navigation.navigate("ServiceTab")}}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          {POPULAR_SERVICES.map((service) => (
            <PopularServiceCard key={service.id} service={service} />
          ))}
        </ScrollView>

        {/* ------------------------ RECENT BOOKINGS ------------------------ */}
        <SectionHeader
          title="Your Recent Bookings"
          onPressViewAll={() => { }}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20 }}
        >
          {RECENT_SERVICES.map(s => (
            <RecentServiceCard key={s.id} service={s} />
          ))}
        </ScrollView>


        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
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
  const navigation = useNavigation();
  return (
    <View style={sectionHeaderStyles.container}>
      <AppText weight="semibold" size="h3">
        {title}
      </AppText>
      {onPressViewAll && (
        <TouchableOpacity
          onPress={onPressViewAll}
          activeOpacity={0.7}
        >
          <AppText
            size="small"
            weight="semibold"
            style={{ color: theme.colors.primary }}
          >
            View all
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

// const ServiceCategoryCard: React.FC<{ category: ServiceCategory }> = ({
//   category,
// }) => {
//   const { theme } = useTheme();
//   const s = categoryCardStyles(theme);
//   return (
//     <AppCard style={s.card}>
//       <View style={s.iconCircle}>
//         <MaterialCommunityIcons
//           name={category.icon}
//           size={20}
//           color={theme.colors.primary}
//         />
//       </View>
//       <AppText weight="semibold" style={s.label}>
//         {category.label}
//       </AppText>
//     </AppCard>
//   );
// };
const ServiceCategoryCard: React.FC<{ category: ServiceCategory }> = ({
  category,
}) => {
  const { theme } = useTheme();
  const s = categoryCardStyles(theme);

  // Dynamic SVG Component
  const IconSvg = category.icon;

  return (
    <AppCard style={s.card}>
      <View style={s.iconCircle}>
        <IconSvg width={90} height={90} fill={theme.colors.primary} />
      </View>

      <AppText weight="semibold" style={s.label}>
        {category.label}
      </AppText>
    </AppCard>
  );
};

const PopularServiceCard: React.FC<{ service: PopularService }> = ({
  service,
}) => {
  const { theme } = useTheme();
  const s = popularServiceStyles(theme);
  const IconSvg = service.icon;

  return (
    <AppCard style={s.card}>
      <View style={s.imagePlaceholder} >
        <IconSvg width='100%' fill={theme.colors.primary} />
      </View>
      <View style={s.textContainer}>
        <AppText weight="semibold" numberOfLines={1}>
          {service.title}
        </AppText>
        <AppText
          size="small"
          color="textMuted"
          numberOfLines={1}
          style={{ marginTop: 2 }}
        >
          {service.subtitle}
        </AppText>
      </View>
    </AppCard>
  );
};

const RecentServiceCard: React.FC<{ service: RecentService }> = ({ service }) => {
  const { theme } = useTheme();
  const s = recentCardStyles(theme);

  const IconSvg = service.icon;

  return (
    <TouchableOpacity activeOpacity={0.9}>
      <View style={s.card}>
        <View style={s.iconContainer}>
          <IconSvg width={32} height={32} fill={theme.colors.primary} />
        </View>

        <AppText weight="semibold" style={s.serviceName}>
          {service.name}
        </AppText>
      </View>
    </TouchableOpacity>
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
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: 4,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      marginRight: 8,
    },
    avatarCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    searchWrapper: {
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
    },
    heroCard: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 18,
      marginBottom: 20,
      alignItems: 'center',
    },
    exploreButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,


    },
    heroIllustration: {
      width: 110,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBoxOuter: {
      width: 84,
      height: 70,
      borderRadius: 16,
      borderWidth: 1.4,
      borderColor: '#EAF5F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBoxInner: {
      width: 54,
      height: 32,
      borderRadius: 10,
      borderWidth: 1.2,
      borderColor: '#EAF5F6',
    },
    heroLine: {
      width: 54,
      height: 2,
      backgroundColor: '#EAF5F6',
      marginTop: 6,
    },
    heroDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#EAF5F6',
      marginTop: 4,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
      marginBottom: 8,
    },
  });

const sectionHeaderStyles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

// const categoryCardStyles = (theme: any) =>
//   StyleSheet.create({
//     card: {
//       width: '48%',
//       paddingVertical: 14,
//       paddingHorizontal: 12,
//       borderRadius: 16,
//       backgroundColor: theme.colors.surface,
//     },
//     iconCircle: {
//       width: 32,
//       height: 32,
//       borderRadius: 16,
//       alignItems: 'center',
//       justifyContent: 'center',
//       backgroundColor: theme.colors.background,
//       marginBottom: 8,
//     },
//     label: {},
//   });

const categoryCardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: '48%',
      paddingVertical: 16,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
      alignItems: 'center',
    },
    iconCircle: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    label: {
      fontSize: 15,
    },
  });

const popularServiceStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: 220,
      borderRadius: 16,
      marginRight: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    imagePlaceholder: {
      height: 90,
      width: '100%',
      backgroundColor: theme.colors.background,
    },
    textContainer: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
  });

const recentCardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      width: 120,
      paddingVertical: 18,
      paddingHorizontal: 10,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 4,
      marginRight: 14,
    },
    iconContainer: {
      width: 58,
      height: 58,
      borderRadius: 16,
      backgroundColor: theme.colors.surface2 || "#F4F4F4",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    serviceName: {
      fontSize: 13,
      textAlign: "center",
    },
  });

