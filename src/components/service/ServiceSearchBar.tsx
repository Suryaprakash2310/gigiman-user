import React from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/useTheme';

interface ServiceSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const ServiceSearchBar: React.FC<ServiceSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search services',
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          clearButtonMode="never"
          accessible={true}
          accessibilityLabel="Search services"
          accessibilityHint="Type to filter services"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            accessible={true}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.md,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      borderWidth: 1,
      borderColor: theme.dark ? theme.colors.border : 'transparent',
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      paddingVertical: theme.spacing.xs,
    },
    clearButton: {
      padding: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
  });

export default ServiceSearchBar;
