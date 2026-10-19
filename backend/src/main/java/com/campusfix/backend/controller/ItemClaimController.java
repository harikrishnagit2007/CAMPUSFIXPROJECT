package com.campusfix.backend.controller;

import com.campusfix.backend.dto.ItemClaimRequest;
import com.campusfix.backend.dto.ItemClaimResponse;
import com.campusfix.backend.dto.StatusUpdateRequest;
import com.campusfix.backend.service.LostFoundService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/lost-found/claims", "/api/lost-found/claims"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
    RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS
})
public class ItemClaimController {

    private final LostFoundService lostFoundService;

    public ItemClaimController(LostFoundService lostFoundService) {
        this.lostFoundService = lostFoundService;
    }

    /**
     * POST /api/v1/lost-found/claims
     * Submit an ownership claim for a found item
     */
    @PostMapping
    public ResponseEntity<ItemClaimResponse> submitClaim(@Valid @RequestBody ItemClaimRequest request) {
        ItemClaimResponse response = lostFoundService.submitClaim(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/v1/lost-found/claims
     * Retrieve all claims (with optional status filter)
     */
    @GetMapping
    public ResponseEntity<List<ItemClaimResponse>> getAllClaims(
            @RequestParam(required = false) com.campusfix.backend.entity.enums.ClaimStatus status
    ) {
        return ResponseEntity.ok(lostFoundService.getAllClaims(status));
    }

    /**
     * GET /api/v1/lost-found/claims/my-claims
     * Retrieve all claims submitted by the current user
     */
    @GetMapping("/my-claims")
    public ResponseEntity<List<ItemClaimResponse>> getMyClaims(
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "claimantId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.trim().isEmpty()) ? headerUserId : paramUserId;
        return ResponseEntity.ok(lostFoundService.getMyClaims(userId));
    }

    /**
     * GET /api/v1/lost-found/claims/item/{itemIdentifier}
     * Retrieve claims submitted for a specific item
     */
    @GetMapping("/item/{itemIdentifier}")
    public ResponseEntity<List<ItemClaimResponse>> getItemClaims(@PathVariable String itemIdentifier) {
        return ResponseEntity.ok(lostFoundService.getItemClaims(itemIdentifier));
    }

    /**
     * PATCH /api/v1/lost-found/claims/{claimCode} and /status
     * Admin/Staff review of an ownership claim
     */
    @PatchMapping(path = {"/{claimCode}", "/{claimCode}/status"})
    public ResponseEntity<ItemClaimResponse> updateClaimStatus(
            @PathVariable String claimCode,
            @RequestBody StatusUpdateRequest request
    ) {
        return ResponseEntity.ok(lostFoundService.updateClaimStatus(claimCode, request));
    }
}
