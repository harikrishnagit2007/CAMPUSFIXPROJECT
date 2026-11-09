package com.campusfix.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebConfig provides Spring MVC cross-origin resource sharing (CORS) configuration.
 * It permits requests from the React frontend origins configured via properties/environment variables
 * including VITE_JAVA_API_BASE_URL origin or campus.cors.allowed-origins.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${campus.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Value("${VITE_JAVA_API_BASE_URL:}")
    private String viteJavaApiBaseUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String combinedOrigins = allowedOrigins;
        if (viteJavaApiBaseUrl != null && !viteJavaApiBaseUrl.isBlank()) {
            try {
                java.net.URI uri = java.net.URI.create(viteJavaApiBaseUrl.trim());
                String origin = uri.getScheme() + "://" + uri.getAuthority();
                combinedOrigins = combinedOrigins + "," + origin;
            } catch (Exception ignored) {
                combinedOrigins = combinedOrigins + "," + viteJavaApiBaseUrl.trim();
            }
        }

        String[] origins = combinedOrigins.split(",");
        for (int i = 0; i < origins.length; i++) {
            origins[i] = origins[i].trim();
        }

        registry.addMapping("/**")
                .allowedOriginPatterns(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "X-User-Id", "X-User-Role", "Content-Type")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
