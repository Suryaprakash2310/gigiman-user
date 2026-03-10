import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';

export type AddressType = 'home' | 'work' | 'other';

export interface Address {
  id: string;
  label: AddressType;
  title: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

interface Props {
  address: Address;
  onPressEdit: () => void;
  onPressDelete: () => void;
  onPressSetDefault?: () => void;
  onPress?: () => void;
  showDefaultBadge?: boolean;
}

const typeMeta: Record<AddressType, { text: string; icon: keyof typeof Feather.glyphMap }> = {
  home: { text: 'Home', icon: 'home' },
  work: { text: 'Work', icon: 'briefcase' },
  other: { text: 'Other', icon: 'map-pin' },
};

const AddressCard: React.FC<Props> = ({
  address,
  onPressEdit,
  onPressDelete,
  onPressSetDefault,
  onPress,
  showDefaultBadge = true,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const meta = typeMeta[address.label];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View style={styles.typeChip}>
          <Feather
            name={meta.icon}
            size={14}
            color={theme.colors.primary}
            style={{ marginRight: 4 }}
          />
          <AppText size="small" weight="semibold" style={{ color: theme.colors.primary }}>
            {meta.text}
          </AppText>
        </View>

        {showDefaultBadge && address.isDefault && (
          <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary + '22' }]}>
            <Feather
              name="check-circle"
              size={14}
              color={theme.colors.primary}
              style={{ marginRight: 4 }}
            />
            <AppText size="small" weight="semibold" style={{ color: theme.colors.primary }}>
              Default
            </AppText>
          </View>
        )}
      </View>

      {/* ADDRESS LINES */}
      <View style={{ marginTop: 6 }}>
        <AppText weight="semibold" size="body">
          {address.title}
        </AppText>

        <AppText size="small" color="textMuted" style={{ marginTop: 2 }}>
          {address.line1}
        </AppText>

        {address.line2 ? (
          <AppText size="small" color="textMuted">
            {address.line2}
          </AppText>
        ) : null}

        <AppText size="small" color="textMuted">
          {address.city} - {address.pincode}
        </AppText>

        {address.landmark ? (
          <AppText size="small" color="textMuted">
            Landmark: {address.landmark}
          </AppText>
        ) : null}
      </View>

      {/* ACTIONS ROW */}
      <View style={styles.actionsRow}>
        {onPressSetDefault && !address.isDefault && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onPressSetDefault();
            }}
            activeOpacity={0.8}
          >
            <AppText size="small" weight="semibold" color="primary">
              Set as default
            </AppText>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onPressEdit();
          }}
          activeOpacity={0.8}
          style={{ marginRight: 16 }}
        >
          <AppText size="small" color="primary" weight="semibold">
            Edit
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onPressDelete();
          }}
          activeOpacity={0.8}
        >
          <AppText size="small" color="danger" weight="semibold">
            Remove
          </AppText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default AddressCard;

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      elevation: 2,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    defaultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
  });