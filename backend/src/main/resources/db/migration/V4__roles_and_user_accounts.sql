-- ===================================================================
-- Flyway Database Migration V4: Roles, User Accounts & Referential Integrity
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
