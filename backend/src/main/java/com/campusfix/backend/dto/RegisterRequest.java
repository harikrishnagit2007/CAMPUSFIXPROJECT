package com.campusfix.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Full name is required")
    private String name;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String role = "STUDENT";
    private String department = "Computer Science & Engineering";
    private String phone = "";

    public RegisterRequest() {}

    public String getUsername() {
        if (username != null && !username.trim().isEmpty()) {
            return username.trim();
        }
        if (email != null && email.contains("@")) {
            String prefix = email.split("@")[0].trim().toLowerCase().replaceAll("[^a-zA-Z0-9_]", "_");
            return prefix.length() < 3 ? (prefix + "_usr") : prefix;
        }
        return "user_" + (System.currentTimeMillis() % 100000);
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role != null ? role.toUpperCase() : "STUDENT";
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
