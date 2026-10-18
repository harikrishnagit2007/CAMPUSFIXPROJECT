-- ===================================================================
-- Flyway Database Migration V1: Initial Campus Management Schema
-- ===================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'STUDENT',
    department VARCHAR(100),
    phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Campus Locations / QR Codes Table
CREATE TABLE IF NOT EXISTS campus_locations (
    id VARCHAR(50) PRIMARY KEY,
    building VARCHAR(100) NOT NULL,
    room VARCHAR(60) NOT NULL,
    floor VARCHAR(30),
    wing VARCHAR(60),
    qr_code VARCHAR(120) UNIQUE,
    active_complaints INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Maintenance Complaint Tickets Table
CREATE TABLE IF NOT EXISTS complaints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(40) NOT NULL UNIQUE,
    complaint_title VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    building VARCHAR(100) NOT NULL,
    room VARCHAR(60),
    location VARCHAR(220) NOT NULL,
    description TEXT,
    priority VARCHAR(30) NOT NULL DEFAULT 'Medium',
    status VARCHAR(40) NOT NULL DEFAULT 'Submitted',
    image LONGTEXT,
    student_name VARCHAR(120),
    student_email VARCHAR(120),
    student_phone VARCHAR(30),
    assigned_staff_id VARCHAR(60),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_complaints_status (status),
    INDEX idx_complaints_category (category),
    INDEX idx_complaints_building (building)
);

-- 4. Lost & Found Items Table
CREATE TABLE IF NOT EXISTS lost_found_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(40) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL, -- LOST, FOUND
    item_name VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    building VARCHAR(100) NOT NULL,
    location VARCHAR(220) NOT NULL,
    date_occurred DATE NOT NULL,
    approx_time VARCHAR(40),
    description TEXT,
    identifying_marks TEXT,
    holding_location VARCHAR(200),
    image LONGTEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, CLAIM_PENDING, RETURNED, CLOSED
    reporter_id VARCHAR(60),
    reporter_name VARCHAR(120),
    reporter_role VARCHAR(30) DEFAULT 'STUDENT',
    contact_email VARCHAR(120),
    contact_phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_items_type (type),
    INDEX idx_items_status (status),
    INDEX idx_items_category (category)
);

-- 5. Item Ownership Claims Table
CREATE TABLE IF NOT EXISTS item_claims (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_code VARCHAR(40) NOT NULL UNIQUE,
    item_id BIGINT NOT NULL,
    item_title VARCHAR(180),
    claimant_id VARCHAR(60) NOT NULL,
    claimant_name VARCHAR(120) NOT NULL,
    claimant_email VARCHAR(120) NOT NULL,
    claimant_phone VARCHAR(30) NOT NULL,
    ownership_proof TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, APPROVED, REJECTED, HANDED_OVER
    admin_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    FOREIGN KEY (item_id) REFERENCES lost_found_items(id) ON DELETE CASCADE,
    INDEX idx_claims_status (status)
);
