import { apiClient } from './client';

export const notificationsApi = {
  getNotifications: () => apiClient('/notifications/', { method: 'GET' }),
  markAsRead: (id) => apiClient(`/notifications/${id}/read/`, { method: 'PATCH' }),
  markAllAsRead: () => apiClient('/notifications/mark_all_read/', { method: 'POST' }),
};
