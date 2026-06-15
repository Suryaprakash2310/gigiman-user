import api from "./client";

export interface NotificationItem {
  _id: string;
  userId: string | null;
  empId?: string | null;
  empModel?: string | null;
  adminId?: string | null;
  title: string;
  message: string;
  isRead: boolean;
  type: 'BOOKING' | 'SYSTEM' | 'ALERT' | 'PROMO' | 'FAILED_BOOKING' | 'BLOCK';
  targetRole?: string | null;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
}

export const NotificationAPI = {
  async getUserNotifications(): Promise<NotificationsResponse> {
    const res = await api.get("/notifications/user");
    return res.data;
  },

  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    const res = await api.put("/notifications/user/read");
    return res.data;
  },
};
