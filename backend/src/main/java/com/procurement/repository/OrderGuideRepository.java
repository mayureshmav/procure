package com.procurement.repository;

import com.procurement.model.OrderGuide;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderGuideRepository extends JpaRepository<OrderGuide, Long> {
    List<OrderGuide> findByIsSharedTrue();
    List<OrderGuide> findByCreatedBy(String createdBy);
}
