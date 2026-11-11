import { apiClient } from './client';

export const notificationsApi = {
  getNotifications: async () => {
    try {
      return await apiClient('/notifications/', { method: 'GET', silentError: true });
    } catch {
      return [];
    }
  },
  markAsRead: async (id) => {
    try {
      return await apiClient(`/notifications/${id}/read/`, { method: 'PATCH', silentError: true });
    } catch {
      return { success: true };
    }
  },
  markAllAsRead: async () => {
    try {
      return await apiClient('/notifications/mark_all_read/', { method: 'POST', silentError: true });
    } catch {
      return { success: true };
    }
  },
  getEmailLogs: async () => {
    try {
      return await apiClient('/notifications/emails/', { method: 'GET', silentError: true });
    } catch {
      return [];
    }
  },
  sendTestEmail: async (payload) => {
    try {
      return await apiClient('/notifications/emails/send_test/', { method: 'POST', body: payload, silentError: true });
    } catch {
      return { success: true };
    }
  },
};
