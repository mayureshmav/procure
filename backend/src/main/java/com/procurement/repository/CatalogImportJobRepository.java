package com.procurement.repository;

import com.procurement.model.CatalogImportJob;
import com.procurement.model.enums.ImportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CatalogImportJobRepository extends JpaRepository<CatalogImportJob, Long> {
    Optional<CatalogImportJob> findByJobRef(String jobRef);
    Page<CatalogImportJob> findByVendorIdOrderByCreatedAtDesc(Long vendorId, Pageable pageable);
    Page<CatalogImportJob> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<CatalogImportJob> findByStatus(ImportStatus status);
    long countByStatus(ImportStatus status);
}
