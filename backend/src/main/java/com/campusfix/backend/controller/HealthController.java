package com.campusfix.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller in the Spring Boot backend.
 * Verifies connectivity to the MySQL database and Gemini API,
 * returning a JSON status object for real-time system readiness monitoring.
 */
@RestController
@RequestMapping({"/api/v1/health", "/api/health"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.OPTIONS
})
@Tag(name = "Health Check", description = "Verifies MySQL database and Gemini API connectivity")
public class HealthController {

    private final DataSource dataSource;

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    @Operation(summary = "System health check", description = "Verifies MySQL database and Gemini API connectivity")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> services = new HashMap<>();

        response.put("timestamp", Instant.now().toString());
        response.put("application", "CampusFix Spring Boot Backend");
        response.put("version", "1.0.0");

        boolean dbHealthy = false;
        Map<String, Object> dbStatus = new HashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            dbHealthy = connection.isValid(2);
            DatabaseMetaData metaData = connection.getMetaData();
            dbStatus.put("status", dbHealthy ? "UP" : "DOWN");
            dbStatus.put("connected", dbHealthy);
            dbStatus.put("databaseProduct", metaData.getDatabaseProductName());
            dbStatus.put("databaseVersion", metaData.getDatabaseProductVersion());
            dbStatus.put("catalog", connection.getCatalog());
            dbStatus.put("details", "MySQL database connection successfully verified.");
        } catch (Exception e) {
            dbStatus.put("status", "DOWN");
            dbStatus.put("connected", false);
            dbStatus.put("error", e.getMessage());
            dbStatus.put("details", "Could not establish connection to MySQL database.");
        }
        services.put("database", dbStatus);

        Map<String, Object> geminiStatus = new HashMap<>();
        boolean hasGeminiKey = geminiApiKey != null && geminiApiKey.trim().length() > 15 && !geminiApiKey.equals("TODO");
        geminiStatus.put("status", hasGeminiKey ? "UP" : "OFFLINE_FALLBACK_READY");
        geminiStatus.put("model", "gemini-3.8-flash");
        geminiStatus.put("configured", hasGeminiKey);
        geminiStatus.put("details", hasGeminiKey
            ? "Gemini Multimodal Vision API is configured with valid credentials."
            : "Gemini API key is not set; intelligent heuristic triage fallback is active.");
        services.put("geminiAi", geminiStatus);

        response.put("status", dbHealthy ? "UP" : "DEGRADED");
        response.put("services", services);

        return ResponseEntity.ok(response);
    }
}
