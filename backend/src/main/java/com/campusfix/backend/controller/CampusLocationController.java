package com.campusfix.backend.controller;

import com.campusfix.backend.entity.CampusLocation;
import com.campusfix.backend.service.CampusLocationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/locations", "/api/locations"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
    RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS
})
public class CampusLocationController {

    private final CampusLocationService locationService;

    public CampusLocationController(CampusLocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    public ResponseEntity<List<CampusLocation>> getAllLocations() {
        return ResponseEntity.ok(locationService.getAllLocations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampusLocation> getLocationById(@PathVariable String id) {
        return ResponseEntity.ok(locationService.getLocationById(id));
    }

    @GetMapping("/qr/{qrCode}")
    public ResponseEntity<CampusLocation> getLocationByQrCode(@PathVariable String qrCode) {
        return ResponseEntity.ok(locationService.getLocationByQrCode(qrCode));
    }

    @PostMapping
    public ResponseEntity<CampusLocation> createLocation(@RequestBody CampusLocation location) {
        CampusLocation saved = locationService.saveLocation(location);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampusLocation> updateLocation(@PathVariable String id, @RequestBody CampusLocation location) {
        return ResponseEntity.ok(locationService.updateLocation(id, location));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, Object>> deleteLocation(@PathVariable String id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Location deleted successfully: " + id));
    }
}
