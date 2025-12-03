import React, { useState } from "react";
import { View, StyleSheet, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/useTheme";

//import AppHeader from "@/src/components/ui/AppHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import AvatarUpload from "@/src/components/ui/AvatorUpload";
//import AvatarUpload from "@/src/components/ui/AvatarUpload";

export default function PersonalDetailsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);

  const [name, setName] = useState("Alex Martinez");
  const [email, setEmail] = useState("alex.math@gmail.com");
  const [phone] = useState("9876543210");
  const [avatar, setAvatar] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* <AppHeader title="Personal Details" /> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <View style={styles.avatarCenter}>
          <AvatarUpload size={120} onChange={setAvatar} initialUri={avatar} />
        </View>

        {/* NAME */}
        <View style={styles.inputBlock}>
          <AppText size="small" color="textMuted">
            Full Name
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* EMAIL */}
        <View style={styles.inputBlock}>
          <AppText size="small" color="textMuted">
            Email
          </AppText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
            placeholder="Enter email"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* PHONE (READ ONLY) */}
        <View style={styles.inputBlock}>
          <AppText size="small" color="textMuted">
            Mobile Number
          </AppText>
          <TextInput
            value={phone}
            editable={false}
            style={[styles.input, { opacity: 0.6 }]}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="Save Changes" onPress={() => console.log("SAVE")} />
      </View>
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    body: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: 40,
    },
    avatarCenter: {
      alignItems: "center",
      marginBottom: 28,
    },
    inputBlock: {
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: theme.radius.md,
      fontSize: 16,
      marginTop: 6,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    footer: {
      paddingBottom: insets.bottom + 20,
      paddingHorizontal: theme.spacing.lg,
    },
  });
