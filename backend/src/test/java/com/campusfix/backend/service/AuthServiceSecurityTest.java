package com.campusfix.backend.service;

import com.campusfix.backend.dto.AuthResponse;
import com.campusfix.backend.dto.RegisterRequest;
import com.campusfix.backend.entity.User;
import com.campusfix.backend.repository.UserRepository;
import com.campusfix.backend.security.TokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AuthServiceSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenProvider tokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testPublicRegistrationForcesStudentRole() {
        // Attempt privilege escalation by requesting ADMIN role in public registration
        RegisterRequest request = new RegisterRequest();
        request.setUsername("malicious_user");
        request.setEmail("user@campusfix.edu");
        request.setName("Malicious User");
        request.setPassword("Password@123");
        request.setRole("ADMIN"); // Attacker asks for ADMIN

        when(userRepository.findByUsername("malicious_user")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("user@campusfix.edu")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Password@123")).thenReturn("$2a$10$encodedHashHere");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(55L);
            return u;
        });
        when(tokenProvider.generateToken(any(User.class))).thenReturn("cfx_test_token_123");

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        // Critical Security Check: The saved user must have STUDENT role, rejecting requested ADMIN
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getRole()).isEqualTo("STUDENT");
        assertThat(response.getUser().getRole()).isEqualTo("STUDENT");
    }

    @Test
    public void testRegistrationFailsForDuplicateUsername() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existing_user");
        request.setEmail("new@campusfix.edu");
        request.setName("New User");
        request.setPassword("Password@123");

        when(userRepository.findByUsername("existing_user")).thenReturn(Optional.of(new User()));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username is already taken");

        verify(userRepository, never()).save(any(User.class));
    }
}
