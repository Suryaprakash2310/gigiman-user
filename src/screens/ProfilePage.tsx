// src/screens/profile/ProfileScreen.tsx

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/useTheme';

//import AppHeader from '@/src/components/ui/AppHeader';
import AppText from '@/src/components/ui/AppText';
//import Avatar from '@/src/components/ui/AvatarUpload';


//import ProfileMenuItem from './ProfileMenuItem';
import {
  PROFILE_MENU,
  SUPPORT_MENU,
  LOGOUT_MENU,
} from '../configs/profileMenu';
import ProfileMenuItem from '../components/ProfileMenuItem';
import AvatarUpload from '../components/ui/AvatorUpload';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

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

          <AppText color="textMuted" size="body" style={{ marginTop: 4 }}>
            alex.math@gmail.com
          </AppText>
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
              onPress={() => console.log('LOGOUT')}
            />
          ))}
        </View>
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
