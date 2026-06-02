package com.ocrreader.controller;

import com.ocrreader.service.IntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/integration")
@RequiredArgsConstructor
public class IntegrationController {

    private final IntegrationService integrationService;

    // ── SFTP ──────────────────────────────────────────────────────────────────

    @GetMapping("/sftp")
    public ResponseEntity<Map<String, Object>> getSftpConfig() {
        return ResponseEntity.ok(integrationService.getConfig("SFTP"));
    }

    @PostMapping("/sftp")
    public ResponseEntity<Void> saveSftpConfig(@RequestBody Map<String, Object> config) {
        integrationService.saveConfig("SFTP", config);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sftp/test")
    public ResponseEntity<Map<String, Object>> testSftp(@RequestBody Map<String, Object> config) {
        return ResponseEntity.ok(integrationService.testSftpConnection(config));
    }

    // ── Email ─────────────────────────────────────────────────────────────────

    @GetMapping("/email")
    public ResponseEntity<Map<String, Object>> getEmailConfig() {
        return ResponseEntity.ok(integrationService.getConfig("EMAIL"));
    }

    @PostMapping("/email")
    public ResponseEntity<Void> saveEmailConfig(@RequestBody Map<String, Object> config) {
        integrationService.saveConfig("EMAIL", config);
        return ResponseEntity.ok().build();
    }

    // ── OCR Settings ──────────────────────────────────────────────────────────

    @GetMapping("/ocr-settings")
    public ResponseEntity<Map<String, Object>> getOcrSettings() {
        return ResponseEntity.ok(integrationService.getConfig("OCR_SETTINGS"));
    }

    @PostMapping("/ocr-settings")
    public ResponseEntity<Void> saveOcrSettings(@RequestBody Map<String, Object> config) {
        integrationService.saveConfig("OCR_SETTINGS", config);
        return ResponseEntity.ok().build();
    }
}
