package com.campusfix.backend.controller;

import com.campusfix.backend.dto.ComplaintRequest;
import com.campusfix.backend.dto.ComplaintResponse;
import com.campusfix.backend.dto.StatusUpdateRequest;
import com.campusfix.backend.service.ComplaintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Spring Boot REST Controller for Campus Maintenance Complaints.
 * Maps endpoints for listing, creating, retrieving, updating, assigning,
 * and analyzing maintenance issue tickets.
 */
@RestController
@RequestMapping({"/api/v1/complaints", "/api/complaints"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
    RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS
})
@Tag(name = "Maintenance Complaints", description = "Endpoints for managing campus maintenance complaints and tickets")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    /**
     * GET /api/v1/complaints
     * Retrieve all maintenance complaint tickets with optional filtering
     */
    @Operation(summary = "List all complaints", description = "Retrieve complaints with optional filtering by status, category, priority, or building.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Complaints successfully retrieved")
    })
    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(
            @Parameter(description = "Filter by status (e.g. Submitted, In Progress, Resolved)")
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by category (e.g. Electrical, Plumbing, Cleaning)")
            @RequestParam(required = false) String category,
            @Parameter(description = "Filter by priority (e.g. Low, Medium, High, Critical)")
            @RequestParam(required = false) String priority,
            @Parameter(description = "Filter by campus building or block")
            @RequestParam(required = false) String building
    ) {
        List<ComplaintResponse> list = complaintService.getAllComplaints(status, category, priority, building);
        return ResponseEntity.ok(list);
    }

    /**
     * GET /api/v1/complaints/active
     * Retrieve only active / unresolved complaints
     */
    @Operation(summary = "Get active complaints", description = "Retrieve all open complaints that have not been resolved or closed.")
    @GetMapping("/active")
    public ResponseEntity<List<ComplaintResponse>> getActiveComplaints() {
        return ResponseEntity.ok(complaintService.getActiveComplaints());
    }

    /**
     * GET /api/v1/complaints/{identifier}
     * Retrieve single complaint by numeric ID or business code (e.g. CMP-12345678)
     */
    @Operation(summary = "Get complaint by ID or Code", description = "Retrieve an individual maintenance ticket using its numeric ID or unique complaint code.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Complaint found and returned"),
        @ApiResponse(responseCode = "404", description = "Complaint ticket not found")
    })
    @GetMapping("/{identifier}")
    public ResponseEntity<ComplaintResponse> getComplaint(
            @Parameter(description = "Complaint numeric database ID or code (e.g., CMP-7A2B9C)")
            @PathVariable String identifier
    ) {
        return ResponseEntity.ok(complaintService.getComplaintByIdOrCode(identifier));
    }

    /**
     * POST /api/v1/complaints
     * Submit a new maintenance issue ticket
     */
    @Operation(summary = "Create a new maintenance complaint", description = "Submit a new maintenance request with title, category, location, and description.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Complaint successfully created"),
        @ApiResponse(responseCode = "400", description = "Invalid request payload or missing required fields")
    })
    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(@Valid @RequestBody ComplaintRequest request) {
        ComplaintResponse created = complaintService.createComplaint(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/complaints/{identifier}
     * Full update of a complaint ticket
     */
    @Operation(summary = "Update complaint details", description = "Update all editable fields of an existing maintenance complaint.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Complaint successfully updated"),
        @ApiResponse(responseCode = "404", description = "Complaint ticket not found")
    })
    @PutMapping("/{identifier}")
    public ResponseEntity<ComplaintResponse> updateComplaint(
            @PathVariable String identifier,
            @Valid @RequestBody ComplaintRequest request
    ) {
        return ResponseEntity.ok(complaintService.updateComplaint(identifier, request));
    }

    /**
     * PATCH /api/v1/complaints/{identifier}
     * Partially update complaint status or staff assignment
     */
    @Operation(summary = "Patch complaint status or assignment", description = "Update complaint status (e.g. In Progress, Resolved) or assigned staff.")
    @PatchMapping("/{identifier}")
    public ResponseEntity<ComplaintResponse> patchComplaintStatus(
            @PathVariable String identifier,
            @RequestBody StatusUpdateRequest request
    ) {
        return ResponseEntity.ok(complaintService.patchComplaintStatus(identifier, request));
    }

    /**
     * PATCH /api/v1/complaints/{identifier}/assign
     * Assign complaint to maintenance staff
     */
    @Operation(summary = "Assign staff member", description = "Assigns an authorized maintenance staff member and automatically updates ticket status to Assigned.")
    @PatchMapping("/{identifier}/assign")
    public ResponseEntity<ComplaintResponse> assignStaff(
            @PathVariable String identifier,
            @RequestBody Map<String, String> payload
    ) {
        String staffId = payload.get("staffId");
        if (staffId == null || staffId.trim().isEmpty()) {
            staffId = payload.get("assignedStaffId");
        }
        return ResponseEntity.ok(complaintService.assignStaff(identifier, staffId));
    }

    /**
     * DELETE /api/v1/complaints/{identifier}
     * Delete or cancel a complaint record
     */
    @Operation(summary = "Delete complaint", description = "Deletes a complaint ticket from the system.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Complaint successfully deleted"),
        @ApiResponse(responseCode = "404", description = "Complaint not found")
    })
    @DeleteMapping("/{identifier}")
    public ResponseEntity<Map<String, Object>> deleteComplaint(@PathVariable String identifier) {
        complaintService.deleteComplaint(identifier);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Complaint ticket successfully deleted: " + identifier
        ));
    }

    /**
     * GET /api/v1/complaints/stats
     * Aggregated statistics for dashboards
     */
    @Operation(summary = "Get complaint statistics", description = "Returns total, submitted, in-progress, and resolved metrics, plus category breakdowns.")
    @GetMapping(path = {"/stats", "/analytics"})
    public ResponseEntity<Map<String, Object>> getComplaintStats() {
        return ResponseEntity.ok(complaintService.getComplaintStats());
    }

    /**
     * GET /api/v1/complaints/emergency-alerts
     * Critical/Emergency safety hazard alerts
     */
    @Operation(summary = "Get emergency alerts", description = "Returns active complaints flagged as Critical or High priority safety hazards.")
    @GetMapping("/emergency-alerts")
    public ResponseEntity<List<ComplaintResponse>> getEmergencyAlerts() {
        return ResponseEntity.ok(complaintService.getEmergencyAlerts());
    }

    /**
     * POST /api/v1/complaints/check-duplicate
     * Duplicate detection endpoint
     */
    @Operation(summary = "Check for duplicate complaints", description = "Evaluates title, category, and location against open tickets to detect duplicates.")
    @PostMapping("/check-duplicate")
    public ResponseEntity<List<ComplaintResponse>> checkDuplicates(@RequestBody Map<String, String> payload) {
        String title = payload.get("title");
        String category = payload.get("category");
        String location = payload.get("location");
        return ResponseEntity.ok(complaintService.checkDuplicates(title, category, location));
    }

    /**
     * POST /api/v1/complaints/suggest-priority
     * Rule-based priority triage suggestion
     */
    @Operation(summary = "Suggest priority", description = "Rule-based priority suggestion based on complaint keywords, hazard severity, and category.")
    @PostMapping("/suggest-priority")
    public ResponseEntity<Map<String, String>> suggestPriority(@RequestBody Map<String, String> payload) {
        String title = payload.get("title");
        String description = payload.get("description");
        String category = payload.get("category");
        return ResponseEntity.ok(complaintService.suggestPriority(title, description, category));
    }
}
