package com.campusfix.backend.service;

import com.campusfix.backend.entity.CampusLocation;
import com.campusfix.backend.repository.CampusLocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class CampusLocationService {

    private final CampusLocationRepository locationRepository;

    public CampusLocationService(CampusLocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public List<CampusLocation> getAllLocations() {
        return locationRepository.findAllByOrderByBuildingAscRoomAsc();
    }

    @Transactional(readOnly = true)
    public CampusLocation getLocationById(String id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Location not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public CampusLocation getLocationByQrCode(String qrCode) {
        return locationRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new NoSuchElementException("Location not found for QR code: " + qrCode));
    }

    public CampusLocation saveLocation(CampusLocation location) {
        return locationRepository.save(location);
    }

    public CampusLocation updateLocation(String id, CampusLocation updated) {
        CampusLocation existing = getLocationById(id);
        if (updated.getBuilding() != null) existing.setBuilding(updated.getBuilding());
        if (updated.getRoom() != null) existing.setRoom(updated.getRoom());
        if (updated.getFloor() != null) existing.setFloor(updated.getFloor());
        if (updated.getWing() != null) existing.setWing(updated.getWing());
        if (updated.getQrCode() != null) existing.setQrCode(updated.getQrCode());
        if (updated.getActiveComplaints() != null) existing.setActiveComplaints(updated.getActiveComplaints());
        return locationRepository.save(existing);
    }

    public void deleteLocation(String id) {
        if (!locationRepository.existsById(id)) {
            throw new NoSuchElementException("Location not found with id: " + id);
        }
        locationRepository.deleteById(id);
    }
}
