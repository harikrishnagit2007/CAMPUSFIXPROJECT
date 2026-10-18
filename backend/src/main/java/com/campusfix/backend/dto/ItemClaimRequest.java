package com.campusfix.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ItemClaimRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    private String itemTitle;

    @NotBlank(message = "Claimant ID is required")
    private String claimantId;

    @NotBlank(message = "Claimant name is required")
    private String claimantName;

    @NotBlank(message = "Claimant email is required")
    private String claimantEmail;

    @NotBlank(message = "Claimant phone is required")
    private String claimantPhone;

    @NotBlank(message = "Ownership proof is required")
    private String ownershipProof;
    private String proofDescription; // alias

    private String adminNotes;

    public ItemClaimRequest() {}

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

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

    public String getOwnershipProof() {
        return ownershipProof != null && !ownershipProof.trim().isEmpty() ? ownershipProof : proofDescription;
    }
    public void setOwnershipProof(String ownershipProof) { this.ownershipProof = ownershipProof; }

    public String getProofDescription() { return proofDescription; }
    public void setProofDescription(String proofDescription) { this.proofDescription = proofDescription; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
}
