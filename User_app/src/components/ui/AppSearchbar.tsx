import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/useTheme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function AppSearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  autoFocus = false,
  onClear,
  containerStyle,
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, containerStyle]}>
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

      {value?.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
    },
    input: {
      flex: 1,
      fontSize: 14,
      paddingVertical: 2,
    },
  });
