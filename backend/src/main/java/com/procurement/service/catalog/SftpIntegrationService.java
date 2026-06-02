package com.procurement.service.catalog;

import com.procurement.model.SftpIntegration;
import com.procurement.model.Vendor;
import com.procurement.repository.SftpIntegrationRepository;
import com.procurement.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SftpIntegrationService {

    private final SftpIntegrationRepository integrationRepo;
    private final VendorRepository vendorRepo;

    public List<SftpIntegration> getAll() {
        return integrationRepo.findAll();
    }

    public Optional<SftpIntegration> getByVendor(Long vendorId) {
        return integrationRepo.findByVendorId(vendorId);
    }

    public SftpIntegration save(Long vendorId, SftpIntegration integration) {
        Vendor vendor = vendorRepo.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));
        integration.setVendor(vendor);
        integration.setUpdatedAt(LocalDateTime.now());
        return integrationRepo.save(integration);
    }

    public void delete(Long id) {
        integrationRepo.deleteById(id);
    }

    public SftpIntegration testConnection(Long id) {
        SftpIntegration integration = integrationRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Integration not found"));
        // Connection test logic would go here (JSch for SFTP/FTP, AS2/AS4 HTTP ping)
        log.info("Testing connection for vendor {} protocol {}",
                integration.getVendor().getId(), integration.getProtocolType());
        integration.setLastPolledAt(LocalDateTime.now());
        return integrationRepo.save(integration);
    }

    public List<SftpIntegration> getActive() {
        return integrationRepo.findByActiveTrue();
    }
}
