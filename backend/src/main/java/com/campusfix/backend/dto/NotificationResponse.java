package com.campusfix.backend.dto;

import com.campusfix.backend.entity.Notification;
import java.time.LocalDateTime;

public class NotificationResponse {
    private Long id;
    private Long userId;
    private String role;
    private String complaint_id;
    private String type;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime timestamp;

    public NotificationResponse() {}

    public static NotificationResponse fromEntity(Notification entity) {
        if (entity == null) return null;
        NotificationResponse dto = new NotificationResponse();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setRole(entity.getTargetRole());
        dto.setComplaint_id(entity.getComplaintId());
        dto.setType(entity.getType());
        dto.setTitle(entity.getTitle());
        dto.setMessage(entity.getMessage());
        dto.setRead(Boolean.TRUE.equals(entity.getIsRead()));
        dto.setTimestamp(entity.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getComplaint_id() {
        return complaint_id;
    }

    public void setComplaint_id(String complaint_id) {
        this.complaint_id = complaint_id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
