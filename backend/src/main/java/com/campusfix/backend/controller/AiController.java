package com.campusfix.backend.controller;

import com.campusfix.backend.service.GeminiAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Spring Boot REST Controller for AI-Powered Services:
 * - Multimodal Gemini image inspection & categorization
 * - AI Assistant Chatbot
 */
@RestController
@RequestMapping({"/api/v1/ai", "/api/ai"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS
})
@Tag(name = "AI Services", description = "Endpoints for Gemini multimodal image analysis and conversational assistant")
public class AiController {

    private final GeminiAiService geminiAiService;

    public AiController(GeminiAiService geminiAiService) {
        this.geminiAiService = geminiAiService;
    }

    @PostMapping({"/analyze-complaint", "/analyze-complaint/", "/analyze_image", "/analyze_image/"})
    @Operation(summary = "Analyze maintenance issue image with Gemini AI")
    public ResponseEntity<Map<String, Object>> analyzeComplaintImage(@RequestBody Map<String, Object> request) {
        String image = (String) request.get("image");
        if (image == null || image.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Valid image base64 data or image URL is required."));
        }
        Map<String, Object> result = geminiAiService.analyzeImage(image);
        return ResponseEntity.ok(result);
    }

    @PostMapping({"/chat", "/chat/"})
    @Operation(summary = "Conversational AI assistant query")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> request) {
        List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
        String systemInstruction = (String) request.get("systemInstruction");
        Map<String, Object> result = geminiAiService.chat(messages, systemInstruction);
        return ResponseEntity.ok(result);
    }
}
