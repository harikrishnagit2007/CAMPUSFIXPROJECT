package com.campusfix.backend.security;

import com.campusfix.backend.entity.User;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenProvider {

    // Token store for active sessions
    private final Map<String, TokenMetadata> tokenStore = new ConcurrentHashMap<>();

    public static class TokenMetadata {
        private final Long userId;
        private final String username;
        private final String role;
        private final long expiresAt;

        public TokenMetadata(Long userId, String username, String role, long ttlMillis) {
            this.userId = userId;
            this.username = username;
            this.role = role;
            this.expiresAt = System.currentTimeMillis() + ttlMillis;
        }

        public Long getUserId() {
            return userId;
        }

        public String getUsername() {
            return username;
        }

        public String getRole() {
            return role;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    /**
     * Generate secure token for authenticated user
     */
    public String generateToken(User user) {
        long now = System.currentTimeMillis();
        String payload = user.getId() + ":" + user.getUsername() + ":" + user.getRole() + ":" + now;
        String tokenKey;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            tokenKey = "cfx_" + Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            tokenKey = "cfx_" + Long.toHexString(now) + "_" + user.getId();
        }

        // 7 days token validity
        tokenStore.put(tokenKey, new TokenMetadata(user.getId(), user.getUsername(), user.getRole(), 7L * 86400000L));
        return tokenKey;
    }

    public TokenMetadata validateToken(String token) {
        if (token == null || token.trim().isEmpty()) return null;
        String clean = token.trim();
        TokenMetadata meta = tokenStore.get(clean);
        if (meta != null) {
            if (meta.isExpired()) {
                tokenStore.remove(clean);
                return null;
            }
            return meta;
        }

        // Support demo tokens (e.g. demo-token-1-admin, demo-token-2-student)
        if (clean.startsWith("demo-token-")) {
            String[] parts = clean.split("-");
            if (parts.length >= 4) {
                try {
                    Long id = Long.parseLong(parts[2]);
                    String name = parts[3];
                    String role = (parts.length > 4) ? parts[4].toUpperCase() : (name.contains("admin") ? "ADMIN" : name.contains("staff") ? "STAFF" : "STUDENT");
                    return new TokenMetadata(id, name, role, 86400000L);
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    public void invalidateToken(String token) {
        if (token != null) {
            tokenStore.remove(token.trim());
        }
    }
}
