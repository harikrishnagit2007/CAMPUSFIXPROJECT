package com.campusfix.backend.dto;

import com.campusfix.backend.entity.enums.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class LostFoundItemRequest {

    private String itemName;
    private String title; // alias for compatibility

    @NotNull(message = "Type is required (LOST or FOUND)")
    private ItemType type;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Building is required")
    private String building;

    @NotBlank(message = "Location is required")
    private String location;

    private LocalDate dateOccurred;
    private String date; // string date fallback
    private String approxTime;

    private String description;
    private String identifyingMarks;
    private String holdingLocation;
    private String image;

    private String reporterId;
    private String reporterName;
    private String reporterRole = "STUDENT";
    private String contactEmail;
    private String contactPhone;

    public LostFoundItemRequest() {}

    public String getItemName() {
        return itemName != null && !itemName.trim().isEmpty() ? itemName : title;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public ItemType getType() {
        return type;
    }

    public void setType(ItemType type) {
        this.type = type;
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDate getDateOccurred() {
        if (dateOccurred != null) return dateOccurred;
        if (date != null && !date.trim().isEmpty()) {
            try {
                return LocalDate.parse(date.trim());
            } catch (Exception e) {
                return LocalDate.now();
            }
        }
        return LocalDate.now();
    }

    public void setDateOccurred(LocalDate dateOccurred) {
        this.dateOccurred = dateOccurred;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getApproxTime() {
        return approxTime;
    }

    public void setApproxTime(String approxTime) {
        this.approxTime = approxTime;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIdentifyingMarks() {
        return identifyingMarks;
    }

    public void setIdentifyingMarks(String identifyingMarks) {
        this.identifyingMarks = identifyingMarks;
    }

    public String getHoldingLocation() {
        return holdingLocation;
    }

    public void setHoldingLocation(String holdingLocation) {
        this.holdingLocation = holdingLocation;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getReporterId() {
        return reporterId;
    }

    public void setReporterId(String reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }

    public String getReporterRole() {
        return reporterRole;
    }

    public void setReporterRole(String reporterRole) {
        this.reporterRole = reporterRole;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
}
