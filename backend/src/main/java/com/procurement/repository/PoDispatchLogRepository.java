package com.procurement.repository;

import com.procurement.model.PoDispatchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PoDispatchLogRepository extends JpaRepository<PoDispatchLog, Long> {
    List<PoDispatchLog> findByPoIdOrderBySentAtDesc(Long poId);
}
