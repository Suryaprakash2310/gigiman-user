import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/useTheme';
import AppText from '@/src/components/ui/AppText';

interface AlertConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface AlertContextProps {
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

const { width } = Dimensions.get('window');

// Keep reference to native alert
const originalAlert = Alert.alert;

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((newConfig: AlertConfig) => {
    setConfig(newConfig);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    if (config?.onCancel) {
      config.onCancel();
    }
  }, [config]);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    if (config?.onConfirm) {
      config.onConfirm();
    }
  }, [config]);

  // Intercept standard React Native Alert.alert calls
  useEffect(() => {
    Alert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
      let cancelText: string | undefined = undefined;
      let confirmText: string = 'OK';
      let onCancel: (() => void) | undefined = undefined;
      let onConfirm: (() => void) | undefined = undefined;
      let type: 'info' | 'success' | 'warning' | 'error' = 'info';

      // Infer dialog type from title text
      const lowerTitle = (title || '').toLowerCase();
      if (lowerTitle.includes('error') || lowerTitle.includes('fail') || lowerTitle.includes('cannot') || lowerTitle.includes('invalid')) {
        type = 'error';
      } else if (lowerTitle.includes('success') || lowerTitle.includes('done') || lowerTitle.includes('verify') || lowerTitle.includes('confirm')) {
        type = 'success';
      } else if (lowerTitle.includes('warn') || lowerTitle.includes('wait') || lowerTitle.includes('attention')) {
        type = 'warning';
      }

      if (buttons && buttons.length > 0) {
        if (buttons.length === 1) {
          confirmText = buttons[0].text || 'OK';
          onConfirm = buttons[0].onPress;
        } else {
          // Find cancel button (style 'cancel')
          const cancelIdx = buttons.findIndex(b => b.style === 'cancel');
          if (cancelIdx !== -1) {
            cancelText = buttons[cancelIdx].text;
            onCancel = buttons[cancelIdx].onPress;
            
            const confirmIdx = cancelIdx === 0 ? 1 : 0;
            confirmText = buttons[confirmIdx].text || 'OK';
            onConfirm = buttons[confirmIdx].onPress;
          } else {
            // Default first button is cancel, second is confirm
            cancelText = buttons[0].text;
            onCancel = buttons[0].onPress;
            confirmText = buttons[1].text || 'OK';
            onConfirm = buttons[1].onPress;
          }
        }
      }

      setConfig({
        title,
        message: message || '',
        confirmText,
        cancelText,
        onConfirm,
        onCancel,
        type,
      });
      setVisible(true);
    };

    return () => {
      // Restore native alert on unmount
      Alert.alert = originalAlert;
    };
  }, [theme]);

  const getIconName = (type?: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'warning':
        return 'warning';
      case 'error':
        return 'alert-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getIconColor = (type?: string) => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return '#EA580C'; // orange
      case 'error':
        return theme.colors.danger;
      case 'info':
      default:
        return theme.colors.primary;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.backdrop}>
          <View style={[styles.container, { width: Math.min(320, width - 48), backgroundColor: theme.colors.surface }]}>
            {config?.type && (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getIconName(config.type)}
                  size={48}
                  color={getIconColor(config.type)}
                />
              </View>
            )}

            <AppText weight="bold" size="h3" style={[styles.title, { color: theme.colors.text, marginBottom: 8 }]}>
              {config?.title || 'Alert'}
            </AppText>
            
            <AppText size="body" color="textMuted" style={styles.message}>
              {config?.message || ''}
            </AppText>

            <View style={styles.actions}>
              {config?.cancelText && (
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn, { backgroundColor: theme.colors.background }]}
                  onPress={hideAlert}
                >
                  <AppText weight="bold" color="textMuted">
                    {config.cancelText}
                  </AppText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.confirmBtn,
                  {
                    backgroundColor: config?.type === 'error' ? theme.colors.danger : theme.colors.primary,
                  },
                ]}
                onPress={handleConfirm}
              >
                <AppText weight="bold" style={{ color: '#fff' }}>
                  {config?.confirmText || 'OK'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {},
  confirmBtn: {},
});
