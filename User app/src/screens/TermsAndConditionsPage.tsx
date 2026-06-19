import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

export default function TermsAndConditionsPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const sections = [
    {
      title: 'Platform Role',
      icon: 'devices',
      content: 'GIGIMAN is a digital intermediary platform only. We do not provide any services directly.'
    },
    {
      title: 'Professional Responsibility',
      icon: 'person',
      content: 'Service professionals are fully responsible for their skills, service quality, conduct, safety, and compliance with laws.'
    },
    {
      title: 'Pricing & Jobs',
      icon: 'payments',
      content: 'Service prices are set by the professional. Once a job is accepted, professionals must not cancel without valid reasons.'
    },
    {
      title: 'Prohibited Conduct',
      icon: 'gavel',
      content: 'Overcharging, rude behavior, fraud, fake claims, or platform misuse are strictly prohibited.'
    },
    {
      title: 'Account Termination',
      icon: 'block',
      content: 'GIGIMAN reserves the right to suspend or terminate accounts for violations or valid user complaints.'
    },
    {
      title: 'Liability',
      icon: 'report-problem',
      content: 'GIGIMAN is not responsible for any loss, damage, injury, payment dispute, or service-related issues.'
    }
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
          Terms & Conditions
        </AppText>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.introCard, { backgroundColor: theme.colors.primary + '10' }]}>
          <MaterialIcons name="info" size={20} color={theme.colors.primary} />
          <AppText size="small" style={[styles.introText, { color: theme.colors.text }]}>
            Please read these terms carefully. By using GIGIMAN, you agree to comply with our platform policies.
          </AppText>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                <MaterialIcons name={section.icon as any} size={20} color={theme.colors.primary} />
              </View>
              <AppText weight="bold" size="body" style={{ color: theme.colors.text }}>
                {section.title}
              </AppText>
            </View>
            <AppText size="body" style={[styles.sectionContent, { color: theme.colors.textMuted }]}>
              {section.content}
            </AppText>
          </View>
        ))}

        <View style={styles.footer}>
          <AppText size="small" weight="bold" style={{ color: theme.colors.text, marginBottom: 4 }}>
            Jurisdiction
          </AppText>
          <AppText size="small" style={{ color: theme.colors.textMuted }}>
            Indian Law | Tamil Nadu
          </AppText>
          <AppText size="caption" style={[styles.updateText, { color: theme.colors.textMuted }]}>
            Last updated: May 2026
          </AppText>
        </View>
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
  body: { flex: 1 },
  scrollContent: { padding: 20 },
  introCard: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 20,
    alignItems: 'center'
  },
  introText: { marginLeft: 12, flex: 1, lineHeight: 20 },
  sectionCard: { 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12
  },
  sectionContent: { lineHeight: 22 },
  footer: { marginTop: 20, paddingBottom: 40, alignItems: 'center' },
  updateText: { marginTop: 16 },
});
