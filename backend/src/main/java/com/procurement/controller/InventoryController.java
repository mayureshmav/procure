package com.procurement.controller;

import com.procurement.model.InventoryItem;
import com.procurement.service.InventoryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public List<InventoryItem> getAll(@RequestParam(required = false) Boolean lowStock) {
        if (Boolean.TRUE.equals(lowStock)) return inventoryService.getLowStock();
        return inventoryService.getAll();
    }

    @GetMapping("/{id}")
    public InventoryItem getById(@PathVariable Long id) { return inventoryService.getById(id); }

    @GetMapping("/item/{itemId}")
    public InventoryItem getByItemId(@PathVariable Long itemId) {
        return inventoryService.getByItemId(itemId);
    }

    @PostMapping("/item/{itemId}")
    public InventoryItem createOrUpdate(@PathVariable Long itemId, @RequestBody InventoryItem data) {
        return inventoryService.createOrUpdate(itemId, data);
    }

    @PatchMapping("/{id}/adjust")
    public InventoryItem adjust(@PathVariable Long id, @RequestBody AdjustRequest req) {
        return inventoryService.adjust(id, req.getDelta(), req.getReason());
    }

    @Data
    static class AdjustRequest {
        private int delta;
        private String reason;
    }
}
