package com.campusfix.backend.dto;

public class AuthResponse {

    private String token;
    private String key; // alias for Django Token compatibility
    private UserResponse user;
    private String message;

    public AuthResponse() {}

    public AuthResponse(String token, UserResponse user, String message) {
        this.token = token;
        this.key = token;
        this.user = user;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
        this.key = token;
    }

    public String getKey() {
        return key != null ? key : token;
    }

    public void setKey(String key) {
        this.key = key;
        this.token = key;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
