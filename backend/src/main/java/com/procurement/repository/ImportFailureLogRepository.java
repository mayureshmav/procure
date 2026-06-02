package com.procurement.repository;

import com.procurement.model.ImportFailureLog;
import com.procurement.model.enums.FailureSeverity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImportFailureLogRepository extends JpaRepository<ImportFailureLog, Long> {
    List<ImportFailureLog> findByJobIdOrderByRowNumberAsc(Long jobId);
    List<ImportFailureLog> findByJobIdAndSeverity(Long jobId, FailureSeverity severity);
    long countByJobId(Long jobId);
}
