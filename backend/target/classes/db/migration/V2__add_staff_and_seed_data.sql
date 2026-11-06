-- ===================================================================
-- Flyway Database Migration V2: Maintenance Staff Table & Seed Data
-- ===================================================================

-- 1. Create Staff Members Table
CREATE TABLE IF NOT EXISTS staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(30),
    department VARCHAR(100) NOT NULL,
    specialization VARCHAR(140),
    availability VARCHAR(30) NOT NULL DEFAULT 'Available',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_department (department),
    INDEX idx_staff_availability (availability)
);

-- 2. Seed Default Staff Profiles
INSERT INTO staff (name, email, phone, department, specialization, availability, active)
VALUES 
    ('Rajesh Sharma', 'staff@campusfix.edu', '+91 97908 12345', 'Electrical Maintenance', 'Electrical Systems & Wiring', 'Available', TRUE),
    ('Priya Sundaram', 'priya.sundaram@campusfix.edu', '+91 98412 34567', 'HVAC & Climate Control', 'Air Conditioning & Ventilation', 'Busy', TRUE),
    ('Karthik Raja', 'karthik.raja@campusfix.edu', '+91 98845 67891', 'IT Infrastructure', 'Wi-Fi / Fiber Optic Networks', 'Available', TRUE),
    ('Suresh Balaji', 'suresh.balaji@campusfix.edu', '+91 94450 78912', 'Civil & Plumbing', 'Plumbing, Water Supply & Drainage', 'Available', TRUE),
    ('Ramesh Kumar', 'ramesh.kumar@campusfix.edu', '+91 97910 23456', 'Carpentry & Facilities', 'Desks, Benches & Acoustic Paneling', 'On Leave', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3. Seed Default Campus Locations with QR Badges
INSERT INTO campus_locations (id, building, room, floor, wing, qr_code, active_complaints)
VALUES
    ('LOC-CSE-204', 'Technology Block C', 'Lab 304', '3rd Floor', 'East Wing', 'QR-LOC-CSE-204', 1),
    ('LOC-MAIN-101', 'Main Academic Block', 'Lecture Hall 101', '1st Floor', 'Central', 'QR-LOC-MAIN-101', 0),
    ('LOC-LIB-201', 'Central Library', 'Reading Room', '2nd Floor', 'North Wing', 'QR-LOC-LIB-201', 1),
    ('LOC-SCI-202', 'Science Block B', 'Classroom 202', '2nd Floor', 'West Wing', 'QR-LOC-SCI-202', 0),
    ('LOC-HOSTEL-4', 'Boys Hostel 4', 'Wing A Corridor', '1st Floor', 'Wing A', 'QR-LOC-HOSTEL-4', 1),
    ('LOC-CAFE-1', 'Student Center Cafeteria', 'North Dining Wing', 'Ground Floor', 'Dining Area', 'QR-LOC-CAFE-1', 0)
ON DUPLICATE KEY UPDATE building = VALUES(building);
