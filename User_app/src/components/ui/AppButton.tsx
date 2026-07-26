// src/components/ui/AppButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/src/theme/useTheme';

type Variant = 'primary' | 'secondary' | 'outline' | 'text';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: Props) {
  const { theme } = useTheme();
  const lastPressTime = React.useRef(0);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastPressTime.current < 600) {
      return; // Ignore rapid double-taps
    }
    lastPressTime.current = now;
    onPress();
  };

  const background =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'secondary'
      ? theme.colors.accent
      : 'transparent';

  const borderColor =
    variant === 'outline' ? theme.colors.primary : 'transparent';

  const textColor =
    variant === 'outline' || variant === 'text'
      ? theme.colors.primary
      : theme.colors.surface;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor:
            variant === 'text' ? 'transparent' : background,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: borderColor,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
          borderRadius: theme.radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            {
              color: textColor,
              fontSize: theme.typography.body,
              fontWeight: '600',
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
