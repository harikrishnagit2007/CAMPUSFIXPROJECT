package com.campusfix.backend.service;

import com.campusfix.backend.dto.StaffRequest;
import com.campusfix.backend.dto.StaffResponse;
import com.campusfix.backend.entity.Staff;
import com.campusfix.backend.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@Transactional
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;

    public StaffServiceImpl(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffResponse> getAllStaff(String department, String availability) {
        List<Staff> list;
        boolean hasDept = department != null && !department.trim().isEmpty() && !"All".equalsIgnoreCase(department);
        boolean hasAvail = availability != null && !availability.trim().isEmpty() && !"All".equalsIgnoreCase(availability);

        if (hasDept && hasAvail) {
            list = staffRepository.findByDepartmentAndAvailability(department.trim(), availability.trim());
        } else if (hasDept) {
            list = staffRepository.findByDepartment(department.trim());
        } else if (hasAvail) {
            list = staffRepository.findByAvailability(availability.trim());
        } else {
            list = staffRepository.findByActiveTrue();
        }

        return list.stream().map(StaffResponse::fromEntity).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public StaffResponse getStaffById(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Staff member not found with ID: " + id));
        return StaffResponse.fromEntity(staff);
    }

    @Override
    public StaffResponse createStaff(StaffRequest request) {
        if (staffRepository.findByEmail(request.getEmail().trim().toLowerCase()).isPresent()) {
            throw new IllegalArgumentException("Staff member with email " + request.getEmail() + " already exists");
        }

        Staff staff = new Staff();
        staff.setName(request.getName().trim());
        staff.setEmail(request.getEmail().trim().toLowerCase());
        staff.setPhone(request.getPhone());
        staff.setDepartment(request.getDepartment());
        staff.setSpecialization(request.getSpecialization());
        staff.setAvailability(request.getAvailability());
        staff.setActive(request.getActive());

        Staff saved = staffRepository.save(staff);
        return StaffResponse.fromEntity(saved);
    }

    @Override
    public StaffResponse updateStaff(Long id, StaffRequest request) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Staff member not found with ID: " + id));

        if (request.getName() != null) staff.setName(request.getName().trim());
        if (request.getEmail() != null) staff.setEmail(request.getEmail().trim().toLowerCase());
        if (request.getPhone() != null) staff.setPhone(request.getPhone());
        if (request.getDepartment() != null) staff.setDepartment(request.getDepartment());
        if (request.getSpecialization() != null) staff.setSpecialization(request.getSpecialization());
        if (request.getAvailability() != null) staff.setAvailability(request.getAvailability());
        if (request.getActive() != null) staff.setActive(request.getActive());

        staff.setUpdatedAt(LocalDateTime.now());
        Staff updated = staffRepository.save(staff);
        return StaffResponse.fromEntity(updated);
    }

    @Override
    public StaffResponse patchAvailability(Long id, String availability) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Staff member not found with ID: " + id));
        if (availability != null && !availability.trim().isEmpty()) {
            staff.setAvailability(availability.trim());
            staff.setUpdatedAt(LocalDateTime.now());
            staff = staffRepository.save(staff);
        }
        return StaffResponse.fromEntity(staff);
    }

    @Override
    public void deleteStaff(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Staff member not found with ID: " + id));
        staff.setActive(false);
        staffRepository.save(staff);
    }
}
