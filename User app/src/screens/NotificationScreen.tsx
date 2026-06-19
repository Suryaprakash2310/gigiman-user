import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme/useTheme";
import { useNotifications } from "@/src/context/NotificationContext";
import { NotificationItem } from "@/src/api/notification.api";
import { useBooking } from "@/src/context/BookingContext";

export default function NotificationScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
  } = useNotifications();
  const { bookings } = useBooking();

  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    fetchNotifications(true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(true);
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchNotifications(false);
    }
  };

  // Helper function to format relative time
  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Group notifications by relative date sections (Today, Yesterday, Earlier)
  const getGroupedNotifications = () => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    notifications.forEach((item) => {
      const itemDate = new Date(item.createdAt);
      if (itemDate >= startOfToday) {
        today.push(item);
      } else if (itemDate >= startOfYesterday) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });

    const sections = [];
    if (today.length > 0) sections.push({ title: "Today", data: today });
    if (yesterday.length > 0) sections.push({ title: "Yesterday", data: yesterday });
    if (earlier.length > 0) sections.push({ title: "Earlier", data: earlier });

    return sections;
  };

  const getIconName = (type: string) => {
    switch (type) {
      case "BOOKING":
        return "calendar";
      case "PROMO":
        return "gift";
      case "ALERT":
      case "FAILED_BOOKING":
        return "alert-circle";
      case "BLOCK":
        return "ban";
      default:
        return "information-circle";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "BOOKING":
        return theme.colors.success;
      case "PROMO":
        return "#c02bff";
      case "ALERT":
      case "FAILED_BOOKING":
      case "BLOCK":
        return theme.colors.danger;
      default:
        return theme.colors.primary;
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const iconName = getIconName(item.type);
    const iconColor = getIconColor(item.type);
    const bookingRef = item.metadata?.bookingReference || item.data?.bookingReference || item.bookingId;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (!item.isRead) {
            markAsRead(item._id);
          }
          if (bookingRef) {
            const bookingObj = bookings.find(b => String(b._id) === String(bookingRef));
            if (item.type === "FAILED_BOOKING" || bookingObj?.assignmentStatus === "FAILED" || bookingObj?.status === "manual_assign" || item.title === "Technician Assigned") {
              (navigation as any).navigate("BookingTab", {
                screen: "BookingsMain",
                params: { activeTab: "manualAssignment" },
              });
            } else {
              (navigation as any).navigate("BookingTab", {
                screen: "BookingDetails",
                params: { bookingId: bookingRef },
              });
            }
          }
        }}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderLeftColor: item.isRead ? "transparent" : iconColor,
          },
          !item.isRead && styles.unreadCardBorder,
        ]}
      >
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <AppText weight="bold" size="body" style={styles.cardTitle}>
              {item.title}
            </AppText>
            <AppText size="caption" color="textMuted" style={styles.cardTime}>
              {formatNotificationTime(item.createdAt)}
            </AppText>
          </View>

          <AppText size="small" color="text" style={styles.cardMsg}>
            {item.message}
          </AppText>

          {item.description && item.description !== item.message && (
            <AppText size="small" color="textMuted" style={styles.cardDesc}>
              {item.description}
            </AppText>
          )}

          {(item.serviceName || item.serviceDetails || bookingRef) && (
            <View style={[styles.bookingDetailsContainer, { backgroundColor: theme.colors.background }]}>
              {bookingRef && (
                <AppText size="small" weight="semibold" style={{ color: theme.colors.primary, marginBottom: 2 }}>
                  Booking Ref: #{String(bookingRef).slice(-8).toUpperCase()}
                </AppText>
              )}
              {item.serviceName && (
                <AppText size="small" weight="bold" style={{ marginBottom: 2 }}>
                  Service: {item.serviceName}
                </AppText>
              )}
              {item.serviceDetails && (
                <AppText size="small" color="textMuted">
                  Details: {item.serviceDetails}
                </AppText>
              )}
            </View>
          )}
        </View>

        {!item.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: iconColor }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const groupedData = getGroupedNotifications();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <AppText weight="bold" size="h2" style={styles.headerTitle}>
          Notifications
        </AppText>

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <AppText size="small" weight="semibold" style={{ color: theme.colors.primary }}>
              Mark read
            </AppText>
          </TouchableOpacity>
        ) : (
          <View style={styles.markReadButtonPlaceholder} />
        )}
      </View>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText color="textMuted" style={{ marginTop: 12 }}>
            Loading your notifications...
          </AppText>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="notifications-off-outline" size={54} color={theme.colors.textMuted} />
          </View>
          <AppText weight="bold" size="h3" style={{ marginTop: 18 }}>
            All caught up!
          </AppText>
          <AppText color="textMuted" style={styles.emptySubtitle}>
            No new notifications. We will keep you updated when a booking status changes.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.title}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          renderItem={({ item }) => (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <AppText weight="bold" size="small" color="textMuted">
                  {item.title.toUpperCase()}
                </AppText>
              </View>
              {item.data.map((notif) => (
                <View key={notif._id}>
                  {renderNotificationItem({ item: notif })}
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginLeft: 8,
  },
  markReadButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markReadButtonPlaceholder: {
    width: 60,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptySubtitle: {
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  listContainer: {
    paddingBottom: 30,
  },
  sectionContainer: {
    marginTop: 14,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1.5,
    borderLeftWidth: 4,
  },
  unreadCardBorder: {
    // Left border will be colored
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    paddingRight: 6,
  },
  cardTime: {
    fontSize: 11,
  },
  cardMsg: {
    lineHeight: 18,
  },
  cardDesc: {
    marginTop: 4,
    lineHeight: 18,
  },
  bookingDetailsContainer: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 18,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
