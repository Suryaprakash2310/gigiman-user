import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#222" />
        </TouchableOpacity>
        <AppText weight="bold" size="h2" style={styles.headerTitle}>About</AppText>
      </View>
      <View style={styles.body}>
        <AppText size="body">GIGIMAN is a home service booking app that helps users easily find trusted professionals like electricians, plumbers, AC technicians, and other home service workers.
          Instead of searching outside and wasting time, users can book services directly through the GIGIMAN app. Customers can choose the service they need and get professional help at their doorstep.
          The app is designed to make home service booking simple, fast, and reliable for everyone.
          Services available in GIGIMAN:
          •	Electrician
          •	Plumbing
          •	AC Repair & Service
          •	Carpenter
          •	Home Maintenance Services
          GIGIMAN helps users save time and get trusted home services quickly.
        </AppText>
      </View>
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
