import { useTheme } from '@/src/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppButton from './ui/AppButton';
import AppText from './ui/AppText';

type Props = {
  visible: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isScheduled?: boolean;
};

const PRESET_REASONS = [
  "Change of plans / No longer required",
  "Technician is delayed / taking too long",
  "Incorrect price / Booking error",
  "Booked another service provider",
  "Other (please specify)",
];

export default function CancellationModal({
  visible,
  onConfirm,
  onCancel,
  isScheduled = false,
}: Props) {
  const { theme } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    if (!selectedReason) return;
    const finalReason =
      selectedReason === "Other (please specify)"
        ? customReason.trim()
        : selectedReason;

    // Reset state before callback
    setSelectedReason(null);
    setCustomReason('');
    onConfirm(finalReason);
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomReason('');
    onCancel();
  };

  const isSubmitDisabled =
    !selectedReason ||
    (selectedReason === "Other (please specify)" && !customReason.trim());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContent,
              { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl }
            ]}
          >
            <View style={styles.safeArea}>
              {/* Grab Indicator */}
              <View style={[styles.indicator, { backgroundColor: theme.colors.border }]} />

              {/* Header */}
              <View style={styles.header}>
                <AppText weight="bold" size="h2" style={{ color: theme.colors.text }}>
                  Cancel Booking
                </AppText>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
              >
                <AppText size="small" color="textMuted" style={styles.subtitle}>
                  We are sorry to see you cancel. Please let us know the reason so we can improve our service.
                </AppText>

                {/* Policy Banner (if scheduled) */}
                {isScheduled && (
                  <View style={[styles.policyBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Ionicons name="warning-outline" size={20} color="#D97706" style={styles.policyIcon} />
                    <View style={{ flex: 1 }}>
                      <AppText weight="semibold" size="small" style={{ color: '#92400E' }}>
                        Cancellation Policy
                      </AppText>
                      <AppText size="caption" style={{ color: '#B45309', marginTop: 2, lineHeight: 15 }}>
                        Scheduled bookings can only be cancelled at least 24 hours (1 day) before the service time.
                      </AppText>
                    </View>
                  </View>
                )}

                {/* Reasons List */}
                <View style={styles.optionsContainer}>
                  {PRESET_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <TouchableOpacity
                        key={reason}
                        style={[
                          styles.optionRow,
                          { borderColor: isSelected ? theme.colors.primary : theme.colors.border }
                        ]}
                        onPress={() => setSelectedReason(reason)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.radioCircle,
                          { borderColor: isSelected ? theme.colors.primary : '#94A3B8' }
                        ]}>
                          {isSelected && (
                            <View style={[styles.radioDot, { backgroundColor: theme.colors.primary }]} />
                          )}
                        </View>
                        <AppText
                          weight={isSelected ? "semibold" : "regular"}
                          style={{
                            color: isSelected ? theme.colors.text : '#475569',
                            marginLeft: 12,
                            fontSize: 14,
                            flex: 1
                          }}
                        >
                          {reason}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Input (if "Other" selected) */}
                {selectedReason === "Other (please specify)" && (
                  <View style={styles.customInputContainer}>
                    <TextInput
                      style={[
                        styles.customInput,
                        {
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                          borderRadius: theme.radius.md,
                        }
                      ]}
                      placeholder="Please type your reason for cancellation..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                      value={customReason}
                      onChangeText={setCustomReason}
                      maxLength={150}
                    />
                    <AppText size="caption" color="textMuted" style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                      {customReason.length}/150 characters
                    </AppText>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
                <AppButton
                  title="Keep Booking"
                  variant="outline"
                  onPress={handleClose}
                  style={styles.actionBtn}
                />
                <TouchableOpacity
                  disabled={isSubmitDisabled}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  style={[
                    styles.actionBtn,
                    styles.confirmBtn,
                    {
                      backgroundColor: isSubmitDisabled ? '#FDA4AF' : '#DC2626',
                      borderRadius: theme.radius.lg,
                    }
                  ]}
                >
                  <AppText weight="bold" style={{ color: '#FFFFFF', fontSize: 15 }}>
                    Cancel Booking
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    maxHeight: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  safeArea: {
    width: '100%',
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  scroll: {
    maxHeight: height * 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  subtitle: {
    marginBottom: 16,
    lineHeight: 18,
  },
  policyBanner: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  policyIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  customInputContainer: {
    marginBottom: 16,
  },
  customInput: {
    borderWidth: 1,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
