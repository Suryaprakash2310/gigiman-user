import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/useTheme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function AppSearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  autoFocus = false,
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Ionicons
        name="search"
        size={18}
        color={theme.colors.textMuted}
        style={{ marginRight: 8 }}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, { color: theme.colors.text }]}
        autoFocus={autoFocus}
      />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      elevation: 1,
      marginBottom: 16,
    },
    input: {
      flex: 1,
      fontSize: 15,
      paddingVertical: 4,
    },
  });
