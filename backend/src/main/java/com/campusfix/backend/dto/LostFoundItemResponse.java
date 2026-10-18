package com.campusfix.backend.dto;

import com.campusfix.backend.entity.LostFoundItem;
import com.campusfix.backend.entity.enums.ItemStatus;
import com.campusfix.backend.entity.enums.ItemType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class LostFoundItemResponse {

    private Long id;
    private String itemCode;
    private ItemType type;
    private String itemName;
    private String title; // alias for compatibility
    private String category;
    private String building;
    private String location;
    private LocalDate dateOccurred;
    private String date; // formatted string alias
    private String approxTime;
    private String description;
    private String identifyingMarks;
    private String holdingLocation;
    private String image;
    private ItemStatus status;
    private String reporterId;
    private String reporterName;
    private String reporterRole;
    private String contactEmail;
    private String contactPhone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LostFoundItemResponse() {}

    public static LostFoundItemResponse fromEntity(LostFoundItem item) {
        if (item == null) return null;
        LostFoundItemResponse dto = new LostFoundItemResponse();
        dto.setId(item.getId());
        dto.setItemCode(item.getItemCode());
        dto.setType(item.getType());
        dto.setItemName(item.getItemName());
        dto.setTitle(item.getItemName());
        dto.setCategory(item.getCategory());
        dto.setBuilding(item.getBuilding());
        dto.setLocation(item.getLocation());
        dto.setDateOccurred(item.getDateOccurred());
        dto.setDate(item.getDateOccurred() != null ? item.getDateOccurred().toString() : null);
        dto.setApproxTime(item.getApproxTime());
        dto.setDescription(item.getDescription());
        dto.setIdentifyingMarks(item.getIdentifyingMarks());
        dto.setHoldingLocation(item.getHoldingLocation());
        dto.setImage(item.getImage());
        dto.setStatus(item.getStatus());
        dto.setReporterId(item.getReporterId());
        dto.setReporterName(item.getReporterName());
        dto.setReporterRole(item.getReporterRole());
        dto.setContactEmail(item.getContactEmail());
        dto.setContactPhone(item.getContactPhone());
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }
    public ItemType getType() { return type; }
    public void setType(ItemType type) { this.type = type; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public LocalDate getDateOccurred() { return dateOccurred; }
    public void setDateOccurred(LocalDate dateOccurred) { this.dateOccurred = dateOccurred; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getApproxTime() { return approxTime; }
    public void setApproxTime(String approxTime) { this.approxTime = approxTime; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIdentifyingMarks() { return identifyingMarks; }
    public void setIdentifyingMarks(String identifyingMarks) { this.identifyingMarks = identifyingMarks; }
    public String getHoldingLocation() { return holdingLocation; }
    public void setHoldingLocation(String holdingLocation) { this.holdingLocation = holdingLocation; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public ItemStatus getStatus() { return status; }
    public void setStatus(ItemStatus status) { this.status = status; }
    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }
    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }
    public String getReporterRole() { return reporterRole; }
    public void setReporterRole(String reporterRole) { this.reporterRole = reporterRole; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
