import React, { useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/useTheme";

interface Props {
  size?: number;
  onChange?: (uri: string | null) => void;
  initialUri?: string | null;
}

export default function AvatarUpload({ size = 110, onChange, initialUri = null }: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme, size);

  const [image, setImage] = useState<string | null>(initialUri);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImage(result.assets[0].uri);
      onChange?.(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage(null);
    onChange?.(null);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={pickImage}
        activeOpacity={0.8}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.avatar} />
        ) : (
          <Feather name="user" size={40} color={theme.colors.textMuted} />
        )}
      </TouchableOpacity>

      {/* Remove Image */}
      {image && (
        <TouchableOpacity style={styles.removeBtn} onPress={removeImage}>
          <Feather name="x" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Edit Button */}
      <TouchableOpacity style={styles.editBtn} onPress={pickImage}>
        <Feather name="camera" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any, size: number) =>
  StyleSheet.create({
    wrapper: { alignItems: "center", justifyContent: "center" },

    avatarContainer: {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
      elevation: 4,
      overflow: "hidden",
    },

    avatar: {
      width: "100%",
      height: "100%",
    },

    editBtn: {
      position: "absolute",
      bottom: 6,
      right: 6,
      backgroundColor: theme.colors.primary,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },

    removeBtn: {
      position: "absolute",
      top: 6,
      right: 6,
      backgroundColor: theme.colors.danger,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },
  });
