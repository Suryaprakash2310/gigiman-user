import AppButton from "@/src/components/ui/AppButton";
import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";


export default function AddressScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const { name, email } = route.params;

  const defaultAddress = {
    label: "Home",
    addressLine: "12, Sample Street, K.K Nagar",
    city: "Trichy",
    pincode: "620021",
  };

  const handleContinue = () => {
    // later: save to backend
    navigation.reset({
      index: 0,
      routes: [{ name: "HomeTab" }],
    });
  };

  return (
    <View style={styles.container}>
      <AppText size="h2" weight="bold">Confirm Address</AppText>
      <AppText color="textMuted">You can change this later</AppText>

      <View style={styles.card}>
        <AppText weight="semibold">{defaultAddress.label}</AppText>
        <AppText style={styles.addr}>{defaultAddress.addressLine}</AppText>
        <AppText style={styles.addr}>
          {defaultAddress.city} - {defaultAddress.pincode}
        </AppText>
      </View>

      <AppButton title="Continue" onPress={handleContinue} />
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
    card: {
      marginTop: 20,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1.2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    addr: {
      marginTop: 4,
      color: theme.colors.textMuted,
    },
  });
