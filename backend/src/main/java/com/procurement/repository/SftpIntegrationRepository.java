package com.procurement.repository;

import com.procurement.model.SftpIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SftpIntegrationRepository extends JpaRepository<SftpIntegration, Long> {
    Optional<SftpIntegration> findByVendorId(Long vendorId);
    List<SftpIntegration> findByActiveTrue();
}
