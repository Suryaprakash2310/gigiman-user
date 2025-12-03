import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import { useAuthContext } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme/useTheme";


import React, { useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";


export default function SetupProfileScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
//   const { user,setUser } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    if (!name.trim()) return;
//    setUser({
//     ...user!,
//     name,
//     email,
//   });

    navigation.navigate("AddressScreen", {
      name,
      email,
    });
  };

  return (
    <View style={styles.container}>
      <AppText size="h2" weight="bold">Complete Profile</AppText>
      <AppText color="textMuted" style={{ marginBottom: 20 }}>
        Just one step to continue using GigiMan
      </AppText>

      <AppText weight="semibold">Your Name</AppText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter your full name"
        style={styles.input}
        placeholderTextColor={theme.colors.textMuted}
      />

      <AppText weight="semibold" style={{ marginTop: 16 }}>Email (Optional)</AppText>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="example@gmail.com"
        style={styles.input}
        placeholderTextColor={theme.colors.textMuted}
      />

      <AppButton
        title="Continue"
        disabled={!name.trim()}
        onPress={handleContinue}
        style={{ marginTop: 30 }}
      />
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    input: {
      borderWidth: 1.2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    },
  });
