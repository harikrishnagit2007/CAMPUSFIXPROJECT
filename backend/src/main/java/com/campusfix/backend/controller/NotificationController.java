package com.campusfix.backend.controller;

import com.campusfix.backend.dto.NotificationResponse;
import com.campusfix.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/notifications", "/api/notifications"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
    RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS
})
@Tag(name = "Notifications", description = "Endpoints for user alerts, maintenance notifications and email logs")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Operation(summary = "List notifications", description = "Get notifications for the current user or role")
    @GetMapping({"", "/"})
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        Long userId = null;
        if (userIdHeader != null && !userIdHeader.trim().isEmpty()) {
            try {
                userId = Long.valueOf(userIdHeader.trim());
            } catch (NumberFormatException ignored) {}
        }
        return ResponseEntity.ok(notificationService.getNotifications(userId, role));
    }

    @Operation(summary = "Mark single notification as read")
    @PatchMapping({"/{id}/read", "/{id}/read/"})
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @Operation(summary = "Mark all notifications as read")
    @PostMapping({"/mark_all_read", "/mark_all_read/", "/mark-all-read"})
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        Long userId = null;
        if (userIdHeader != null && !userIdHeader.trim().isEmpty()) {
            try {
                userId = Long.valueOf(userIdHeader.trim());
            } catch (NumberFormatException ignored) {}
        }
        notificationService.markAllAsRead(userId, role);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @Operation(summary = "Delete notification")
    @DeleteMapping({"/{id}", "/{id}/"})
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get notification email logs")
    @GetMapping({"/emails", "/emails/"})
    public ResponseEntity<List<Map<String, Object>>> getEmailLogs() {
        return ResponseEntity.ok(notificationService.getEmailLogs());
    }

    @Operation(summary = "Send test notification email")
    @PostMapping({"/emails/send_test", "/emails/send_test/", "/emails/send-test"})
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestBody(required = false) Map<String, Object> payload) {
        return ResponseEntity.ok(notificationService.sendTestEmail(payload));
    }
}
