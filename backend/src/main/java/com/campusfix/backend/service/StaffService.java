package com.campusfix.backend.service;

import com.campusfix.backend.dto.StaffRequest;
import com.campusfix.backend.dto.StaffResponse;

import java.util.List;

public interface StaffService {

    List<StaffResponse> getAllStaff(String department, String availability);

    StaffResponse getStaffById(Long id);

    StaffResponse createStaff(StaffRequest request);

    StaffResponse updateStaff(Long id, StaffRequest request);

    StaffResponse patchAvailability(Long id, String availability);

    void deleteStaff(Long id);
}
