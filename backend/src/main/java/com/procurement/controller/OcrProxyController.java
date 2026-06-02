package com.procurement.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Thin proxy that forwards /api/ocr/** calls from the main procurement
 * backend to the OCR feed service running on its own port.
 *
 * This lets the frontend use a single base URL (port 8080) and still
 * reach OCR endpoints without cross-origin issues.
 */
@RestController
@RequestMapping("/api/ocr")
public class OcrProxyController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ocr.service.url:http://localhost:8081/api}")
    private String ocrBaseUrl;

    /** Proxy: link an OCR document to a vendor / PO */
    @PostMapping("/documents/{id}/link")
    public ResponseEntity<Object> linkDocument(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String auth
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (auth != null) headers.set(HttpHeaders.AUTHORIZATION, auth);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange(
            ocrBaseUrl + "/documents/" + id + "/link",
            HttpMethod.POST, entity, Object.class
        );
    }

    /** Proxy: list documents pending PO linkage */
    @GetMapping("/documents/pending-link")
    public ResponseEntity<Object> pendingLink(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String auth
    ) {
        HttpHeaders headers = new HttpHeaders();
        if (auth != null) headers.set(HttpHeaders.AUTHORIZATION, auth);
        return restTemplate.exchange(
            ocrBaseUrl + "/documents/pending-link",
            HttpMethod.GET, new HttpEntity<>(headers), Object.class
        );
    }
}
