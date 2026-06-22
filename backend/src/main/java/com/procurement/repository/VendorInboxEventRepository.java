package com.procurement.repository;

import com.procurement.model.VendorInboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VendorInboxEventRepository extends JpaRepository<VendorInboxEvent, Long> {

    List<VendorInboxEvent> findByVendorId(Long vendorId);

    Optional<VendorInboxEvent> findByPoIdAndVendorId(Long poId, Long vendorId);

    long countByVendorIdAndStatus(Long vendorId, String status);
}
