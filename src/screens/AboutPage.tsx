import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

export default function AboutPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const services = [
    { name: 'Electrician', icon: 'electrical-services' },
    { name: 'Plumbing', icon: 'plumbing' },
    { name: 'AC Repair', icon: 'ac-unit' },
    { name: 'Carpenter', icon: 'carpenter' },
    { name: 'Maintenance', icon: 'build' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <AppText weight="bold" size="h3" style={{ color: theme.colors.text, flex: 1, textAlign: 'center', marginRight: 40 }}>
          About GIGIMAN
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <MaterialIcons name="home-repair-service" size={60} color={theme.colors.primary} />
          </View>
          <AppText size="h2" weight="bold" style={[styles.heroTitle, { color: theme.colors.text }]}>
            GIGIMAN
          </AppText>
          <AppText size="body" style={[styles.heroSubtitle, { color: theme.colors.textMuted }]}>
            Trusted Professionals at Your Doorstep
          </AppText>
        </View>

        {/* Content Section */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AppText size="body" style={[styles.description, { color: theme.colors.text }]}>
            GIGIMAN is a premium home service booking platform designed to simplify your life. 
            We connect you with highly skilled professionals for all your home maintenance needs.
          </AppText>
          <AppText size="body" style={[styles.description, { color: theme.colors.text }]}>
            Instead of wasting time searching for reliable help, you can book verified experts 
            directly through our app and get professional service delivered right to your home.
          </AppText>
        </View>

        {/* Services Section */}
        <AppText size="h3" weight="bold" style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Our Core Services
        </AppText>
        <View style={styles.servicesGrid}>
          {services.map((item, index) => (
            <View key={index} style={[styles.serviceItem, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.serviceIcon, { backgroundColor: theme.colors.primary + '10' }]}>
                <MaterialIcons name={item.icon as any} size={24} color={theme.colors.primary} />
              </View>
              <AppText size="small" weight="medium" style={{ color: theme.colors.text }}>
                {item.name}
              </AppText>
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.primary }]}>
          <AppText weight="bold" style={{ color: '#fff', marginBottom: 8 }}>
            Fast. Reliable. Simple.
          </AppText>
          <AppText size="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
            We save you time by vetting all our professionals so you don't have to.
          </AppText>
        </View>

        <AppText size="small" style={[styles.versionText, { color: theme.colors.textMuted }]}>
          Version 1.0.0
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: { padding: 24 },
  heroSection: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 16
  },
  heroTitle: { marginBottom: 4 },
  heroSubtitle: { textAlign: 'center' },
  card: { padding: 20, borderRadius: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  description: { lineHeight: 24, marginBottom: 12 },
  sectionTitle: { marginBottom: 16, marginLeft: 4 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  serviceItem: { 
    width: '31%', 
    padding: 12, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 12,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8 
  },
  serviceIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  infoCard: { padding: 20, borderRadius: 16, marginBottom: 32 },
  versionText: { textAlign: 'center', marginBottom: 20 },
});
