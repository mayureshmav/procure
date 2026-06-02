package com.procurement.controller;

import com.procurement.model.Item;
import com.procurement.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public List<Item> getAll(@RequestParam(required = false) String search,
                              @RequestParam(required = false) Long vendorId) {
        if (search != null && !search.isBlank()) return itemService.search(search);
        if (vendorId != null) return itemService.getByVendor(vendorId);
        return itemService.getAll();
    }

    @GetMapping("/{id}")
    public Item getById(@PathVariable Long id) { return itemService.getById(id); }

    @PostMapping
    public Item create(@RequestBody Item item) { return itemService.create(item); }

    @PutMapping("/{id}")
    public Item update(@PathVariable Long id, @RequestBody Item item) {
        return itemService.update(id, item);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        itemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
