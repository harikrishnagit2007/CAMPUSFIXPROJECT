package com.campusfix.backend.dto;

import com.campusfix.backend.entity.ItemClaim;
import com.campusfix.backend.entity.enums.ClaimStatus;
import java.time.LocalDateTime;

public class ItemClaimResponse {

    private Long id;
    private String claimCode;
    private Long itemId;
    private String itemCode;
    private String itemTitle;
    private String claimantId;
    private String claimantName;
    private String claimantEmail;
    private String claimantPhone;
    private String ownershipProof;
    private ClaimStatus status;
    private String adminNotes;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;

    public ItemClaimResponse() {}

    public static ItemClaimResponse fromEntity(ItemClaim claim) {
        if (claim == null) return null;
        ItemClaimResponse dto = new ItemClaimResponse();
        dto.setId(claim.getId());
        dto.setClaimCode(claim.getClaimCode());
        if (claim.getItem() != null) {
            dto.setItemId(claim.getItem().getId());
            dto.setItemCode(claim.getItem().getItemCode());
        }
        dto.setItemTitle(claim.getItemTitle());
        dto.setClaimantId(claim.getClaimantId());
        dto.setClaimantName(claim.getClaimantName());
        dto.setClaimantEmail(claim.getClaimantEmail());
        dto.setClaimantPhone(claim.getClaimantPhone());
        dto.setOwnershipProof(claim.getOwnershipProof());
        dto.setStatus(claim.getStatus());
        dto.setAdminNotes(claim.getAdminNotes());
        dto.setSubmittedAt(claim.getSubmittedAt());
        dto.setVerifiedAt(claim.getVerifiedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getClaimCode() { return claimCode; }
    public void setClaimCode(String claimCode) { this.claimCode = claimCode; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }
    public String getItemTitle() { return itemTitle; }
    public void setItemTitle(String itemTitle) { this.itemTitle = itemTitle; }
    public String getClaimantId() { return claimantId; }
    public void setClaimantId(String claimantId) { this.claimantId = claimantId; }
    public String getClaimantName() { return claimantName; }
    public void setClaimantName(String claimantName) { this.claimantName = claimantName; }
    public String getClaimantEmail() { return claimantEmail; }
    public void setClaimantEmail(String claimantEmail) { this.claimantEmail = claimantEmail; }
    public String getClaimantPhone() { return claimantPhone; }
    public void setClaimantPhone(String claimantPhone) { this.claimantPhone = claimantPhone; }
    public String getOwnershipProof() { return ownershipProof; }
    public void setOwnershipProof(String ownershipProof) { this.ownershipProof = ownershipProof; }
    public ClaimStatus getStatus() { return status; }
    public void setStatus(ClaimStatus status) { this.status = status; }
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
}
