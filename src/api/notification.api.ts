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
  description?: string;
  bookingId?: string | null;
  serviceName?: string;
  serviceDetails?: string;
  metadata?: any;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  totalPages?: number;
  currentPage?: number;
  totalCount?: number;
}

export const NotificationAPI = {
  async getUserNotifications(page?: number, limit?: number): Promise<NotificationsResponse> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;
    
    const res = await api.get("/notifications/user", { params });
    return res.data;
  },

  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    const res = await api.put("/notifications/user/read");
    return res.data;
  },

  async markSingleAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.put(`/notifications/${notificationId}/read`);
    return res.data;
  },
};
