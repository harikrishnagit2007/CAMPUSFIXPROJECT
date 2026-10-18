package com.campusfix.backend.repository;

import com.campusfix.backend.entity.LostFoundItem;
import com.campusfix.backend.entity.enums.ItemStatus;
import com.campusfix.backend.entity.enums.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LostFoundItemRepository extends JpaRepository<LostFoundItem, Long>, JpaSpecificationExecutor<LostFoundItem> {

    Optional<LostFoundItem> findByItemCode(String itemCode);

    List<LostFoundItem> findByTypeOrderByCreatedAtDesc(ItemType type);

    List<LostFoundItem> findByReporterIdOrderByCreatedAtDesc(String reporterId);

    List<LostFoundItem> findByTypeAndStatus(ItemType type, ItemStatus status);

    List<LostFoundItem> findByCategory(String category);

    List<LostFoundItem> findByBuilding(String building);

    long countByType(ItemType type);

    long countByTypeAndStatus(ItemType type, ItemStatus status);

    @Query("SELECT i FROM LostFoundItem i WHERE " +
           "(:type IS NULL OR i.type = :type) AND " +
           "(:category IS NULL OR LOWER(i.category) = LOWER(:category)) AND " +
           "(:building IS NULL OR LOWER(i.building) = LOWER(:building)) AND " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:searchTerm IS NULL OR LOWER(i.itemName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " LOWER(i.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " LOWER(i.location) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY i.createdAt DESC")
    List<LostFoundItem> searchItems(
        @Param("type") ItemType type,
        @Param("category") String category,
        @Param("building") String building,
        @Param("status") ItemStatus status,
        @Param("searchTerm") String searchTerm
    );

    /**
     * Find candidate items of opposite type for matching
     * e.g. For a LOST item, search FOUND items that match category or building or keywords
     */
    @Query("SELECT i FROM LostFoundItem i WHERE i.type = :targetType AND i.status != 'RETURNED' AND i.status != 'CLOSED' AND " +
           "(:category IS NULL OR LOWER(i.category) = LOWER(:category) OR " +
           " :building IS NULL OR LOWER(i.building) = LOWER(:building)) " +
           "ORDER BY i.createdAt DESC")
    List<LostFoundItem> findCandidateMatches(
        @Param("targetType") ItemType targetType,
        @Param("category") String category,
        @Param("building") String building
    );

    void deleteByItemCode(String itemCode);
}
