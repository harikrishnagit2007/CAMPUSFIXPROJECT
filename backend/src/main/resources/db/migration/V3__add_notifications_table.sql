-- ===================================================================
-- Flyway Database Migration V3: Notifications & Audit Integrity
-- ===================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    target_role VARCHAR(30) NULL,
    complaint_id VARCHAR(40) NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'info',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_role (target_role),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_complaint (complaint_id)
);

-- Seed initial system notifications for demo and verification
INSERT INTO notifications (target_role, complaint_id, type, title, message, is_read)
VALUES
    ('ADMIN', 'CMP-LOC-CSE-204-1', 'warning', 'Critical SLA Approaching', 'Ticket CMP-LOC-CSE-204-1 in Lab 304 requires immediate review.', FALSE),
    ('STAFF', 'CMP-LOC-LIB-201-1', 'info', 'Work Order Assigned', 'You have been assigned to inspection ticket in Central Library.', FALSE),
    ('STUDENT', NULL, 'success', 'Welcome to CampusFix', 'CampusFix and CampusFind AI is active. Report issues or lost items anytime.', TRUE)
ON DUPLICATE KEY UPDATE title = VALUES(title);
