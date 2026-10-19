package com.campusfix.backend.service;

import com.campusfix.backend.dto.AuthRequest;
import com.campusfix.backend.dto.AuthResponse;
import com.campusfix.backend.dto.RegisterRequest;
import com.campusfix.backend.dto.UserResponse;
import com.campusfix.backend.entity.User;
import com.campusfix.backend.repository.UserRepository;
import com.campusfix.backend.security.TokenProvider;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenProvider tokenProvider;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TokenProvider tokenProvider
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostConstruct
    public void seedInitialUsers() {
        seedUserIfNotExists("admin", "admin@campusfix.edu", "Dr. R. Natarajan", "Admin@123", "ADMIN", "Campus Facilities & Operations", "+91 98401 01100");
        seedUserIfNotExists("student", "student@campusfix.edu", "Harikrishna GM", "Student@123", "STUDENT", "Computer Science & Engineering", "+91 98840 56789");
        seedUserIfNotExists("emma", "emma.watson@campusfix.edu", "Ananya Swaminathan", "Student@123", "STUDENT", "Mechanical Engineering", "+91 94441 67890");
        seedUserIfNotExists("david_staff", "staff@campusfix.edu", "Rajesh Sharma", "Staff@123", "STAFF", "Electrical & Facilities", "+91 97908 12345");
    }

    private void seedUserIfNotExists(String username, String email, String name, String rawPassword, String role, String dept, String phone) {
        if (userRepository.findByUsername(username).isEmpty() && userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setName(name);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            user.setDepartment(dept);
            user.setPhone(phone);
            userRepository.save(user);
        }
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        String identifier = request.getUsername().trim();
        Optional<User> userOpt = userRepository.findByUsername(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(identifier.toLowerCase());
        }

        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid username/email or password");
        }

        User user = userOpt.get();

        // Validate password with BCrypt (or fallback check for seeded credentials)
        boolean matches = false;
        if (user.getPasswordHash() != null) {
            matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
            if (!matches && request.getPassword().equals(user.getPasswordHash())) {
                matches = true;
                // Upgrade to BCrypt
                user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            }
        }

        if (!matches) {
            throw new IllegalArgumentException("Invalid username/email or password");
        }

        String token = tokenProvider.generateToken(user);
        return new AuthResponse(token, UserResponse.fromEntity(user), "Login successful");
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername().trim()).isPresent()) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.findByEmail(request.getEmail().trim().toLowerCase()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setName(request.getName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setDepartment(request.getDepartment());
        user.setPhone(request.getPhone());

        User saved = userRepository.save(user);
        String token = tokenProvider.generateToken(saved);
        return new AuthResponse(token, UserResponse.fromEntity(saved), "Registration successful");
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new NoSuchElementException("No authentication token provided");
        }

        TokenProvider.TokenMetadata meta = tokenProvider.validateToken(token);
        if (meta == null) {
            throw new IllegalArgumentException("Invalid or expired session token");
        }

        User user = userRepository.findById(meta.getUserId())
                .or(() -> userRepository.findByUsername(meta.getUsername()))
                .orElseThrow(() -> new NoSuchElementException("User account not found"));

        return UserResponse.fromEntity(user);
    }

    @Override
    public void logout(String token) {
        if (token != null) {
            tokenProvider.invalidateToken(token);
        }
    }
}
