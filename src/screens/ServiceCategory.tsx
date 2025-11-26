import React, { useEffect } from 'react';
import {
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AppText from '../components/ui/AppText';
import ServiceCategoryCard from '../components/ui/ServiceCategoryCard';
import { useTheme } from '../theme/useTheme';

interface Service {
  id: string;
  image?: ImageSourcePropType;
  icon?: string;
  title: string;
  subtitle: string;
  amount: string | number;
  points?: string[];
}

// Example services data — replace with actual API data
const servicesData: Service[] = [
  {
    id: '1',
    title: 'Fan Installation',
    subtitle: 'Install any type of ceiling or wall fan',
    amount: 149,
    points: ['Certified electricians', '30-day warranty'],
  },
  {
    id: '2',
    title: 'Switch Repair',
    subtitle: 'Replace or fix switch issues',
    amount: 79,
    points: ['All major brands supported'],
  },
  {
    id: '3',
    title: 'Inverter Service',
    subtitle: 'Maintenance, wiring & troubleshooting',
    amount: 199,
    points: ['24/7 emergency service', 'Expert technicians'],
  },
  {
    id: '4',
    title: 'MCB Fuse Repair',
    subtitle: 'Fuse box repair and wiring checks',
    amount: 149,
    points: ['Safety inspection included', 'Quick diagnosis'],
  },
];

export default function ServiceCategory() {
  const { theme, setMode } = useTheme();

  useEffect(() => {
    setMode && setMode('light');
  }, [setMode]);

  const handleServicePress = (serviceId: string) => {
    // TODO: Navigate to service detail or booking flow
    console.log(`Service pressed: ${serviceId}`);
  };

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.cardShadow }]}>
          {/* Hero image placeholder */}
          <Image
            source={require('../../assets/images/SampleService.png')}
            style={styles.heroImagePlaceholder}
            resizeMode="cover"
          />
          <View style={styles.heroContent}>
            <AppText weight="bold" size="h2" style={styles.heroTitle}>
              Fan Installation
            </AppText>
            <AppText color="textMuted" size="body">
              Install any type of ceiling or wall fan
            </AppText>
          </View>
        </View>

        {/* Services List */}
        <View style={styles.servicesList}>
          {servicesData.map((service) => (
            <ServiceCategoryCard
              key={service.id}
              image={service.image}
              icon={service.icon}
              title={service.title}
              subtitle={service.subtitle}
              amount={service.amount}
              onPress={() => handleServicePress(service.id)}
              points={service.points}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 40,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    // --- Corrected Shadow ---
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 7,
  },
  heroImagePlaceholder: {
    height: 160,
    width: '100%',
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroTitle: {
    marginBottom: 4,
  },
  servicesList: {
    paddingHorizontal: 16,
  },
});
