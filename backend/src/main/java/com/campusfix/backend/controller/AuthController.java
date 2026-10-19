package com.campusfix.backend.controller;

import com.campusfix.backend.dto.AuthRequest;
import com.campusfix.backend.dto.AuthResponse;
import com.campusfix.backend.dto.RegisterRequest;
import com.campusfix.backend.dto.UserResponse;
import com.campusfix.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
    RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS
})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping({"/me", "/profile"})
    public ResponseEntity<UserResponse> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String token = extractToken(authHeader);
        return ResponseEntity.ok(authService.getCurrentUser(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String token = extractToken(authHeader);
        authService.logout(token);
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully"));
    }

    private String extractToken(String header) {
        if (header != null && !header.trim().isEmpty()) {
            String trimmed = header.trim();
            if (trimmed.startsWith("Token ")) return trimmed.substring(6).trim();
            if (trimmed.startsWith("Bearer ")) return trimmed.substring(7).trim();
            return trimmed;
        }
        return null;
    }
}
