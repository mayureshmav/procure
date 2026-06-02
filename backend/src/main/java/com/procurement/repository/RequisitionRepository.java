package com.procurement.repository;

import com.procurement.model.Requisition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RequisitionRepository extends JpaRepository<Requisition, Long> {
    Optional<Requisition> findByReqNumber(String reqNumber);
    List<Requisition> findByStatus(Requisition.ReqStatus status);
    List<Requisition> findByDepartmentIgnoreCase(String department);
    List<Requisition> findByRequestedByIgnoreCase(String requestedBy);
    long countByStatus(Requisition.ReqStatus status);
}
