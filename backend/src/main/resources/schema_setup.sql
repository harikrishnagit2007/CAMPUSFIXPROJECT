-- ===================================================================
-- CampusFix & CampusFind AI - Complete MySQL Database Schema Creation Script
-- Database: campus_management_db
-- Engine: InnoDB | Charset: utf8mb4
-- ===================================================================

CREATE DATABASE IF NOT EXISTS campus_management_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE campus_management_db;

-- Drop existing tables in reverse dependency order for clean re-creation
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS item_claims;
DROP TABLE IF EXISTS lost_found_items;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS campus_locations;
DROP TABLE IF EXISTS user_accounts;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

-- ===================================================================
-- 1. USERS TABLE
-- Stores user profile data linked with Firebase Authentication (firebase_uid)
-- ===================================================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE COMMENT 'Firebase Authentication unique user ID',
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) COMMENT 'BCrypt hashed password for local authentication',
    role VARCHAR(30) NOT NULL DEFAULT 'STUDENT' COMMENT 'STUDENT, STAFF, or ADMIN',
    department VARCHAR(100) COMMENT 'Academic department or operational division',
    phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_firebase_uid (firebase_uid),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================================
-- 2. ROLES TABLE
-- Role definition reference table
-- ===================================================================
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (name, description) VALUES
    ('ROLE_STUDENT', 'Student role with complaint submission and lost/found reporting privileges'),
    ('ROLE_STAFF', 'Maintenance staff role with issue resolution and assignment capabilities'),
    ('ROLE_ADMIN', 'Administrator role with full institutional oversight and management rights');

-- ===================================================================
-- 3. USER ACCOUNTS TABLE
-- Supplemental account metadata and login audits
-- ===================================================================
CREATE TABLE user_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_status VARCHAR(40) DEFAULT 'ACTIVE',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_accounts_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================================
-- 4. CAMPUS LOCATIONS TABLE
-- Campus buildings, rooms, wings, and QR code badges
-- ===================================================================
CREATE TABLE campus_locations (
    id VARCHAR(50) PRIMARY KEY COMMENT 'e.g. LOC-CSE-204',
    building VARCHAR(100) NOT NULL,
    room VARCHAR(60) NOT NULL,
    floor VARCHAR(30),
    wing VARCHAR(60),
    qr_code VARCHAR(120) UNIQUE,
    active_complaints INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_locations_building (building)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================================
-- 5. STAFF TABLE
-- Maintenance technicians and facilities personnel
-- ===================================================================
CREATE TABLE staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(30),
    department VARCHAR(100) NOT NULL,
    specialization VARCHAR(140),
    availability VARCHAR(30) NOT NULL DEFAULT 'Available' COMMENT 'Available, Busy, On Leave',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_department (department),
    INDEX idx_staff_availability (availability)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================================
-- 6. COMPLAINTS TABLE
-- Maintenance issue tickets reported across campus
-- ===================================================================
CREATE TABLE complaints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(40) NOT NULL UNIQUE COMMENT 'Business code e.g. CMP-8421',
    complaint_title VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL COMMENT 'Electrical, Plumbing, Wi-Fi, Furniture, etc.',
    building VARCHAR(100) NOT NULL,
    room VARCHAR(60),
    location VARCHAR(220) NOT NULL,
    description TEXT,
    priority VARCHAR(30) NOT NULL DEFAULT 'Medium' COMMENT 'Critical, High, Medium, Low',
    status VARCHAR(40) NOT NULL DEFAULT 'Submitted' COMMENT 'Submitted, Under Review, Assigned, In Progress, Resolved, Rejected',
    image LONGTEXT COMMENT 'Base64 encoded image or image URL',
    student_name VARCHAR(120),
    student_email VARCHAR(120),
    student_phone VARCHAR(30),
    assigned_staff_id VARCHAR(60) COMMENT 'Assigned technician identifier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_complaints_status (status),
    INDEX idx_complaints_category (category),
    INDEX idx_complaints_building (building),
    INDEX idx_complaints_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================================
-- 7. LOST & FOUND ITEMS TABLE
-- Unified table for both Lost items and Found items reported on campus
-- ===================================================================
CREATE TABLE lost_found_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(40) NOT NULL UNIQUE COMMENT 'Business code e.g. ITM-1029',
    type VARCHAR(20) NOT NULL COMMENT 'LOST or FOUND',
    item_name VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL COMMENT 'Electronics, ID Card, Books, Accessories, etc.',
    building VARCHAR(100) NOT NULL,
    location VARCHAR(220) NOT NULL,
    date_occurred DATE NOT NULL,
    approx_time VARCHAR(40),
    description TEXT,
    identifying_marks TEXT,
    holding_location VARCHAR(200) COMMENT 'Where found item is stored e.g. Security Office Main Block',
    image LONGTEXT COMMENT 'Item photo',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN, CLAIM_PENDING, RETURNED, CLOSED',
    reporter_id VARCHAR(60),
    reporter_name VARCHAR(120),
    reporter_role VARCHAR(30) DEFAULT 'STUDENT',
    contact_email VARCHAR(120),
    contact_phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_items_type (type),
    INDEX idx_items_status (status),
    INDEX idx_items_category (category),
    INDEX idx_items_building (building)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================================
-- 8. ITEM CLAIMS TABLE
-- Ownership verification claims submitted for found items
-- ===================================================================
CREATE TABLE item_claims (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_code VARCHAR(40) NOT NULL UNIQUE COMMENT 'Business code e.g. CLM-5091',
    item_id BIGINT NOT NULL,
    item_title VARCHAR(180),
    claimant_id VARCHAR(60) NOT NULL,
    claimant_name VARCHAR(120) NOT NULL,
    claimant_email VARCHAR(120) NOT NULL,
    claimant_phone VARCHAR(30) NOT NULL,
    ownership_proof TEXT NOT NULL COMMENT 'Proof description or receipt details',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, UNDER_REVIEW, APPROVED, REJECTED, HANDED_OVER',
    admin_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    FOREIGN KEY (item_id) REFERENCES lost_found_items(id) ON DELETE CASCADE,
    INDEX idx_claims_status (status),
    INDEX idx_claims_claimant (claimant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================================
-- 9. NOTIFICATIONS TABLE
-- System alerts, emergency notices, and maintenance work order updates
-- ===================================================================
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL COMMENT 'Recipient user ID if targeted to specific user',
    target_role VARCHAR(30) NULL COMMENT 'Target role e.g. ADMIN, STAFF, STUDENT',
    complaint_id VARCHAR(40) NULL COMMENT 'Related complaint code if applicable',
    type VARCHAR(30) NOT NULL DEFAULT 'info' COMMENT 'info, warning, success, error',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_role (target_role),
    INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================================
-- 10. SEED INITIAL DATA FOR DEMONSTRATION
-- ===================================================================

-- Seed Users
INSERT INTO users (id, firebase_uid, username, email, name, password_hash, role, department, phone) VALUES
    (1, 'fb_uid_admin_01', 'admin', 'admin@campusfix.edu', 'Dr. R. Natarajan', '$2a$10$X...SeededHash...', 'ADMIN', 'Campus Facilities & Operations', '+91 98401 01100'),
    (2, 'fb_uid_student_01', 'student', 'student@campusfix.edu', 'Harikrishna GM', '$2a$10$X...SeededHash...', 'STUDENT', 'Computer Science & Engineering', '+91 98840 56789'),
    (3, 'fb_uid_staff_01', 'david_staff', 'staff@campusfix.edu', 'Rajesh Sharma', '$2a$10$X...SeededHash...', 'STAFF', 'Electrical & Facilities', '+91 97908 12345')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed User Accounts
INSERT INTO user_accounts (user_id, account_status) VALUES
    (1, 'ACTIVE'),
    (2, 'ACTIVE'),
    (3, 'ACTIVE')
ON DUPLICATE KEY UPDATE account_status = VALUES(account_status);

-- Seed Campus Locations
INSERT INTO campus_locations (id, building, room, floor, wing, qr_code, active_complaints) VALUES
    ('LOC-CSE-204', 'Technology Block C', 'Lab 304', '3rd Floor', 'East Wing', 'QR-LOC-CSE-204', 1),
    ('LOC-MAIN-101', 'Main Academic Block', 'Lecture Hall 101', '1st Floor', 'Central', 'QR-LOC-MAIN-101', 0),
    ('LOC-LIB-201', 'Central Library', 'Reading Room', '2nd Floor', 'North Wing', 'QR-LOC-LIB-201', 1),
    ('LOC-SCI-202', 'Science Block B', 'Classroom 202', '2nd Floor', 'West Wing', 'QR-LOC-SCI-202', 0),
    ('LOC-HOSTEL-4', 'Boys Hostel 4', 'Wing A Corridor', '1st Floor', 'Wing A', 'QR-LOC-HOSTEL-4', 1),
    ('LOC-CAFE-1', 'Student Center Cafeteria', 'North Dining Wing', 'Ground Floor', 'Dining Area', 'QR-LOC-CAFE-1', 0)
ON DUPLICATE KEY UPDATE building = VALUES(building);

-- Seed Staff
INSERT INTO staff (name, email, phone, department, specialization, availability, active) VALUES
    ('Rajesh Sharma', 'staff@campusfix.edu', '+91 97908 12345', 'Electrical Maintenance', 'Electrical Systems & Wiring', 'Available', TRUE),
    ('Priya Sundaram', 'priya.sundaram@campusfix.edu', '+91 98412 34567', 'HVAC & Climate Control', 'Air Conditioning & Ventilation', 'Busy', TRUE),
    ('Karthik Raja', 'karthik.raja@campusfix.edu', '+91 98845 67891', 'IT Infrastructure', 'Wi-Fi / Fiber Optic Networks', 'Available', TRUE),
    ('Suresh Balaji', 'suresh.balaji@campusfix.edu', '+91 94450 78912', 'Civil & Plumbing', 'Plumbing, Water Supply & Drainage', 'Available', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed Complaints
INSERT INTO complaints (complaint_id, complaint_title, category, building, room, location, description, priority, status, student_name, student_email, student_phone, assigned_staff_id) VALUES
    ('CMP-LOC-CSE-204-1', 'Projector power socket sparking', 'Electrical', 'Technology Block C', 'Lab 304', 'Technology Block C - Lab 304', 'Main projector socket emits sparks when turned on.', 'Critical', 'In Progress', 'Harikrishna GM', 'student@campusfix.edu', '+91 98840 56789', '1'),
    ('LOC-LIB-201-1', 'Wi-Fi router disconnected in Reading Room', 'Wi-Fi/Network', 'Central Library', 'Reading Room', 'Central Library - Reading Room', 'Frequent packet loss and dropouts on 5GHz band.', 'High', 'Assigned', 'Harikrishna GM', 'student@campusfix.edu', '+91 98840 56789', '3')
ON DUPLICATE KEY UPDATE complaint_title = VALUES(complaint_title);

-- Seed Lost & Found Items
INSERT INTO lost_found_items (item_code, type, item_name, category, building, location, date_occurred, description, holding_location, status, reporter_name, contact_email) VALUES
    ('ITM-LF-101', 'LOST', 'Dell XPS 13 Laptop', 'Electronics', 'Technology Block C', 'Lab 304', CURDATE(), 'Silver color with CS department sticker.', '', 'OPEN', 'Harikrishna GM', 'student@campusfix.edu'),
    ('ITM-LF-102', 'FOUND', 'Casio Scientific Calculator FX-991ES', 'Accessories', 'Central Library', 'Reading Room Counter', CURDATE(), 'Found near desk 12.', 'Library Security Desk', 'OPEN', 'Rajesh Sharma', 'staff@campusfix.edu')
ON DUPLICATE KEY UPDATE item_name = VALUES(item_name);

-- Seed Notifications
INSERT INTO notifications (target_role, complaint_id, type, title, message, is_read) VALUES
    ('ADMIN', 'CMP-LOC-CSE-204-1', 'warning', 'Critical SLA Approaching', 'Ticket CMP-LOC-CSE-204-1 in Lab 304 requires immediate review.', FALSE),
    ('STUDENT', NULL, 'success', 'Welcome to CampusFix', 'CampusFix and CampusFind AI database successfully migrated to MySQL.', TRUE);

-- ===================================================================
-- END OF SCHEMA CREATION SCRIPT
-- ===================================================================
