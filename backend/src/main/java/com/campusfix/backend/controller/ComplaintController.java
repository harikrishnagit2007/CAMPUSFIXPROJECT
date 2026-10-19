package com.campusfix.backend.controller;

import com.campusfix.backend.dto.ComplaintRequest;
import com.campusfix.backend.dto.ComplaintResponse;
import com.campusfix.backend.dto.StatusUpdateRequest;
import com.campusfix.backend.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/complaints", "/api/complaints"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
    RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS
})
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    /**
     * GET /api/v1/complaints
     * Retrieve all maintenance complaint tickets with optional filtering
     */
    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String building
    ) {
        List<ComplaintResponse> list = complaintService.getAllComplaints(status, category, priority, building);
        return ResponseEntity.ok(list);
    }

    /**
     * GET /api/v1/complaints/active
     * Retrieve only active/unresolved complaints
     */
    @GetMapping("/active")
    public ResponseEntity<List<ComplaintResponse>> getActiveComplaints() {
        return ResponseEntity.ok(complaintService.getActiveComplaints());
    }

    /**
     * GET /api/v1/complaints/{identifier}
     * Retrieve single complaint by numeric ID or complaint code (e.g. CMP-12345678)
     */
    @GetMapping("/{identifier}")
    public ResponseEntity<ComplaintResponse> getComplaint(@PathVariable String identifier) {
        return ResponseEntity.ok(complaintService.getComplaintByIdOrCode(identifier));
    }

    /**
     * POST /api/v1/complaints
     * Submit a new maintenance issue ticket
     */
    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(@Valid @RequestBody ComplaintRequest request) {
        ComplaintResponse created = complaintService.createComplaint(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/complaints/{identifier}
     * Full update of a complaint ticket
     */
    @PutMapping("/{identifier}")
    public ResponseEntity<ComplaintResponse> updateComplaint(
            @PathVariable String identifier,
            @Valid @RequestBody ComplaintRequest request
    ) {
        return ResponseEntity.ok(complaintService.updateComplaint(identifier, request));
    }

    /**
     * PATCH /api/v1/complaints/{identifier}
     * Update complaint status or assignment
     */
    @PatchMapping("/{identifier}")
    public ResponseEntity<ComplaintResponse> patchComplaintStatus(
            @PathVariable String identifier,
            @RequestBody StatusUpdateRequest request
    ) {
        return ResponseEntity.ok(complaintService.patchComplaintStatus(identifier, request));
    }

    /**
     * DELETE /api/v1/complaints/{identifier}
     * Delete a complaint record
     */
    @DeleteMapping("/{identifier}")
    public ResponseEntity<Map<String, Object>> deleteComplaint(@PathVariable String identifier) {
        complaintService.deleteComplaint(identifier);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Complaint ticket successfully deleted: " + identifier
        ));
    }

    /**
     * GET /api/v1/complaints/stats and /api/v1/complaints/analytics
     * Aggregated statistics for dashboards
     */
    @GetMapping(path = {"/stats", "/analytics"})
    public ResponseEntity<Map<String, Object>> getComplaintStats() {
        return ResponseEntity.ok(complaintService.getComplaintStats());
    }

    /**
     * GET /api/v1/complaints/emergency-alerts
     * Critical/Emergency safety hazard alerts
     */
    @GetMapping("/emergency-alerts")
    public ResponseEntity<List<ComplaintResponse>> getEmergencyAlerts() {
        return ResponseEntity.ok(complaintService.getEmergencyAlerts());
    }
}
