import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  useWindowDimensions,
  TouchableOpacity,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthContext } from "@/src/context/AuthContext";
import { useSocket } from "@/src/socket/SocketProvider";
import { useTheme } from "@/src/theme/useTheme";
import AppText from "@/src/components/ui/AppText";
import { NotificationAPI, NotificationItem } from "@/src/api/notification.api";
import { API_BASE_URL } from "@/src/config/env";
import { registerUserFcmToken } from "@/firebase_integration";
import messaging from "@react-native-firebase/messaging";

interface NotificationContextProps {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  addLocalNotification: (notification: NotificationItem) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const socket = useSocket();
  const { accessToken, user } = useAuthContext();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Animated Toast State
  const [toastMessage, setToastMessage] = useState<NotificationItem | null>(null);
  const toastMessageRef = useRef<NotificationItem | null>(null);
  const translateY = useRef(new Animated.Value(-150)).current;
  const timeoutRef = useRef<any>(null);

  const updateToastMessage = (msg: NotificationItem | null) => {
    setToastMessage(msg);
    toastMessageRef.current = msg;
  };

  const fetchNotifications = async (reset = false) => {
    if (!accessToken) return;
    const pageToFetch = reset ? 1 : page;

    if (reset) {
      setLoading(true);
      setPage(1);
      setHasMore(true);
    } else {
      if (!hasMore || loadingMore || loading) return;
      setLoadingMore(true);
    }

    try {
      const data = await NotificationAPI.getUserNotifications(pageToFetch, 20);
      if (data && data.success) {
        const newNotifs = data.notifications || [];
        setNotifications((prev) => {
          if (reset) {
            return newNotifs;
          } else {
            const existingIds = new Set(prev.map(n => n._id));
            const filteredNew = newNotifs.filter(n => !existingIds.has(n._id));
            return [...prev, ...filteredNew];
          }
        });
        setUnreadCount(data.unreadCount || 0);

        const totalPages = data.totalPages || 1;
        const reachedEnd = pageToFetch >= totalPages || newNotifs.length < 20;
        setHasMore(!reachedEnd);
        if (!reachedEnd) {
          setPage(pageToFetch + 1);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!accessToken) return;
    try {
      const data = await NotificationAPI.markAllAsRead();
      if (data && data.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.log("Error marking notifications as read:", error);
    }
  };

  const markAsRead = async (id: string) => {
    if (!accessToken) return;

    let wasUnread = false;
    setNotifications((prev) => {
      const target = prev.find((n) => n._id === id);
      if (target && !target.isRead) {
        wasUnread = true;
      }
      return prev.map((notif) => (notif._id === id ? { ...notif, isRead: true } : notif));
    });

    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await NotificationAPI.markSingleAsRead(id);
    } catch (error) {
      console.log("Error marking notification as read:", error);
    }
  };

  // Fetch initial notifications when token is available and user is verified
  useEffect(() => {
    // ⛔ Only fetch for fully verified users.
    // New users have a tempToken before profile completion.
    // Fetching with tempToken returns 401 → FORCE_LOGOUT → slider screen.
    if (accessToken && user?.isVerified) {
      fetchNotifications(true);
      registerUserFcmToken(accessToken, API_BASE_URL);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPage(1);
      setHasMore(true);
    }
  }, [accessToken, user]);

  // Toast animations
  const showToast = (notification: NotificationItem) => {
    // Clear any active timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    updateToastMessage(notification);
    
    // Slide Down
    Animated.spring(translateY, {
      toValue: insets.top > 0 ? insets.top + 10 : 20,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    // Auto dismiss after 4 seconds
    timeoutRef.current = setTimeout(() => {
      dismissToast();
    }, 4000);
  };

  const dismissToast = () => {
    const currentToast = toastMessageRef.current;
    if (currentToast && !currentToast.isRead) {
      markAsRead(currentToast._id);
    }
    Animated.timing(translateY, {
      toValue: -150,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      updateToastMessage(null);
    });
  };

  // Socket listener for new notifications
  useEffect(() => {
    if (!socket || !accessToken) return;

    const handleNewNotification = (notification: NotificationItem) => {
      
      // Update local state
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      // Show native/in-app alert banner
      showToast(notification);
    };

    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket, accessToken]);

  const addLocalNotification = React.useCallback((notification: NotificationItem) => {
    setNotifications((prev) => {
      if (prev.some((n) => n._id === notification._id)) {
        return prev;
      }
      return [notification, ...prev];
    });
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // FCM Push Notifications Listener in Foreground
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      console.log("Foreground FCM Push Notification Received:", remoteMessage);
      if (remoteMessage.notification) {
        const notifItem: NotificationItem = {
          _id: remoteMessage.messageId || String(Date.now()),
          userId: user?._id || null,
          title: remoteMessage.notification.title || "New Notification",
          message: remoteMessage.notification.body || "",
          isRead: false,
          type: (remoteMessage.data?.type as any) || "SYSTEM",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          data: remoteMessage.data,
        };
        addLocalNotification(notifItem);
        showToast(notifItem);
      }
    });

    return unsubscribe;
  }, [user, addLocalNotification]);

  const getIconName = (type: string) => {
    switch (type) {
      case "BOOKING":
        return "calendar-outline";
      case "PROMO":
        return "gift-outline";
      case "ALERT":
      case "FAILED_BOOKING":
        return "alert-circle-outline";
      case "BLOCK":
        return "ban-outline";
      default:
        return "information-circle-outline";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "BOOKING":
        return theme.colors.success;
      case "PROMO":
        return "#c02bff";
      case "FAILED_BOOKING":
        return theme.colors.primary;
      case "ALERT":
      case "BLOCK":
        return theme.colors.danger;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        fetchNotifications,
        markAllAsRead,
        markAsRead,
        addLocalNotification,
      }}
    >
      {children}

      {/* Floating In-App Toast Notification */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              width: width * 0.92,
              transform: [{ translateY }],
              backgroundColor: theme.colors.surface,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 8,
              borderLeftColor: getIconColor(toastMessage.type),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.toastContent}
            onPress={dismissToast}
            activeOpacity={0.9}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Ionicons
                name={getIconName(toastMessage.type)}
                size={22}
                color={getIconColor(toastMessage.type)}
              />
            </View>

            <View style={styles.textContainer}>
              <AppText weight="bold" size="body" numberOfLines={1}>
                {toastMessage.title}
              </AppText>
              <AppText size="small" color="textMuted" numberOfLines={2}>
                {toastMessage.message}
              </AppText>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={dismissToast}>
              <Ionicons name="close" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: "4%",
    right: "4%",
    zIndex: 9999,
    borderRadius: 16,
    borderLeftWidth: 5,
    padding: 14,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  closeBtn: {
    padding: 4,
  },
});
