
import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import type { AppTheme } from '@/src/theme';


interface AppTextProps extends TextProps {
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  size?: keyof AppTheme['typography'];
  color?: keyof AppTheme['colors'];

  children: React.ReactNode;
}

export default function AppText({
  weight = 'regular',
  size = 'body',
  color = 'text',
  style,
  children,
  ...rest
}: AppTextProps) {
  const { theme } = useTheme();

  return (
    <Text
      {...rest}
      style={[
        {
          color: theme.colors[color],
          fontSize: theme.typography[size],
          fontWeight:
            weight === 'light'
              ? '300'
              : weight === 'regular'
              ? '400'
              : weight === 'medium'
              ? '500'
              : weight === 'semibold'
              ? '600'
              : '700',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
