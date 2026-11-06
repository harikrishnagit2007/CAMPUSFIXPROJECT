package com.campusfix.backend.repository;

import com.campusfix.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByOrderByCreatedAtDesc();

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId OR n.targetRole = :role OR (n.userId IS NULL AND n.targetRole IS NULL) ORDER BY n.createdAt DESC")
    List<Notification> findForUserOrRole(@Param("userId") Long userId, @Param("role") String role);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.isRead = false")
    void markAllAsRead();

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE (n.userId = :userId OR n.targetRole = :role) AND n.isRead = false")
    void markAllAsReadForUser(@Param("userId") Long userId, @Param("role") String role);
}
