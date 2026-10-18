package com.campusfix.backend.service;

import com.campusfix.backend.dto.ComplaintRequest;
import com.campusfix.backend.dto.ComplaintResponse;
import com.campusfix.backend.dto.StatusUpdateRequest;
import com.campusfix.backend.entity.Complaint;
import com.campusfix.backend.repository.ComplaintRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getAllComplaints(String status, String category, String priority, String building) {
        boolean hasFilter = (status != null && !status.trim().isEmpty()) ||
                           (category != null && !category.trim().isEmpty()) ||
                           (priority != null && !priority.trim().isEmpty()) ||
                           (building != null && !building.trim().isEmpty());

        List<Complaint> complaints;
        if (hasFilter) {
            complaints = complaintRepository.filterComplaints(
                (status != null && !status.trim().isEmpty()) ? status.trim() : null,
                (category != null && !category.trim().isEmpty()) ? category.trim() : null,
                (priority != null && !priority.trim().isEmpty()) ? priority.trim() : null,
                (building != null && !building.trim().isEmpty()) ? building.trim() : null
            );
        } else {
            complaints = complaintRepository.findAll();
            complaints.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        }

        return complaints.stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getActiveComplaints() {
        return complaintRepository.findActiveComplaints().stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintByIdOrCode(String identifier) {
        Complaint complaint = findEntity(identifier);
        return ComplaintResponse.fromEntity(complaint);
    }

    @Override
    public ComplaintResponse createComplaint(ComplaintRequest request) {
        Complaint complaint = new Complaint();
        String generatedCode = "CMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        complaint.setComplaintId(generatedCode);
        complaint.setComplaintTitle(request.getComplaintTitle());
        complaint.setCategory(request.getCategory());
        complaint.setBuilding(request.getBuilding());
        complaint.setRoom(request.getRoom());
        complaint.setLocation(request.getLocation());
        complaint.setDescription(request.getDescription());
        complaint.setPriority(request.getPriority());
        complaint.setStatus(request.getStatus());
        complaint.setImage(request.getImage());
        complaint.setStudentName(request.getStudentName());
        complaint.setStudentEmail(request.getStudentEmail());
        complaint.setStudentPhone(request.getStudentPhone());
        complaint.setAssignedStaffId(request.getAssignedStaffId());

        Complaint saved = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(saved);
    }

    @Override
    public ComplaintResponse updateComplaint(String identifier, ComplaintRequest request) {
        Complaint complaint = findEntity(identifier);

        if (request.getComplaintTitle() != null) complaint.setComplaintTitle(request.getComplaintTitle());
        if (request.getCategory() != null) complaint.setCategory(request.getCategory());
        if (request.getBuilding() != null) complaint.setBuilding(request.getBuilding());
        if (request.getRoom() != null) complaint.setRoom(request.getRoom());
        if (request.getLocation() != null) complaint.setLocation(request.getLocation());
        if (request.getDescription() != null) complaint.setDescription(request.getDescription());
        if (request.getPriority() != null) complaint.setPriority(request.getPriority());
        if (request.getStatus() != null) complaint.setStatus(request.getStatus());
        if (request.getImage() != null) complaint.setImage(request.getImage());
        if (request.getStudentName() != null) complaint.setStudentName(request.getStudentName());
        if (request.getStudentEmail() != null) complaint.setStudentEmail(request.getStudentEmail());
        if (request.getStudentPhone() != null) complaint.setStudentPhone(request.getStudentPhone());
        if (request.getAssignedStaffId() != null) complaint.setAssignedStaffId(request.getAssignedStaffId());

        complaint.setUpdatedAt(LocalDateTime.now());
        Complaint updated = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(updated);
    }

    @Override
    public ComplaintResponse patchComplaintStatus(String identifier, StatusUpdateRequest request) {
        Complaint complaint = findEntity(identifier);

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            complaint.setStatus(request.getStatus().trim());
        }
        if (request.getAssignedStaffId() != null) {
            complaint.setAssignedStaffId(request.getAssignedStaffId());
        }

        complaint.setUpdatedAt(LocalDateTime.now());
        Complaint updated = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(updated);
    }

    @Override
    public void deleteComplaint(String identifier) {
        Complaint complaint = findEntity(identifier);
        complaintRepository.delete(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getComplaintStats() {
        List<Complaint> all = complaintRepository.findAll();
        long total = all.size();
        long submitted = all.stream().filter(c -> "Submitted".equalsIgnoreCase(c.getStatus())).count();
        long inProgress = all.stream().filter(c -> "In Progress".equalsIgnoreCase(c.getStatus()) || "Assigned".equalsIgnoreCase(c.getStatus())).count();
        long resolved = all.stream().filter(c -> "Resolved".equalsIgnoreCase(c.getStatus()) || "Closed".equalsIgnoreCase(c.getStatus())).count();

        Map<String, Long> categoryCount = all.stream()
                .collect(Collectors.groupingBy(Complaint::getCategory, Collectors.counting()));

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("submitted", submitted);
        stats.put("inProgress", inProgress);
        stats.put("resolved", resolved);
        stats.put("categories", categoryCount);

        return stats;
    }

    private Complaint findEntity(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new NoSuchElementException("Complaint identifier cannot be empty");
        }
        // Try finding by database ID first if numeric
        try {
            Long id = Long.parseLong(identifier.trim());
            Optional<Complaint> byId = complaintRepository.findById(id);
            if (byId.isPresent()) return byId.get();
        } catch (NumberFormatException ignored) {}

        // Then by business complaintId code (e.g. CMP-A1B2C3D4)
        return complaintRepository.findByComplaintId(identifier.trim())
                .orElseThrow(() -> new NoSuchElementException("Complaint ticket not found: " + identifier));
    }
}
