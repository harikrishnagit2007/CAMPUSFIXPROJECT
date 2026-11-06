package com.campusfix.backend.service;

import com.campusfix.backend.dto.NotificationResponse;
import java.util.List;
import java.util.Map;

public interface NotificationService {

    List<NotificationResponse> getNotifications(Long userId, String role);

    NotificationResponse markAsRead(Long id);

    void markAllAsRead(Long userId, String role);

    void deleteNotification(Long id);

    List<Map<String, Object>> getEmailLogs();

    Map<String, Object> sendTestEmail(Map<String, Object> payload);
}
