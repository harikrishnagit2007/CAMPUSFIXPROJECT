-- ===================================================================
-- Flyway Database Migration V3: Notifications, Roles & Referential Integrity
-- ===================================================================

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES
    ('ROLE_STUDENT', 'Student role with complaint submission and lost/found reporting privileges'),
    ('ROLE_STAFF', 'Maintenance staff role with issue resolution and assignment capabilities'),
    ('ROLE_ADMIN', 'Administrator role with full institutional oversight and management rights')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Create User Accounts Verification Table
CREATE TABLE IF NOT EXISTS user_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_status VARCHAR(40) DEFAULT 'ACTIVE',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed user_accounts records for existing users
INSERT INTO user_accounts (user_id, account_status)
SELECT id, 'ACTIVE' FROM users
WHERE id NOT IN (SELECT user_id FROM user_accounts);

-- 3. Create Notifications Table for Real-time & Persistent Alerts
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    target_role VARCHAR(40),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    reference_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    recipient_email VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_role (target_role),
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read)
);

-- Seed Initial System Notifications
INSERT INTO notifications (target_role, title, message, type, is_read, created_at)
VALUES
    ('ALL', 'Welcome to CampusFix & CampusFind', 'Automated issue dispatch and smart lost & found matching is active.', 'SYSTEM', FALSE, CURRENT_TIMESTAMP),
    ('ADMIN', 'Pending Maintenance Reviews', '3 high-priority maintenance requests require staff assignment.', 'COMPLAINT', FALSE, CURRENT_TIMESTAMP),
    ('STAFF', 'New Work Order Assigned', 'Projector and electrical maintenance assigned in Technology Block C.', 'COMPLAINT', FALSE, CURRENT_TIMESTAMP),
    ('STUDENT', 'Item Claim Update', 'Your item claim status is being reviewed by the facility administrator.', 'CLAIM', FALSE, CURRENT_TIMESTAMP);
