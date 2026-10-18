package com.campusfix.backend.repository;

import com.campusfix.backend.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {

    Optional<Complaint> findByComplaintId(String complaintId);

    List<Complaint> findByStatus(String status);

    List<Complaint> findByStatusIn(List<String> statuses);

    List<Complaint> findByCategory(String category);

    List<Complaint> findByBuilding(String building);

    List<Complaint> findByStudentEmail(String studentEmail);

    List<Complaint> findByAssignedStaffId(String assignedStaffId);

    long countByStatus(String status);

    long countByCategory(String category);

    @Query("SELECT c FROM Complaint c WHERE c.status NOT IN ('Resolved', 'Closed') ORDER BY c.createdAt DESC")
    List<Complaint> findActiveComplaints();

    @Query("SELECT c FROM Complaint c WHERE " +
           "(:status IS NULL OR LOWER(c.status) = LOWER(:status)) AND " +
           "(:category IS NULL OR LOWER(c.category) = LOWER(:category)) AND " +
           "(:priority IS NULL OR LOWER(c.priority) = LOWER(:priority)) AND " +
           "(:building IS NULL OR LOWER(c.building) = LOWER(:building)) " +
           "ORDER BY c.createdAt DESC")
    List<Complaint> filterComplaints(
        @Param("status") String status,
        @Param("category") String category,
        @Param("priority") String priority,
        @Param("building") String building
    );

    void deleteByComplaintId(String complaintId);
}
