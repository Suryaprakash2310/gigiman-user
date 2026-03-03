// src/screens/profile/ProfileScreen.tsx


import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { useAuth } from '@/src/hook/useAuth';
import {
  PROFILE_MENU,
  SUPPORT_MENU,
  LOGOUT_MENU,
} from '../configs/profileMenu';
import ProfileMenuItem from '../components/ProfileMenuItem';
import AvatarUpload from '../components/ui/AvatorUpload';
import ConfirmDialog from '../components/ui/ConfirmDialog';



export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { theme } = useTheme();
  const { logout, user } = useAuth();
  const styles = createStyles(theme, insets);

  const handlePress = (screen: string) => {
    if (!screen) return;
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* USER INFO CARD */}
        <View style={styles.profileCardShadow}>
          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <AvatarUpload size={100} />
            </View>
            <AppText weight="bold" size="h1" style={styles.userName}>
              {user?.fullName || "User"}
            </AppText>
            {/*
            <AppText color="textMuted" size="body" style={{ marginTop: 4 }}>
              {user?.email}
            </AppText>
            */}
          </View>
        </View>

        {/* MAIN MENU */}
        <View style={styles.menuSection}>
          <AppText weight="bold" size="h3" style={styles.menuSectionTitle}>
            Account
          </AppText>
          <View style={styles.menuBlock}>
            {PROFILE_MENU.map((item) => (
              <ProfileMenuItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                onPress={() => handlePress(item.screen)}
              />
            ))}
          </View>
        </View>

        {/* SUPPORT MENU */}
        <View style={styles.menuSection}>
          <AppText weight="bold" size="h3" style={styles.menuSectionTitle}>
            Support
          </AppText>
          <View style={styles.menuBlock}>
            {SUPPORT_MENU.map((item) => (
              <ProfileMenuItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                onPress={() => handlePress(item.screen)}
              />
            ))}
          </View>
        </View>

        {/* LOGOUT */}
        <View style={styles.menuSection}>
          <View style={styles.menuBlock}>
            {LOGOUT_MENU.map((item) => (
              <ProfileMenuItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                isDestructive
                showChevron={false}
                onPress={() => setShowLogoutDialog(true)}
              />
            ))}
          </View>
        </View>
        <ConfirmDialog
          visible={showLogoutDialog}
          title="Logout"
          message="Are you sure you want to logout?"
          confirmText="Logout"
          cancelText="Cancel"
          onCancel={() => setShowLogoutDialog(false)}
          onConfirm={async () => {
            setShowLogoutDialog(false);
            await logout();
          }}
        />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom: insets.bottom,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: 32,
    },
    profileCardShadow: {
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
      borderRadius: 32,
      marginBottom: 32,
      backgroundColor: 'transparent',
    },
    profileCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 32,
      paddingVertical: 32,
      paddingHorizontal: 16,
      position: 'relative',
      overflow: 'hidden',
    },
    avatarRow: {
      marginBottom: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userName: {
      marginTop: 8,
      color: theme.colors.text,
      textAlign: 'center',
      fontSize: 22,
      letterSpacing: 0.2,
    },
    menuSection: {
      marginBottom: 18,
    },
    menuSectionTitle: {
      marginBottom: 8,
      color: theme.colors.text,
      opacity: 0.7,
      fontSize: 16,
      letterSpacing: 0.5,
    },
    menuBlock: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: 8,
      marginBottom: 8,
      elevation: 2,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
  });
