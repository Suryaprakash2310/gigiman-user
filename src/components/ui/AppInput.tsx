// src/components/ui/AppInput.tsx
import React from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@/src/theme/useTheme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export default function AppInput({
  label,
  error,
  style,
  ...rest
}: Props) {
  const { theme } = useTheme();

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      {label && (
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.body,
            marginBottom: theme.spacing.xs,
          }}
        >
          {label}
        </Text>
      )}

      <TextInput
        {...rest}
        style={[
          {
            borderWidth: 1.4,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            fontSize: theme.typography.body,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.textMuted}
      />

      {error && (
        <Text
          style={{
            marginTop: theme.spacing.xs,
            color: theme.colors.danger,
            fontSize: theme.typography.caption,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
