import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsAndConditionsPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#222" />
        </TouchableOpacity>
        <AppText weight="bold" size="h2" style={styles.headerTitle}>Terms & Conditions</AppText>
      </View>
      <ScrollView style={styles.body}>
        <AppText size="body">Professional Terms & Conditions
          •	GIGIMAN is a digital intermediary platform only.
          •	GIGIMAN does not provide any services directly.
          •	Service professionals are fully responsible for their skills, service quality, conduct, safety, and compliance with laws.
          •	The service price charged to the user is the sole responsibility of the service professional.
          •	Once a job is accepted, the professional must not cancel or fail to show up without a valid reason.
          •	Overcharging, rude behavior, fraud, fake service claims, or misuse of the platform are strictly prohibited.
          •	If a user complaint is found to be valid, warning, temporary suspension, or permanent account termination may be applied.
          •	GIGIMAN is not responsible for any loss, damage, injury, payment dispute, or service-related issue.
          •	GIGIMAN reserves the right to suspend or permanently block any professional account without prior notice if these terms are violated.
          Jurisdiction: Indian Law | Tamil Nadu
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { marginRight: 12 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20 },
  body: { flex: 1, padding: 24 },
});
