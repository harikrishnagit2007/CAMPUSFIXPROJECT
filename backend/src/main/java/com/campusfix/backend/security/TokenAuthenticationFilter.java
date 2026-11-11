package com.campusfix.backend.security;

import com.campusfix.backend.entity.User;
import com.campusfix.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;

    public TokenAuthenticationFilter(TokenProvider tokenProvider, UserRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null) {
            TokenProvider.TokenMetadata meta = tokenProvider.validateToken(token);
            if (meta != null) {
                // Real-time Database Role Verification: Fetch current role directly from MySQL
                String role = meta.getRole();
                String username = meta.getUsername();

                // Check MySQL for updated role if user exists
                if (meta.getUserId() != null) {
                    Optional<User> userOpt = userRepository.findById(meta.getUserId());
                    if (userOpt.isPresent()) {
                        role = userOpt.get().getRole();
                        username = userOpt.get().getUsername();
                    }
                } else if (meta.getUsername() != null) {
                    Optional<User> userOpt = userRepository.findByUsername(meta.getUsername())
                            .or(() -> userRepository.findByEmail(meta.getUsername()));
                    if (userOpt.isPresent()) {
                        role = userOpt.get().getRole();
                        username = userOpt.get().getUsername();
                    }
                }

                // Header fallback for explicit role hints
                String headerRole = request.getHeader("X-User-Role");
                if (headerRole != null && !headerRole.trim().isEmpty() && role == null) {
                    role = headerRole.trim().toUpperCase();
                }

                if (role == null || role.trim().isEmpty()) {
                    role = "STUDENT";
                }

                List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + role.trim().toUpperCase())
                );

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        username != null ? username : "user",
                        null,
                        authorities
                );
                auth.setDetails(meta);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } else if (isProtectedPath(request)) {
                // Return 401 Unauthorized immediately if an invalid token is provided on a protected path
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"error\": \"Invalid or expired session token. Please re-authenticate.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Checks whether the request path is a protected route requiring authentication
     */
    private boolean isProtectedPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) return false;
        if (uri.startsWith("/api/v1/auth/") || uri.startsWith("/api/auth/")) return false;
        if (uri.startsWith("/api/v1/health/") || uri.startsWith("/api/health/")) return false;
        if (uri.startsWith("/v3/api-docs") || uri.startsWith("/swagger-ui")) return false;

        return !"GET".equalsIgnoreCase(method);
    }

    /**
     * Resolves token from Authorization header supporting both 'Token <token>' and 'Bearer <token>'
     */
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && !bearerToken.trim().isEmpty()) {
            String trimmed = bearerToken.trim();
            if (trimmed.startsWith("Token ")) {
                return trimmed.substring(6).trim();
            }
            if (trimmed.startsWith("Bearer ")) {
                return trimmed.substring(7).trim();
            }
            return trimmed;
        }
        return null;
    }
}
