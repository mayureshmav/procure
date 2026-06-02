package com.procurement.repository;

import com.procurement.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findByItemId(Long itemId);

    @Query("SELECT i FROM InventoryItem i WHERE i.onHandQty <= i.reorderPoint")
    List<InventoryItem> findLowStockItems();
}
