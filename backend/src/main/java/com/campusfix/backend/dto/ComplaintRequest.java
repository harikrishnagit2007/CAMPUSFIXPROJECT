package com.campusfix.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    private String complaintTitle;
    private String title; // alias for compatibility

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Building is required")
    private String building;

    private String room;

    @NotBlank(message = "Location detail is required")
    private String location;

    private String description;
    private String priority = "Medium";
    private String status = "Submitted";
    private String image;

    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private String assignedStaffId;

    public ComplaintRequest() {}

    public String getComplaintTitle() {
        return complaintTitle != null && !complaintTitle.trim().isEmpty() ? complaintTitle : title;
    }

    public void setComplaintTitle(String complaintTitle) {
        this.complaintTitle = complaintTitle;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority != null ? priority : "Medium";
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status != null ? status : "Submitted";
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getStudentPhone() {
        return studentPhone;
    }

    public void setStudentPhone(String studentPhone) {
        this.studentPhone = studentPhone;
    }

    public String getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(String assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }
}
