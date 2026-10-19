package com.campusfix.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class AuthRequest {

    @NotBlank(message = "Username or email is required")
    private String username;

    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    public AuthRequest() {}

    public String getUsername() {
        return (username != null && !username.trim().isEmpty()) ? username : email;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email != null ? email : username;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
