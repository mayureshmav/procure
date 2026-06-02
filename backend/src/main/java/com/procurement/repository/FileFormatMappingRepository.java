package com.procurement.repository;

import com.procurement.model.FileFormatMapping;
import com.procurement.model.enums.FileFormatType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FileFormatMappingRepository extends JpaRepository<FileFormatMapping, Long> {
    List<FileFormatMapping> findByVendorIdAndActiveTrue(Long vendorId);
    Optional<FileFormatMapping> findByVendorIdAndFormatTypeAndIsDefaultTrue(Long vendorId, FileFormatType formatType);
    List<FileFormatMapping> findByVendorIdAndFormatType(Long vendorId, FileFormatType formatType);
}
