package com.procurement.repository;

import com.procurement.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    List<PurchaseOrder> findByStatus(PurchaseOrder.PoStatus status);
    List<PurchaseOrder> findByVendorId(Long vendorId);
    List<PurchaseOrder> findByRequisitionId(Long requisitionId);
    long countByStatus(PurchaseOrder.PoStatus status);
}
