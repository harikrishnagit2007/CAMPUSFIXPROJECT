package com.campusfix.backend.repository;

import com.campusfix.backend.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByEmail(String email);

    List<Staff> findByDepartment(String department);

    List<Staff> findByAvailability(String availability);

    List<Staff> findByActiveTrue();

    List<Staff> findByDepartmentAndAvailability(String department, String availability);
}
