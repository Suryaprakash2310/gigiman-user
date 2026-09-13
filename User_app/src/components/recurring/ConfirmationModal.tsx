// src/components/recurring/ConfirmationModal.tsx
import React from 'react';
import { StyleSheet, View, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import PrimaryButton from './PrimaryButton';

import { useTheme } from '../../theme/useTheme';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmTitle?: string;
  cancelTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export default function ConfirmationModal({
  visible,
  title,
  description,
  confirmTitle = 'Confirm',
  cancelTitle = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false,
  iconName = 'alert-circle-outline',
}: ConfirmationModalProps) {
  const { theme } = useTheme();
  const primaryColor = theme.colors.primary || '#f97316';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.modalContainer}>
          {/* Header Icon */}
          <View style={[styles.iconBg, { backgroundColor: isDanger ? '#FEE2E2' : primaryColor + '1A' }]}>
            <Ionicons
              name={iconName}
              size={32}
              color={isDanger ? '#EF4444' : primaryColor}
            />
          </View>

          {/* Text Content */}
          <AppText weight="bold" style={styles.title}>
            {title}
          </AppText>
          <AppText style={styles.description}>
            {description}
          </AppText>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <PrimaryButton
              title={cancelTitle}
              variant="secondary"
              onPress={onCancel}
              style={styles.cancelBtn}
              textStyle={styles.cancelBtnText}
            />
            <PrimaryButton
              title={confirmTitle}
              variant={isDanger ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.confirmBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    color: '#4B5563',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
  },
});
