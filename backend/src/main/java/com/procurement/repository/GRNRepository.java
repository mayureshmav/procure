package com.procurement.repository;

import com.procurement.model.GRN;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface GRNRepository extends JpaRepository<GRN, Long> {

    @Query("SELECT g FROM GRN g JOIN g.lines l WHERE l.purchaseOrderLine.purchaseOrder.id = :poId")
    List<GRN> findByPurchaseOrderId(@Param("poId") Long poId);

    long countByVendorId(Long vendorId);
}
