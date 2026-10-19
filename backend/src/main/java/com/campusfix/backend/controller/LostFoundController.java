package com.campusfix.backend.controller;

import com.campusfix.backend.dto.*;
import com.campusfix.backend.entity.enums.ItemStatus;
import com.campusfix.backend.entity.enums.ItemType;
import com.campusfix.backend.service.LostFoundService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/lost-found", "/api/lost-found"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
    RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS
})
public class LostFoundController {

    private final LostFoundService lostFoundService;

    public LostFoundController(LostFoundService lostFoundService) {
        this.lostFoundService = lostFoundService;
    }

    /**
     * GET /api/v1/lost-found/items
     * Retrieve items with optional filters
     */
    @GetMapping("/items")
    public ResponseEntity<List<LostFoundItemResponse>> getItems(
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(lostFoundService.getAllItems(type, category, building, status, search));
    }

    /**
     * GET /api/v1/lost-found/items/{identifier}
     * Retrieve single lost or found item
     */
    @GetMapping("/items/{identifier}")
    public ResponseEntity<LostFoundItemResponse> getItem(@PathVariable String identifier) {
        return ResponseEntity.ok(lostFoundService.getItemByIdOrCode(identifier));
    }

    /**
     * POST /api/v1/lost-found/report
     * Register a new LOST or FOUND item
     */
    @PostMapping(path = {"/report", "/items"})
    public ResponseEntity<LostFoundItemResponse> reportItem(@Valid @RequestBody LostFoundItemRequest request) {
        LostFoundItemResponse response = lostFoundService.reportItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/v1/lost-found/items/{identifier}
     * Update an existing report
     */
    @PutMapping("/items/{identifier}")
    public ResponseEntity<LostFoundItemResponse> updateItem(
            @PathVariable String identifier,
            @Valid @RequestBody LostFoundItemRequest request
    ) {
        return ResponseEntity.ok(lostFoundService.updateItem(identifier, request));
    }

    /**
     * PATCH /api/v1/lost-found/items/{identifier} and /status
     * Update status (e.g. RETURNED, CLOSED)
     */
    @PatchMapping(path = {"/items/{identifier}", "/items/{identifier}/status"})
    public ResponseEntity<LostFoundItemResponse> patchItemStatus(
            @PathVariable String identifier,
            @RequestBody StatusUpdateRequest request
    ) {
        return ResponseEntity.ok(lostFoundService.patchItemStatus(identifier, request));
    }

    /**
     * DELETE /api/v1/lost-found/items/{identifier}
     * Delete an item
     */
    @DeleteMapping("/items/{identifier}")
    public ResponseEntity<Map<String, Object>> deleteItem(@PathVariable String identifier) {
        lostFoundService.deleteItem(identifier);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Item report deleted successfully: " + identifier
        ));
    }

    /**
     * GET /api/v1/lost-found/my-reports
     * Retrieve items reported by current user
     */
    @GetMapping("/my-reports")
    public ResponseEntity<List<LostFoundItemResponse>> getMyReports(
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @RequestParam(value = "userId", required = false) String paramUserId
    ) {
        String userId = (headerUserId != null && !headerUserId.trim().isEmpty()) ? headerUserId : paramUserId;
        return ResponseEntity.ok(lostFoundService.getMyReports(userId));
    }

    /**
     * GET /api/v1/lost-found/items/{identifier}/matches
     * Find potential matches between LOST and FOUND items using smart comparison
     */
    @GetMapping(path = {"/items/{identifier}/matches", "/matches/{identifier}"})
    public ResponseEntity<List<PotentialMatchResult>> getMatches(@PathVariable String identifier) {
        return ResponseEntity.ok(lostFoundService.findMatches(identifier));
    }

    /**
     * GET /api/v1/lost-found/stats
     * Dashboard statistics for Lost & Found
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats(
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return ResponseEntity.ok(lostFoundService.getDashboardStats(userId));
    }
}
