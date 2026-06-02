package com.procurement.controller.catalog;

import com.procurement.dto.ApiResponse;
import com.procurement.model.SftpIntegration;
import com.procurement.service.catalog.SftpIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
public class IntegrationController {

    private final SftpIntegrationService integrationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SftpIntegration>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(integrationService.getAll()));
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<ApiResponse<SftpIntegration>> getByVendor(@PathVariable Long vendorId) {
        return integrationService.getByVendor(vendorId)
                .map(i -> ResponseEntity.ok(ApiResponse.ok(i)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/vendor/{vendorId}")
    public ResponseEntity<ApiResponse<SftpIntegration>> save(@PathVariable Long vendorId,
                                                               @RequestBody SftpIntegration integration) {
        return ResponseEntity.ok(ApiResponse.ok(integrationService.save(vendorId, integration)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SftpIntegration>> update(@PathVariable Long id,
                                                                @RequestBody SftpIntegration integration) {
        integration.setId(id);
        return ResponseEntity.ok(ApiResponse.ok(integrationService.save(
                integration.getVendor() != null ? integration.getVendor().getId() : null, integration)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        integrationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Integration deleted", null));
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<ApiResponse<SftpIntegration>> testConnection(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Connection test initiated",
                integrationService.testConnection(id)));
    }
}
