import AppCard from '@/src/components/ui/AppCard';
import AppText from '@/src/components/ui/AppText';
import { useTheme } from '@/src/theme/useTheme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

// Light theme color palette (hardcoded to enforce light mode)
const lightColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  primary: '#07533B', // Using a darker, high-contrast color for accents
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
  progressBackground: '#E5E7EB',
  iconBackground: '#F3F4F6',
};

export default function BookingSearchScreen() {
  const { theme } = useTheme(); // Still used for non-color values like spacing
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleCancelBooking = () => {
    console.log('Cancel booking pressed');
    setIsModalVisible(false);
    // Add your cancel logic here
  };

  return (
    <View style={[styles.container, { backgroundColor: lightColors.background }]}>
      <View style={styles.content}>
        {/* Top Section - Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Feather name="search" size={80} color={lightColors.primary} />
          </View>

          <AppText weight="bold" size="h2" style={[styles.title, { color: lightColors.text }]}>
            Finding the best technician for you...
          </AppText>

          <AppText
            weight="regular"
            size="body"
            style={[styles.subtitle, { color: lightColors.textMuted }]}
          >
            This may take 10-30 seconds. Please stay on this page.
          </AppText>
        </View>

        {/* Middle Section - Status Card */}
        <View style={styles.cardSection}>
          {/* Info Button */}
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="info" size={20} color={lightColors.primary} />
          </TouchableOpacity>

          <AppCard style={[styles.statusCard, { backgroundColor: lightColors.surface }]}>
            {/* Content Row */}
            <View style={styles.cardContentRow}>
              {/* Left - Icon Container */}
              <View
                style={[
                  styles.serviceIconContainer,
                  { backgroundColor: lightColors.iconBackground },
                ]}
              >
                <MaterialCommunityIcons name="fan" size={32} color={lightColors.primary} />
              </View>

              {/* Center - Text Content */}
              <View style={styles.textContent}>
                <AppText weight="bold" size="body" style={{ color: lightColors.text }}>
                  Fan Installation
                </AppText>
                <AppText
                  weight="regular"
                  size="small"
                  style={[styles.addressText, { color: lightColors.textMuted }]}
                >
                  123 Gandhi Nagar
                </AppText>
                <AppText
                  weight="regular"
                  size="small"
                  style={[styles.timeText, { color: lightColors.textMuted }]}
                >
                  Today, 4:30-5:00 PM
                </AppText>
              </View>

              {/* Right - Price */}
              <View style={styles.priceContainer}>
                <AppText weight="bold" size="h3" style={{ color: lightColors.primary }}>
                  ₹149
                </AppText>
              </View>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressSection}>
              <View
                style={[
                  styles.progressBackground,
                  { backgroundColor: lightColors.progressBackground },
                ]}
              >
                <View style={[styles.progressBar, { backgroundColor: lightColors.primary }]} />
              </View>
            </View>
          </AppCard>
        </View>
      </View>

      {/* Modal for Cancel Booking */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={[styles.modalCard, { backgroundColor: lightColors.surface }]}>
              <AppText weight="bold" size="h3" style={[styles.modalTitle, { color: lightColors.text }]}>
                Cancel Booking?
              </AppText>
              <AppText
                weight="regular"
                size="body"
                style={[styles.modalMessage, { color: lightColors.textMuted }]}
              >
                Are you sure you want to cancel this booking?
              </AppText>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.keepButton, { borderColor: lightColors.border }]}
                  onPress={() => setIsModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <AppText weight="semibold" size="body" style={{ color: lightColors.text }}>
                    Keep Booking
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelConfirmButton, { backgroundColor: lightColors.danger }]}
                  onPress={handleCancelBooking}
                  activeOpacity={0.7}
                >
                  <AppText weight="semibold" size="body" style={{ color: '#FFFFFF' }}>
                    Cancel Booking
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 20,
  },
  cardSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    top: -44,
    right: 24,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statusCard: {
    marginBottom: 0,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContent: {
    flex: 1,
  },
  addressText: {
    marginTop: 4,
  },
  timeText: {
    marginTop: 2,
  },
  priceContainer: {
    marginLeft: 8,
  },
  progressSection: {
    marginTop: 4,
  },
  progressBackground: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '30%',
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
  },
  modalCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepButton: {
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  cancelConfirmButton: {
    // backgroundColor set dynamically
  },
});
