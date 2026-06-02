package com.procurement.repository;

import com.procurement.model.CurrencyMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CurrencyMasterRepository extends JpaRepository<CurrencyMaster, Long> {
    Optional<CurrencyMaster> findByCode(String code);
    List<CurrencyMaster> findByActiveTrue();
}
