package com.procurement.controller;

import com.procurement.model.OrderGuide;
import com.procurement.model.OrderGuideItem;
import com.procurement.service.OrderGuideService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/order-guides")
@RequiredArgsConstructor
public class OrderGuideController {

    private final OrderGuideService orderGuideService;

    @GetMapping
    public List<OrderGuide> getAll() { return orderGuideService.getAll(); }

    @GetMapping("/{id}")
    public OrderGuide getById(@PathVariable Long id) { return orderGuideService.getById(id); }

    @GetMapping("/{id}/items")
    public List<OrderGuideItem> getItems(@PathVariable Long id) {
        return orderGuideService.getItems(id);
    }

    @PostMapping
    public OrderGuide create(@RequestBody OrderGuide guide) { return orderGuideService.create(guide); }

    @PutMapping("/{id}")
    public OrderGuide update(@PathVariable Long id, @RequestBody OrderGuide guide) {
        return orderGuideService.update(id, guide);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orderGuideService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/items")
    public OrderGuideItem addItem(@PathVariable Long id, @RequestBody AddItemRequest req) {
        return orderGuideService.addItem(id, req.getItemId(), req.getDefaultQty(), req.getTargetPrice());
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long id, @PathVariable Long itemId) {
        orderGuideService.removeItem(id, itemId);
        return ResponseEntity.noContent().build();
    }

    @Data
    static class AddItemRequest {
        private Long itemId;
        private Integer defaultQty;
        private BigDecimal targetPrice;
    }
}
