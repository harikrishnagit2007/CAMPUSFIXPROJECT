package com.campusfix.backend.repository;

import com.campusfix.backend.entity.CampusLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampusLocationRepository extends JpaRepository<CampusLocation, String> {

    Optional<CampusLocation> findByQrCode(String qrCode);

    List<CampusLocation> findByBuilding(String building);

    List<CampusLocation> findAllByOrderByBuildingAscRoomAsc();
}
