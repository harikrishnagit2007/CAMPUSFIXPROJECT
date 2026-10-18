package com.campusfix.backend.service;

import com.campusfix.backend.dto.ComplaintRequest;
import com.campusfix.backend.dto.ComplaintResponse;
import com.campusfix.backend.dto.StatusUpdateRequest;

import java.util.List;
import java.util.Map;

public interface ComplaintService {

    List<ComplaintResponse> getAllComplaints(String status, String category, String priority, String building);

    List<ComplaintResponse> getActiveComplaints();

    ComplaintResponse getComplaintByIdOrCode(String identifier);

    ComplaintResponse createComplaint(ComplaintRequest request);

    ComplaintResponse updateComplaint(String identifier, ComplaintRequest request);

    ComplaintResponse patchComplaintStatus(String identifier, StatusUpdateRequest request);

    void deleteComplaint(String identifier);

    Map<String, Object> getComplaintStats();
}
