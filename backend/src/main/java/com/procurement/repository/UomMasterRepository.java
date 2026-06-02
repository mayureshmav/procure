package com.procurement.repository;

import com.procurement.model.UomMaster;
import com.procurement.model.enums.UomType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UomMasterRepository extends JpaRepository<UomMaster, Long> {
    Optional<UomMaster> findByCode(String code);
    List<UomMaster> findByUomType(UomType uomType);
    List<UomMaster> findByCatchWeightEligibleTrue();
}
