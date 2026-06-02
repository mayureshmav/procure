package com.procurement.repository;

import com.procurement.model.OrderGuideItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderGuideItemRepository extends JpaRepository<OrderGuideItem, Long> {
    List<OrderGuideItem> findByOrderGuideId(Long orderGuideId);
    void deleteByOrderGuideIdAndItemId(Long orderGuideId, Long itemId);
}
