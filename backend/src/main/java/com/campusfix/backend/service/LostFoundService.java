package com.campusfix.backend.service;

import com.campusfix.backend.dto.*;
import com.campusfix.backend.entity.enums.ItemStatus;
import com.campusfix.backend.entity.enums.ItemType;

import java.util.List;

public interface LostFoundService {

    List<LostFoundItemResponse> getAllItems(ItemType type, String category, String building, ItemStatus status, String search);

    List<LostFoundItemResponse> getMyReports(String reporterId);

    LostFoundItemResponse getItemByIdOrCode(String identifier);

    LostFoundItemResponse reportItem(LostFoundItemRequest request);

    LostFoundItemResponse updateItem(String identifier, LostFoundItemRequest request);

    LostFoundItemResponse patchItemStatus(String identifier, StatusUpdateRequest request);

    void deleteItem(String identifier);

    List<PotentialMatchResult> findMatches(String itemIdentifier);

    ItemClaimResponse submitClaim(ItemClaimRequest request);

    List<ItemClaimResponse> getMyClaims(String claimantId);

    List<ItemClaimResponse> getItemClaims(String itemIdentifier);

    List<ItemClaimResponse> getAllClaims(ClaimStatus status);

    ItemClaimResponse updateClaimStatus(String claimCode, StatusUpdateRequest request);

    DashboardStatsResponse getDashboardStats(String userId);
}
