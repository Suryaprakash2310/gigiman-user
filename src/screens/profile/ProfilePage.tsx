// src/screens/profile/ProfileScreen.tsx

import { useTheme } from '@/src/theme/useTheme';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

//import AppHeader from '@/src/components/ui/AppHeader';
import AppText from '@/src/components/ui/AppText';
//import Avatar from '@/src/components/ui/AvatarUpload';


//import ProfileMenuItem from './ProfileMenuItem';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import { useAuth } from '@/src/hook/useAuth';
import ProfileMenuItem from '../../components/ProfileMenuItem';
import AvatarUpload from '../../components/ui/AvatorUpload';
import {
  LOGOUT_MENU,
  PROFILE_MENU,
  SUPPORT_MENU,
} from '../../configs/profileMenu';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const styles = createStyles(theme, insets);

  const handlePress = (screen: string) => {
    if (!screen) return;
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      {/* <AppHeader title="Profile" showBack={false} /> */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* USER INFO */}
        <View style={styles.profileSection}>
          <AvatarUpload size={90} />

          <AppText weight="bold" size="h2" style={{ marginTop: 12 }}>
            Alex Martinez
          </AppText>
          {/*
          <AppText color="textMuted" size="body" style={{ marginTop: 4 }}>
            alex.math@gmail.com
          </AppText>
        
        */}

        </View>

        {/* MAIN MENU */}
        <View style={styles.menuBlock}>
          {PROFILE_MENU.map((item: { id: React.Key | null | undefined; label: string; icon: string; screen: string; }) => (
            <ProfileMenuItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              onPress={() => handlePress(item.screen)}
            />
          ))}
        </View>

        {/* SUPPORT MENU */}
        <View style={styles.menuBlock}>
          {SUPPORT_MENU.map((item: { id: React.Key | null | undefined; label: string; icon: string; screen: string; }) => (
            <ProfileMenuItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              onPress={() => handlePress(item.screen)}
            />
          ))}
        </View>

        {/* LOGOUT */}
        <View style={styles.menuBlock}>
          {LOGOUT_MENU.map((item: { id: React.Key | null | undefined; label: string; icon: string; }) => (
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
      paddingTop: insets.top,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: 30,
    },
    menuBlock: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: 12,
      marginBottom: 20,
      elevation: 2,
    },
  });
