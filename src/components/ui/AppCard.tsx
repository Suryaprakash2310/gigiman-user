// src/components/ui/AppCard.tsx
import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';

export default function AppCard({
  style,
  children,
  ...rest
}: ViewProps) {
  const { theme } = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.colors.surface,
          //padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          shadowColor: theme.colors.cardShadow,
          shadowOpacity: theme.shadow.card.light.shadowOpacity,
          shadowOffset: theme.shadow.card.light.shadowOffset,
          shadowRadius: theme.shadow.card.light.shadowRadius,
          elevation: theme.shadow.card.light.elevation,
          marginBottom: theme.spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
