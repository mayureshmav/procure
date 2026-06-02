package com.procurement.repository;

import com.procurement.model.DashboardWidget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DashboardWidgetRepository extends JpaRepository<DashboardWidget, Long> {
    List<DashboardWidget> findByActiveTrue();
    Optional<DashboardWidget> findByCode(String code);
    List<DashboardWidget> findByActiveTrueOrderByDisplayOrderAsc();
}
