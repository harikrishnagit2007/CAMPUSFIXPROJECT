package com.campusfix.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "campus_locations")
public class CampusLocation {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @NotBlank(message = "Building is required")
    @Column(name = "building", nullable = false, length = 100)
    private String building;

    @NotBlank(message = "Room is required")
    @Column(name = "room", nullable = false, length = 60)
    private String room;

    @Column(name = "floor", length = 30)
    private String floor;

    @Column(name = "wing", length = 60)
    private String wing;

    @Column(name = "qr_code", unique = true, length = 120)
    private String qrCode;

    @Column(name = "active_complaints")
    private Integer activeComplaints = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public CampusLocation() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.activeComplaints == null) {
            this.activeComplaints = 0;
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getWing() {
        return wing;
    }

    public void setWing(String wing) {
        this.wing = wing;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public Integer getActiveComplaints() {
        return activeComplaints;
    }

    public void setActiveComplaints(Integer activeComplaints) {
        this.activeComplaints = activeComplaints;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
