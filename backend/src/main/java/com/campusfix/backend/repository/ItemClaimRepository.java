package com.campusfix.backend.repository;

import com.campusfix.backend.entity.ItemClaim;
import com.campusfix.backend.entity.enums.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemClaimRepository extends JpaRepository<ItemClaim, Long> {

    Optional<ItemClaim> findByClaimCode(String claimCode);

    List<ItemClaim> findByClaimantIdOrderBySubmittedAtDesc(String claimantId);

    @Query("SELECT c FROM ItemClaim c WHERE c.item.id = :itemId ORDER BY c.submittedAt DESC")
    List<ItemClaim> findByItemId(@Param("itemId") Long itemId);

    List<ItemClaim> findByStatusOrderBySubmittedAtDesc(ClaimStatus status);

    long countByStatus(ClaimStatus status);

    void deleteByClaimCode(String claimCode);
}
