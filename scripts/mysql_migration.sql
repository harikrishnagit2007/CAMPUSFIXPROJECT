-- Automated Database Migration Script for MySQL (v1.1.0)
-- This script ensures the presence of core tables and enforces relational integrity.

-- Disable foreign key checks to allow schema modifications
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- 1. Roles Table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(50) NOT NULL UNIQUE,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure default roles exist
INSERT IGNORE INTO `roles` (`role_name`, `description`) VALUES 
('STUDENT', 'Campus Student/Faculty reporting maintenance issues'),
('STAFF', 'Maintenance personnel resolving assigned tickets'),
('ADMIN', 'System administrator managing campus operations');

-- ---------------------------------------------------------
-- 2. User Accounts Table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_accounts` (
    `uid` VARCHAR(128) NOT NULL PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `role_id` INT NOT NULL,
    `department` VARCHAR(255),
    `phone` VARCHAR(20),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_login` TIMESTAMP NULL,
    INDEX `idx_user_role` (`role_id`),
    INDEX `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 3. Complaints Table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaints` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `formatted_id` VARCHAR(20) UNIQUE,
    `student_uid` VARCHAR(128) NOT NULL,
    `complaint_title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `location_id` VARCHAR(50),
    `priority` ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Low',
    `status` ENUM('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Submitted',
    `assigned_staff_id` VARCHAR(128) NULL,
    `image_url` TEXT,
    `is_emergency` BOOLEAN DEFAULT FALSE,
    `is_escalated` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_status` (`status`),
    INDEX `idx_student` (`student_uid`),
    INDEX `idx_staff` (`assigned_staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 4. Foreign Key Constraint Injection
-- ---------------------------------------------------------

-- FK: user_accounts -> roles
SET @exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'user_accounts' AND CONSTRAINT_NAME = 'fk_user_role' AND TABLE_SCHEMA = DATABASE());
SET @sql = IF(@exists = 0, 'ALTER TABLE user_accounts ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT', 'SELECT "fk_user_role verified"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK: complaints -> student (user_accounts)
SET @exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'complaints' AND CONSTRAINT_NAME = 'fk_complaint_student' AND TABLE_SCHEMA = DATABASE());
SET @sql = IF(@exists = 0, 'ALTER TABLE complaints ADD CONSTRAINT fk_complaint_student FOREIGN KEY (student_uid) REFERENCES user_accounts(uid) ON DELETE CASCADE', 'SELECT "fk_complaint_student verified"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK: complaints -> staff (user_accounts)
SET @exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'complaints' AND CONSTRAINT_NAME = 'fk_complaint_staff' AND TABLE_SCHEMA = DATABASE());
SET @sql = IF(@exists = 0, 'ALTER TABLE complaints ADD CONSTRAINT fk_complaint_staff FOREIGN KEY (assigned_staff_id) REFERENCES user_accounts(uid) ON DELETE SET NULL', 'SELECT "fk_complaint_staff verified"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
