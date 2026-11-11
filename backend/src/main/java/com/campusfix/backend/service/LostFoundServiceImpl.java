package com.campusfix.backend.service;

import com.campusfix.backend.dto.*;
import com.campusfix.backend.entity.ItemClaim;
import com.campusfix.backend.entity.LostFoundItem;
import com.campusfix.backend.entity.enums.ClaimStatus;
import com.campusfix.backend.entity.enums.ItemStatus;
import com.campusfix.backend.entity.enums.ItemType;
import com.campusfix.backend.repository.ItemClaimRepository;
import com.campusfix.backend.repository.LostFoundItemRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class LostFoundServiceImpl implements LostFoundService {

    private final LostFoundItemRepository itemRepository;
    private final ItemClaimRepository claimRepository;

    public LostFoundServiceImpl(LostFoundItemRepository itemRepository, ItemClaimRepository claimRepository) {
        this.itemRepository = itemRepository;
        this.claimRepository = claimRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LostFoundItemResponse> getAllItems(ItemType type, String category, String building, ItemStatus status, String search) {
        List<LostFoundItem> items = itemRepository.searchItems(
                type,
                (category != null && !category.trim().isEmpty()) ? category.trim() : null,
                (building != null && !building.trim().isEmpty()) ? building.trim() : null,
                status,
                (search != null && !search.trim().isEmpty()) ? search.trim() : null
        );

        return items.stream()
                .map(LostFoundItemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LostFoundItemResponse> getMyReports(String reporterId) {
        String activeUser = getAuthenticatedUsernameOrId();
        String targetId = (activeUser != null && !activeUser.isEmpty()) ? activeUser : reporterId;
        if (targetId == null || targetId.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return itemRepository.findByReporterIdOrderByCreatedAtDesc(targetId.trim()).stream()
                .map(LostFoundItemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LostFoundItemResponse getItemByIdOrCode(String identifier) {
        LostFoundItem item = findItemEntity(identifier);
        return LostFoundItemResponse.fromEntity(item);
    }

    @Override
    public LostFoundItemResponse reportItem(LostFoundItemRequest request) {
        LostFoundItem item = new LostFoundItem();
        String prefix = request.getType() == ItemType.LOST ? "LF-LOST-" : "LF-FOUND-";
        String code = prefix + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        item.setItemCode(code);
        item.setType(request.getType());
        item.setItemName(request.getItemName());
        item.setCategory(request.getCategory());
        item.setBuilding(request.getBuilding());
        item.setLocation(request.getLocation());
        item.setDateOccurred(request.getDateOccurred());
        item.setApproxTime(request.getApproxTime());
        item.setDescription(request.getDescription());
        item.setIdentifyingMarks(request.getIdentifyingMarks());
        item.setHoldingLocation(request.getHoldingLocation());
        item.setImage(request.getImage());
        item.setStatus(ItemStatus.OPEN);

        // Security Fix: Bind reporter identity from Spring Security authentication context
        String authUser = getAuthenticatedUsernameOrId();
        if (authUser != null && !authUser.isEmpty()) {
            item.setReporterId(authUser);
            item.setReporterName(request.getReporterName() != null && !request.getReporterName().isEmpty() ? request.getReporterName() : authUser);
        } else {
            item.setReporterId(request.getReporterId() != null ? request.getReporterId() : "guest_reporter");
            item.setReporterName(request.getReporterName() != null ? request.getReporterName() : "Campus Reporter");
        }

        item.setReporterRole(request.getReporterRole() != null ? request.getReporterRole() : "STUDENT");
        item.setContactEmail(request.getContactEmail());
        item.setContactPhone(request.getContactPhone());

        LostFoundItem saved = itemRepository.save(item);
        return LostFoundItemResponse.fromEntity(saved);
    }

    @Override
    public LostFoundItemResponse updateItem(String identifier, LostFoundItemRequest request) {
        LostFoundItem item = findItemEntity(identifier);

        // Security Fix: Ownership & Role Verification
        enforceItemOwnershipOrRole(item, "modify");

        if (request.getItemName() != null) item.setItemName(request.getItemName());
        if (request.getCategory() != null) item.setCategory(request.getCategory());
        if (request.getBuilding() != null) item.setBuilding(request.getBuilding());
        if (request.getLocation() != null) item.setLocation(request.getLocation());
        if (request.getDateOccurred() != null) item.setDateOccurred(request.getDateOccurred());
        if (request.getApproxTime() != null) item.setApproxTime(request.getApproxTime());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getIdentifyingMarks() != null) item.setIdentifyingMarks(request.getIdentifyingMarks());
        if (request.getHoldingLocation() != null) item.setHoldingLocation(request.getHoldingLocation());
        if (request.getImage() != null) item.setImage(request.getImage());
        if (request.getContactEmail() != null) item.setContactEmail(request.getContactEmail());
        if (request.getContactPhone() != null) item.setContactPhone(request.getContactPhone());

        item.setUpdatedAt(LocalDateTime.now());
        LostFoundItem updated = itemRepository.save(item);
        return LostFoundItemResponse.fromEntity(updated);
    }

    @Override
    public LostFoundItemResponse patchItemStatus(String identifier, StatusUpdateRequest request) {
        LostFoundItem item = findItemEntity(identifier);

        // Security Fix: Ownership or Administrative Role Verification
        enforceItemOwnershipOrRole(item, "update status for");

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            try {
                ItemStatus newStatus = ItemStatus.valueOf(request.getStatus().trim().toUpperCase());
                item.setStatus(newStatus);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid item status: " + request.getStatus());
            }
        }

        item.setUpdatedAt(LocalDateTime.now());
        LostFoundItem updated = itemRepository.save(item);
        return LostFoundItemResponse.fromEntity(updated);
    }

    @Override
    public void deleteItem(String identifier) {
        LostFoundItem item = findItemEntity(identifier);

        // Security Fix: Ownership or Administrative Role Verification
        enforceItemOwnershipOrRole(item, "delete");

        itemRepository.delete(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PotentialMatchResult> findMatches(String itemIdentifier) {
        LostFoundItem sourceItem = findItemEntity(itemIdentifier);
        ItemType oppositeType = sourceItem.getType() == ItemType.LOST ? ItemType.FOUND : ItemType.LOST;

        List<LostFoundItem> candidates = itemRepository.findCandidateMatches(
                oppositeType,
                sourceItem.getCategory(),
                sourceItem.getBuilding()
        );

        List<PotentialMatchResult> matches = new ArrayList<>();
        Set<String> sourceWords = extractKeywords(sourceItem.getItemName() + " " + (sourceItem.getDescription() != null ? sourceItem.getDescription() : ""));

        for (LostFoundItem candidate : candidates) {
            int score = 0;
            List<String> reasons = new ArrayList<>();

            // 1. Category match (35%)
            if (candidate.getCategory() != null && candidate.getCategory().equalsIgnoreCase(sourceItem.getCategory())) {
                score += 35;
                reasons.add("Exact Category match: " + candidate.getCategory());
            }

            // 2. Building / Location match (25%)
            if (candidate.getBuilding() != null && candidate.getBuilding().equalsIgnoreCase(sourceItem.getBuilding())) {
                score += 25;
                reasons.add("Same campus building: " + candidate.getBuilding());
            } else if (candidate.getLocation() != null && sourceItem.getLocation() != null &&
                       candidate.getLocation().toLowerCase().contains(sourceItem.getLocation().toLowerCase())) {
                score += 15;
                reasons.add("Nearby location match");
            }

            // 3. Keyword / title text similarity (up to 30%)
            Set<String> candidateWords = extractKeywords(candidate.getItemName() + " " + (candidate.getDescription() != null ? candidate.getDescription() : ""));
            long sharedWords = sourceWords.stream().filter(candidateWords::contains).count();
            if (sharedWords > 0) {
                int keywordScore = Math.min(30, (int) (sharedWords * 10));
                score += keywordScore;
                reasons.add("Shared descriptive keywords: " + sharedWords + " terms");
            }

            // 4. Date proximity within 7 days (10%)
            if (sourceItem.getDateOccurred() != null && candidate.getDateOccurred() != null) {
                long daysDiff = Math.abs(ChronoUnit.DAYS.between(sourceItem.getDateOccurred(), candidate.getDateOccurred()));
                if (daysDiff <= 3) {
                    score += 10;
                    reasons.add("Reported within 3 days (" + candidate.getDateOccurred() + ")");
                } else if (daysDiff <= 7) {
                    score += 5;
                    reasons.add("Reported within 7 days");
                }
            }

            if (score >= 35) { // Match threshold
                matches.add(new PotentialMatchResult(
                        LostFoundItemResponse.fromEntity(candidate),
                        Math.min(100, score),
                        reasons
                ));
            }
        }

        matches.sort((a, b) -> Integer.compare(b.getMatchScore(), a.getMatchScore()));
        return matches;
    }

    @Override
    public ItemClaimResponse submitClaim(ItemClaimRequest request) {
        LostFoundItem item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new NoSuchElementException("Item not found for claim: " + request.getItemId()));

        // 1. Prevent filing claims on items that are already returned or closed
        if (item.getStatus() == ItemStatus.RETURNED || item.getStatus() == ItemStatus.CLOSED) {
            throw new IllegalArgumentException("Cannot submit an ownership claim for an item that has already been returned or closed.");
        }

        // Security Fix: Bind claimant identity from Spring Security authentication context
        String authUser = getAuthenticatedUsernameOrId();
        String effectiveClaimantId = (authUser != null && !authUser.isEmpty()) ? authUser : (request.getClaimantId() != null ? request.getClaimantId() : "claimant_guest");

        // 2. Prevent conflicting claims if another claim has already been APPROVED or HANDED_OVER for this item
        List<ItemClaim> existingClaims = claimRepository.findByItemId(item.getId());
        boolean hasApprovedClaim = existingClaims.stream()
                .anyMatch(c -> c.getStatus() == ClaimStatus.APPROVED || c.getStatus() == ClaimStatus.HANDED_OVER);
        if (hasApprovedClaim) {
            throw new IllegalArgumentException("An ownership claim for this item has already been approved by campus facilities staff.");
        }

        // 3. Prevent duplicate active claims submitted by the same user for the same item
        Optional<ItemClaim> duplicateClaim = existingClaims.stream()
                .filter(c -> effectiveClaimantId.equalsIgnoreCase(c.getClaimantId()) &&
                        (c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.UNDER_REVIEW || c.getStatus() == ClaimStatus.APPROVED))
                .findFirst();
        if (duplicateClaim.isPresent()) {
            throw new IllegalArgumentException("You have already submitted an active ownership claim for this item (Claim Code: " + duplicateClaim.get().getClaimCode() + ").");
        }

        ItemClaim claim = new ItemClaim();
        String claimCode = "CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        claim.setClaimCode(claimCode);
        claim.setItem(item);
        claim.setItemTitle(request.getItemTitle() != null ? request.getItemTitle() : item.getItemName());
        claim.setClaimantId(effectiveClaimantId);
        claim.setClaimantName(request.getClaimantName() != null && !request.getClaimantName().isEmpty() ? request.getClaimantName() : effectiveClaimantId);
        claim.setClaimantEmail(request.getClaimantEmail());
        claim.setClaimantPhone(request.getClaimantPhone());
        claim.setOwnershipProof(request.getOwnershipProof());
        claim.setStatus(ClaimStatus.PENDING);
        claim.setAdminNotes(request.getAdminNotes());

        ItemClaim savedClaim = claimRepository.save(claim);

        // Update item status to CLAIM_PENDING if currently OPEN
        if (item.getStatus() == ItemStatus.OPEN) {
            item.setStatus(ItemStatus.CLAIM_PENDING);
            item.setUpdatedAt(LocalDateTime.now());
            itemRepository.save(item);
        }

        return ItemClaimResponse.fromEntity(savedClaim);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemClaimResponse> getMyClaims(String claimantId) {
        String activeUser = getAuthenticatedUsernameOrId();
        String targetId = (activeUser != null && !activeUser.isEmpty()) ? activeUser : claimantId;
        if (targetId == null || targetId.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return claimRepository.findByClaimantIdOrderBySubmittedAtDesc(targetId.trim()).stream()
                .map(ItemClaimResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemClaimResponse> getItemClaims(String itemIdentifier) {
        LostFoundItem item = findItemEntity(itemIdentifier);
        return claimRepository.findByItemId(item.getId()).stream()
                .map(ItemClaimResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemClaimResponse> getAllClaims(ClaimStatus status) {
        List<ItemClaim> list = (status != null)
                ? claimRepository.findByStatusOrderBySubmittedAtDesc(status)
                : claimRepository.findAll();
        return list.stream()
                .map(ItemClaimResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public ItemClaimResponse updateClaimStatus(String claimCode, StatusUpdateRequest request) {
        ItemClaim claim = findClaimEntity(claimCode);

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            ClaimStatus newStatus = ClaimStatus.valueOf(request.getStatus().trim().toUpperCase());

            // Workflow Separation Fix: Approval vs. Physical Handover Verification
            if (newStatus == ClaimStatus.APPROVED) {
                // Ensure no other claim for this item has ALREADY been approved or handed over
                List<ItemClaim> existingClaims = claimRepository.findByItemId(claim.getItem().getId());
                boolean alreadyApprovedOrHandedOver = existingClaims.stream()
                        .anyMatch(c -> !c.getId().equals(claim.getId()) &&
                                (c.getStatus() == ClaimStatus.APPROVED || c.getStatus() == ClaimStatus.HANDED_OVER));
                if (alreadyApprovedOrHandedOver) {
                    throw new IllegalArgumentException("Another ownership claim for this item has already been approved or handed over.");
                }

                claim.setStatus(ClaimStatus.APPROVED);
                claim.getItem().setStatus(ItemStatus.CLAIM_PENDING);
                claim.getItem().setUpdatedAt(LocalDateTime.now());
                itemRepository.save(claim.getItem());

                // Automatically reject all other pending / under review claims for the same item
                for (ItemClaim otherClaim : existingClaims) {
                    if (!otherClaim.getId().equals(claim.getId()) &&
                        (otherClaim.getStatus() == ClaimStatus.PENDING || otherClaim.getStatus() == ClaimStatus.UNDER_REVIEW)) {
                        otherClaim.setStatus(ClaimStatus.REJECTED);
                        otherClaim.setAdminNotes("Claim automatically rejected because another claim (" + claim.getClaimCode() + ") was approved by facilities staff.");
                        claimRepository.save(otherClaim);
                    }
                }
            } else if (newStatus == ClaimStatus.HANDED_OVER) {
                // Handover confirms physical verification and marks item as RETURNED
                claim.setStatus(ClaimStatus.HANDED_OVER);
                claim.setVerifiedAt(LocalDateTime.now());
                if (claim.getItem() != null) {
                    claim.getItem().setStatus(ItemStatus.RETURNED);
                    claim.getItem().setUpdatedAt(LocalDateTime.now());
                    itemRepository.save(claim.getItem());
                }
            } else if (newStatus == ClaimStatus.REJECTED) {
                claim.setStatus(ClaimStatus.REJECTED);
                // If rejected and no other pending or approved claims, revert item status back to OPEN
                if (claim.getItem() != null) {
                    List<ItemClaim> activeClaims = claimRepository.findByItemId(claim.getItem().getId()).stream()
                            .filter(c -> !c.getId().equals(claim.getId()) &&
                                    (c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.UNDER_REVIEW || c.getStatus() == ClaimStatus.APPROVED))
                            .collect(Collectors.toList());
                    if (activeClaims.isEmpty()) {
                        claim.getItem().setStatus(ItemStatus.OPEN);
                        claim.getItem().setUpdatedAt(LocalDateTime.now());
                        itemRepository.save(claim.getItem());
                    }
                }
            } else {
                claim.setStatus(newStatus);
            }
        }

        if (request.getAdminNotes() != null) {
            claim.setAdminNotes(request.getAdminNotes());
        }

        ItemClaim updated = claimRepository.save(claim);
        return ItemClaimResponse.fromEntity(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String userId) {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        stats.setTotalLost(itemRepository.countByType(ItemType.LOST));
        stats.setTotalFound(itemRepository.countByType(ItemType.FOUND));
        stats.setOpenLost(itemRepository.countByTypeAndStatus(ItemType.LOST, ItemStatus.OPEN));
        stats.setOpenFound(itemRepository.countByTypeAndStatus(ItemType.FOUND, ItemStatus.OPEN));
        stats.setActiveClaims(claimRepository.countByStatus(ClaimStatus.PENDING) + claimRepository.countByStatus(ClaimStatus.UNDER_REVIEW));
        stats.setReturnedItems(itemRepository.countByTypeAndStatus(ItemType.LOST, ItemStatus.RETURNED) +
                               itemRepository.countByTypeAndStatus(ItemType.FOUND, ItemStatus.RETURNED));

        return stats;
    }

    /**
     * Helper to extract authenticated username or ID from Spring Security context
     */
    private String getAuthenticatedUsernameOrId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }

    /**
     * Security Helper: Verifies whether current authenticated user is reporter or possesses ADMIN/STAFF authority
     */
    private void enforceItemOwnershipOrRole(LostFoundItem item, String actionName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return; // Permit guest operations if SecurityContext is unauthenticated in demo sandbox
        }

        boolean isStaffOrAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));

        if (isStaffOrAdmin) {
            return; // Staff & Admin have full institutional management rights
        }

        String username = auth.getName();
        boolean isOwner = username != null && (
                username.equalsIgnoreCase(item.getReporterId()) ||
                username.equalsIgnoreCase(item.getContactEmail())
        );

        if (!isOwner) {
            throw new IllegalArgumentException("Security Error: You are only authorized to " + actionName + " reports created by your account.");
        }
    }

    private LostFoundItem findItemEntity(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new NoSuchElementException("Item identifier cannot be empty");
        }
        try {
            Long id = Long.parseLong(identifier.trim());
            Optional<LostFoundItem> byId = itemRepository.findById(id);
            if (byId.isPresent()) return byId.get();
        } catch (NumberFormatException ignored) {}

        return itemRepository.findByItemCode(identifier.trim())
                .orElseThrow(() -> new NoSuchElementException("Lost/Found item not found: " + identifier));
    }

    private ItemClaim findClaimEntity(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new NoSuchElementException("Claim identifier cannot be empty");
        }
        try {
            Long id = Long.parseLong(identifier.trim());
            Optional<ItemClaim> byId = claimRepository.findById(id);
            if (byId.isPresent()) return byId.get();
        } catch (NumberFormatException ignored) {}

        return claimRepository.findByClaimCode(identifier.trim())
                .orElseThrow(() -> new NoSuchElementException("Item claim not found with code/ID: " + identifier));
    }

    private Set<String> extractKeywords(String text) {
        if (text == null || text.trim().isEmpty()) return Collections.emptySet();
        String[] words = text.toLowerCase().replaceAll("[^a-zA-Z0-9\\s]", "").split("\\s+");
        Set<String> result = new HashSet<>();
        Set<String> stopWords = Set.of("the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "is", "was", "with", "my", "lost", "found");
        for (String w : words) {
            if (w.length() > 2 && !stopWords.contains(w)) {
                result.add(w);
            }
        }
        return result;
    }
}
