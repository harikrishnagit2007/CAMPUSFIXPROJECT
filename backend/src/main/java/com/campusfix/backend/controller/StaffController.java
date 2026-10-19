package com.campusfix.backend.controller;

import com.campusfix.backend.dto.StaffRequest;
import com.campusfix.backend.dto.StaffResponse;
import com.campusfix.backend.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/staff", "/api/staff"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
    RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS
})
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public ResponseEntity<List<StaffResponse>> getAllStaff(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String availability
    ) {
        return ResponseEntity.ok(staffService.getAllStaff(department, availability));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffResponse> getStaffById(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.getStaffById(id));
    }

    @PostMapping
    public ResponseEntity<StaffResponse> createStaff(@Valid @RequestBody StaffRequest request) {
        StaffResponse created = staffService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StaffResponse> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody StaffRequest request
    ) {
        return ResponseEntity.ok(staffService.updateStaff(id, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<StaffResponse> patchStaff(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String availability = body.get("availability");
        return ResponseEntity.ok(staffService.patchAvailability(id, availability));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Staff member deactivated: " + id));
    }
}
