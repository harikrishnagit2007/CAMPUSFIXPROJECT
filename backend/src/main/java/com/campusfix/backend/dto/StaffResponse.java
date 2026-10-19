package com.campusfix.backend.dto;

import com.campusfix.backend.entity.Staff;
import java.time.LocalDateTime;

public class StaffResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String department;
    private String specialization;
    private String availability;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public StaffResponse() {}

    public static StaffResponse fromEntity(Staff staff) {
        if (staff == null) return null;
        StaffResponse dto = new StaffResponse();
        dto.setId(staff.getId());
        dto.setName(staff.getName());
        dto.setEmail(staff.getEmail());
        dto.setPhone(staff.getPhone());
        dto.setDepartment(staff.getDepartment());
        dto.setSpecialization(staff.getSpecialization());
        dto.setAvailability(staff.getAvailability());
        dto.setActive(staff.getActive());
        dto.setCreatedAt(staff.getCreatedAt());
        dto.setUpdatedAt(staff.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
