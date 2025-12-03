
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

interface Props {
  label: string;
  icon: string;
  onPress: () => void;
  showChevron?: boolean;
  isDestructive?: boolean;
}

export default function ProfileMenuItem({
  label,
  icon,
  onPress,
  showChevron = true,
  isDestructive = false,
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.surface }]}>
        <Feather name={icon as any} size={20} color={theme.colors.primary} />
      </View>

      <AppText
        size="body"
        weight="medium"
        style={{
          flex: 1,
          color: isDestructive ? theme.colors.danger : theme.colors.text,
        }}
      >
        {label}
      </AppText>

      {showChevron && (
        <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      marginBottom: 4,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
      elevation: 3,
    },
  });
