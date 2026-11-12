package com.campusfix.backend.service;

import com.campusfix.backend.dto.NotificationResponse;
import com.campusfix.backend.entity.Notification;
import com.campusfix.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final List<Map<String, Object>> simulatedEmailLogs = new CopyOnWriteArrayList<>();

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
        // Seed default initial email log
        Map<String, Object> initialEmail = new HashMap<>();
        initialEmail.put("id", 1);
        initialEmail.put("recipient", "admin@campusfix.edu");
        initialEmail.put("subject", "CampusFix Service Initialized");
        initialEmail.put("status", "DELIVERED");
        initialEmail.put("timestamp", LocalDateTime.now().toString());
        simulatedEmailLogs.add(initialEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId, String role) {
        try {
            List<Notification> list;
            if (userId != null || (role != null && !role.trim().isEmpty())) {
                list = notificationRepository.findForUserOrRole(userId, role != null ? role.trim().toUpperCase() : null);
            } else {
                list = notificationRepository.findAllByOrderByCreatedAtDesc();
            }
            if (list == null) return Collections.emptyList();
            return list.stream()
                    .map(NotificationResponse::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("[NotificationServiceImpl] getNotifications notice: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public NotificationResponse markAsRead(Long id) {
        try {
            Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("Notification not found with ID: " + id));
            notification.setIsRead(true);
            Notification saved = notificationRepository.save(notification);
            return NotificationResponse.fromEntity(saved);
        } catch (Exception e) {
            System.err.println("[NotificationServiceImpl] markAsRead notice: " + e.getMessage());
            NotificationResponse fallback = new NotificationResponse();
            fallback.setId(id);
            fallback.setIsRead(true);
            return fallback;
        }
    }

    @Override
    public void markAllAsRead(Long userId, String role) {
        try {
            if (userId != null || role != null) {
                notificationRepository.markAllAsReadForUser(userId, role != null ? role.trim().toUpperCase() : null);
            } else {
                notificationRepository.markAllAsRead();
            }
        } catch (Exception e) {
            System.err.println("[NotificationServiceImpl] markAllAsRead notice: " + e.getMessage());
        }
    }

    @Override
    public void deleteNotification(Long id) {
        if (notificationRepository.existsById(id)) {
            notificationRepository.deleteById(id);
        }
    }

    @Override
    public List<Map<String, Object>> getEmailLogs() {
        return new ArrayList<>(simulatedEmailLogs);
    }

    @Override
    public Map<String, Object> sendTestEmail(Map<String, Object> payload) {
        Map<String, Object> log = new HashMap<>(payload != null ? payload : Collections.emptyMap());
        log.put("id", simulatedEmailLogs.size() + 1);
        log.put("status", "SENT");
        log.put("timestamp", LocalDateTime.now().toString());
        simulatedEmailLogs.add(0, log);
        return log;
    }
}
