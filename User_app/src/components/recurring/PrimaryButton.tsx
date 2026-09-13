// src/components/recurring/PrimaryButton.tsx
import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import AppText from '../ui/AppText';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme/useTheme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconName,
  style,
  textStyle,
}: PrimaryButtonProps) {
  const { theme } = useTheme();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  // Theme Constants
  const PRIMARY_COLOR = theme.colors.primary || '#f97316';
  const SECONDARY_COLOR = '#F3F4F6';
  const DANGER_COLOR = '#EF4444';

  const backgroundColor = isPrimary
    ? PRIMARY_COLOR
    : isSecondary
    ? SECONDARY_COLOR
    : isDanger
    ? DANGER_COLOR
    : 'transparent';

  const borderColor = isOutline ? PRIMARY_COLOR : 'transparent';
  const borderWidth = isOutline ? 1.5 : 0;
  
  const textColor = isOutline
    ? PRIMARY_COLOR
    : isSecondary
    ? '#1F2937'
    : '#FFFFFF';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <React.Fragment>
          {iconName && (
            <Ionicons
              name={iconName}
              size={18}
              color={textColor}
              style={styles.icon}
            />
          )}
          <AppText
            weight="bold"
            style={[
              styles.text,
              { color: textColor },
              textStyle,
            ]}
          >
            {title}
          </AppText>
        </React.Fragment>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 16, // theme requested border radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  text: {
    fontSize: 16,
    letterSpacing: -0.1,
  },
  icon: {
    marginRight: 8,
  },
});
