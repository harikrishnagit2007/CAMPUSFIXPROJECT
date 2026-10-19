package com.campusfix.backend.service;

import com.campusfix.backend.dto.AuthRequest;
import com.campusfix.backend.dto.AuthResponse;
import com.campusfix.backend.dto.RegisterRequest;
import com.campusfix.backend.dto.UserResponse;

public interface AuthService {

    AuthResponse login(AuthRequest request);

    AuthResponse register(RegisterRequest request);

    UserResponse getCurrentUser(String token);

    void logout(String token);
}
