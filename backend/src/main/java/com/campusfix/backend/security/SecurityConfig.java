package com.campusfix.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final TokenAuthenticationFilter tokenAuthenticationFilter;

    @Value("${campus.cors.allowed-origins:*}")
    private String allowedOrigins;

    public SecurityConfig(TokenAuthenticationFilter tokenAuthenticationFilter) {
        this.tokenAuthenticationFilter = tokenAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public authentication and documentation endpoints
                .requestMatchers("/api/v1/auth/**", "/api/auth/**").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // Allow OPTIONS pre-flight checks
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public read operations across complaints, locations, and lost-found items
                .requestMatchers(HttpMethod.GET, "/api/v1/complaints/**", "/api/complaints/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/lost-found/**", "/api/lost-found/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/locations/**", "/api/locations/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/staff/**", "/api/staff/**").permitAll()
                // Permit public reporting for complaints and lost/found items
                .requestMatchers(HttpMethod.POST, "/api/v1/complaints", "/api/complaints", "/api/v1/complaints/check-duplicate", "/api/v1/complaints/suggest-priority").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/lost-found/items", "/api/v1/lost-found/report", "/api/v1/lost-found/claims").permitAll()
                // Role-restricted administrative & staff operations
                .requestMatchers(HttpMethod.DELETE, "/api/v1/complaints/**", "/api/complaints/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/complaints/*/assign", "/api/complaints/*/assign").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/staff/**", "/api/staff/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/staff/**", "/api/staff/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/staff/**", "/api/staff/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/locations/**", "/api/locations/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/locations/**", "/api/locations/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/locations/**", "/api/locations/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/lost-found/claims/*/status", "/api/lost-found/claims/*/status").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/lost-found/items/**", "/api/lost-found/items/**").hasAnyRole("ADMIN", "STAFF")
                .anyRequest().authenticated()
            )
            .addFilterBefore(tokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setExposedHeaders(Arrays.asList("Authorization", "X-User-Id", "X-User-Role", "Content-Type"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
