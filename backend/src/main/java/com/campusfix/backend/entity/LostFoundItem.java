package com.campusfix.backend.entity;

import com.campusfix.backend.entity.enums.ItemStatus;
import com.campusfix.backend.entity.enums.ItemType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lost_found_items", indexes = {
    @Index(name = "idx_items_type", columnList = "type"),
    @Index(name = "idx_items_status", columnList = "status"),
    @Index(name = "idx_items_category", columnList = "category")
})
public class LostFoundItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_code", nullable = false, unique = true, length = 40)
    private String itemCode;

    @NotNull(message = "Item type (LOST or FOUND) is required")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "type", nullable = false, length = 20)
    private ItemType type;

    @NotBlank(message = "Item name is required")
    @Column(name = "item_name", nullable = false, length = 180)
    private String itemName;

    @NotBlank(message = "Category is required")
    @Column(name = "category", nullable = false, length = 80)
    private String category;

    @NotBlank(message = "Building is required")
    @Column(name = "building", nullable = false, length = 100)
    private String building;

    @NotBlank(message = "Location detail is required")
    @Column(name = "location", nullable = false, length = 220)
    private String location;

    @NotNull(message = "Date occurred is required")
    @Column(name = "date_occurred", nullable = false)
    private LocalDate dateOccurred;

    @Column(name = "approx_time", length = 40)
    private String approxTime;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "identifying_marks", columnDefinition = "TEXT")
    private String identifyingMarks;

    @Column(name = "holding_location", length = 200)
    private String holdingLocation;

    @Column(name = "image", columnDefinition = "LONGTEXT")
    private String image;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 30)
    private ItemStatus status = ItemStatus.OPEN;

    @Column(name = "reporter_id", length = 60)
    private String reporterId;

    @Column(name = "reporter_name", length = 120)
    private String reporterName;

    @Column(name = "reporter_role", length = 30)
    private String reporterRole = "STUDENT";

    @Column(name = "contact_email", length = 120)
    private String contactEmail;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ItemClaim> claims = new ArrayList<>();

    public LostFoundItem() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ItemStatus.OPEN;
        }
        if (this.reporterRole == null) {
            this.reporterRole = "STUDENT";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public ItemType getType() {
        return type;
    }

    public void setType(ItemType type) {
        this.type = type;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
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
        return dateOccurred;
    }

    public void setDateOccurred(LocalDate dateOccurred) {
        this.dateOccurred = dateOccurred;
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

    public ItemStatus getStatus() {
        return status;
    }

    public void setStatus(ItemStatus status) {
        this.status = status;
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

    public List<ItemClaim> getClaims() {
        return claims;
    }

    public void setClaims(List<ItemClaim> claims) {
        this.claims = claims;
    }
}
