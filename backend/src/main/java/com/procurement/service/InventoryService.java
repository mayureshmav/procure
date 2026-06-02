package com.procurement.service;

import com.procurement.model.InventoryItem;
import com.procurement.model.Item;
import com.procurement.repository.InventoryItemRepository;
import com.procurement.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final ItemRepository itemRepository;

    public List<InventoryItem> getAll() { return inventoryItemRepository.findAll(); }

    public List<InventoryItem> getLowStock() { return inventoryItemRepository.findLowStockItems(); }

    public InventoryItem getById(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found: " + id));
    }

    public InventoryItem getByItemId(Long itemId) {
        return inventoryItemRepository.findByItemId(itemId)
                .orElseThrow(() -> new RuntimeException("No inventory record for item: " + itemId));
    }

    @Transactional
    public InventoryItem createOrUpdate(Long itemId, InventoryItem data) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found: " + itemId));

        InventoryItem inv = inventoryItemRepository.findByItemId(itemId)
                .orElseGet(() -> InventoryItem.builder().item(item).build());

        inv.setOnHandQty(data.getOnHandQty() != null ? data.getOnHandQty() : inv.getOnHandQty());
        inv.setReorderPoint(data.getReorderPoint() != null ? data.getReorderPoint() : inv.getReorderPoint());
        inv.setReorderQty(data.getReorderQty() != null ? data.getReorderQty() : inv.getReorderQty());
        inv.setLocation(data.getLocation() != null ? data.getLocation() : inv.getLocation());
        inv.setLastUpdated(LocalDateTime.now());
        return inventoryItemRepository.save(inv);
    }

    @Transactional
    public InventoryItem adjust(Long id, int delta, String reason) {
        InventoryItem inv = getById(id);
        inv.setOnHandQty(inv.getOnHandQty() + delta);
        inv.setLastUpdated(LocalDateTime.now());
        return inventoryItemRepository.save(inv);
    }

    public long countLowStock() { return inventoryItemRepository.findLowStockItems().size(); }
}
