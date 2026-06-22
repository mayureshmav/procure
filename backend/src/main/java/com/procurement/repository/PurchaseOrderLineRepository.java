package com.procurement.repository;

import com.procurement.model.PurchaseOrderLine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderLineRepository extends JpaRepository<PurchaseOrderLine, Long> {
    List<PurchaseOrderLine> findByPurchaseOrderId(Long poId);
    void deleteByPurchaseOrderId(Long poId);
}
