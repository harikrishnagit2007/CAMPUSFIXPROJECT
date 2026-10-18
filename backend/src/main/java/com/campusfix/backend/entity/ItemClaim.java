package com.campusfix.backend.entity;

import com.campusfix.backend.entity.enums.ClaimStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_claims", indexes = {
    @Index(name = "idx_claims_status", columnList = "status")
})
public class ItemClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_code", nullable = false, unique = true, length = 40)
    private String claimCode;

    @NotNull(message = "Item reference is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnore
    private LostFoundItem item;

    @Column(name = "item_title", length = 180)
    private String itemTitle;

    @NotBlank(message = "Claimant ID is required")
    @Column(name = "claimant_id", nullable = false, length = 60)
    private String claimantId;

    @NotBlank(message = "Claimant name is required")
    @Column(name = "claimant_name", nullable = false, length = 120)
    private String claimantName;

    @NotBlank(message = "Claimant email is required")
    @Column(name = "claimant_email", nullable = false, length = 120)
    private String claimantEmail;

    @NotBlank(message = "Claimant phone is required")
    @Column(name = "claimant_phone", nullable = false, length = 30)
    private String claimantPhone;

    @NotBlank(message = "Ownership proof is required")
    @Column(name = "ownership_proof", nullable = false, columnDefinition = "TEXT")
    private String ownershipProof;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ClaimStatus status = ClaimStatus.PENDING;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    public ItemClaim() {}

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ClaimStatus.PENDING;
        }
    }

    // Convenience method to get itemId directly
    @Transient
    public Long getItemId() {
        return item != null ? item.getId() : null;
    }

    @Transient
    public String getItemCode() {
        return item != null ? item.getItemCode() : null;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClaimCode() {
        return claimCode;
    }

    public void setClaimCode(String claimCode) {
        this.claimCode = claimCode;
    }

    public LostFoundItem getItem() {
        return item;
    }

    public void setItem(LostFoundItem item) {
        this.item = item;
    }

    public String getItemTitle() {
        return itemTitle;
    }

    public void setItemTitle(String itemTitle) {
        this.itemTitle = itemTitle;
    }

    public String getClaimantId() {
        return claimantId;
    }

    public void setClaimantId(String claimantId) {
        this.claimantId = claimantId;
    }

    public String getClaimantName() {
        return claimantName;
    }

    public void setClaimantName(String claimantName) {
        this.claimantName = claimantName;
    }

    public String getClaimantEmail() {
        return claimantEmail;
    }

    public void setClaimantEmail(String claimantEmail) {
        this.claimantEmail = claimantEmail;
    }

    public String getClaimantPhone() {
        return claimantPhone;
    }

    public void setClaimantPhone(String claimantPhone) {
        this.claimantPhone = claimantPhone;
    }

    public String getOwnershipProof() {
        return ownershipProof;
    }

    public void setOwnershipProof(String ownershipProof) {
        this.ownershipProof = ownershipProof;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimStatus status) {
        this.status = status;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
