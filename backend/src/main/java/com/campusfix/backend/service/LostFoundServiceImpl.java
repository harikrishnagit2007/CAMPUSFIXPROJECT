package com.campusfix.backend.service;

import com.campusfix.backend.dto.*;
import com.campusfix.backend.entity.ItemClaim;
import com.campusfix.backend.entity.LostFoundItem;
import com.campusfix.backend.entity.enums.ClaimStatus;
import com.campusfix.backend.entity.enums.ItemStatus;
import com.campusfix.backend.entity.enums.ItemType;
import com.campusfix.backend.repository.ItemClaimRepository;
import com.campusfix.backend.repository.LostFoundItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
        if (reporterId == null || reporterId.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return itemRepository.findByReporterIdOrderByCreatedAtDesc(reporterId.trim()).stream()
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
        item.setReporterId(request.getReporterId());
        item.setReporterName(request.getReporterName());
        item.setReporterRole(request.getReporterRole() != null ? request.getReporterRole() : "STUDENT");
        item.setContactEmail(request.getContactEmail());
        item.setContactPhone(request.getContactPhone());

        LostFoundItem saved = itemRepository.save(item);
        return LostFoundItemResponse.fromEntity(saved);
    }

    @Override
    public LostFoundItemResponse updateItem(String identifier, LostFoundItemRequest request) {
        LostFoundItem item = findItemEntity(identifier);

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

        ItemClaim claim = new ItemClaim();
        String claimCode = "CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        claim.setClaimCode(claimCode);
        claim.setItem(item);
        claim.setItemTitle(request.getItemTitle() != null ? request.getItemTitle() : item.getItemName());
        claim.setClaimantId(request.getClaimantId());
        claim.setClaimantName(request.getClaimantName());
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
        if (claimantId == null || claimantId.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return claimRepository.findByClaimantIdOrderBySubmittedAtDesc(claimantId.trim()).stream()
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
    public ItemClaimResponse updateClaimStatus(String claimCode, StatusUpdateRequest request) {
        ItemClaim claim = claimRepository.findByClaimCode(claimCode)
                .orElseThrow(() -> new NoSuchElementException("Claim not found with code: " + claimCode));

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            ClaimStatus newStatus = ClaimStatus.valueOf(request.getStatus().trim().toUpperCase());
            claim.setStatus(newStatus);

            if (newStatus == ClaimStatus.APPROVED || newStatus == ClaimStatus.HANDED_OVER) {
                claim.setVerifiedAt(LocalDateTime.now());
                if (claim.getItem() != null) {
                    claim.getItem().setStatus(ItemStatus.RETURNED);
                    claim.getItem().setUpdatedAt(LocalDateTime.now());
                    itemRepository.save(claim.getItem());
                }
            } else if (newStatus == ClaimStatus.REJECTED) {
                // If rejected and no other pending claims, revert item status to OPEN
                if (claim.getItem() != null) {
                    List<ItemClaim> activeClaims = claimRepository.findByItemId(claim.getItem().getId()).stream()
                            .filter(c -> c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.UNDER_REVIEW)
                            .collect(Collectors.toList());
                    if (activeClaims.isEmpty()) {
                        claim.getItem().setStatus(ItemStatus.OPEN);
                        claim.getItem().setUpdatedAt(LocalDateTime.now());
                        itemRepository.save(claim.getItem());
                    }
                }
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
