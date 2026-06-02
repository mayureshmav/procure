package com.procurement.repository;

import com.procurement.model.RequisitionLine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RequisitionLineRepository extends JpaRepository<RequisitionLine, Long> {
    List<RequisitionLine> findByRequisitionId(Long requisitionId);
}
