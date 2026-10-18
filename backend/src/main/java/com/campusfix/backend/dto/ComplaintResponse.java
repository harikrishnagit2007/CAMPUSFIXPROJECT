package com.campusfix.backend.dto;

import com.campusfix.backend.entity.Complaint;
import java.time.LocalDateTime;

public class ComplaintResponse {

    private Long id;
    private String complaintId;
    private String complaintTitle;
    private String category;
    private String building;
    private String room;
    private String location;
    private String description;
    private String priority;
    private String status;
    private String image;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private String assignedStaffId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ComplaintResponse() {}

    public static ComplaintResponse fromEntity(Complaint c) {
        if (c == null) return null;
        ComplaintResponse dto = new ComplaintResponse();
        dto.setId(c.getId());
        dto.setComplaintId(c.getComplaintId());
        dto.setComplaintTitle(c.getComplaintTitle());
        dto.setCategory(c.getCategory());
        dto.setBuilding(c.getBuilding());
        dto.setRoom(c.getRoom());
        dto.setLocation(c.getLocation());
        dto.setDescription(c.getDescription());
        dto.setPriority(c.getPriority());
        dto.setStatus(c.getStatus());
        dto.setImage(c.getImage());
        dto.setStudentName(c.getStudentName());
        dto.setStudentEmail(c.getStudentEmail());
        dto.setStudentPhone(c.getStudentPhone());
        dto.setAssignedStaffId(c.getAssignedStaffId());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }
    public String getComplaintTitle() { return complaintTitle; }
    public void setComplaintTitle(String complaintTitle) { this.complaintTitle = complaintTitle; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    public String getStudentPhone() { return studentPhone; }
    public void setStudentPhone(String studentPhone) { this.studentPhone = studentPhone; }
    public String getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(String assignedStaffId) { this.assignedStaffId = assignedStaffId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
