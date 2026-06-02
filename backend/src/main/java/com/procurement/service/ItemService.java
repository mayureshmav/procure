package com.procurement.service;

import com.procurement.model.Item;
import com.procurement.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;

    public List<Item> getAll() { return itemRepository.findAll(); }

    public List<Item> getActive() { return itemRepository.findByIsActiveTrue(); }

    public Item getById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found: " + id));
    }

    public Item create(Item item) {
        if (itemRepository.findBySku(item.getSku()).isPresent()) {
            throw new RuntimeException("SKU already exists: " + item.getSku());
        }
        return itemRepository.save(item);
    }

    public Item update(Long id, Item updated) {
        Item existing = getById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setCategory(updated.getCategory());
        existing.setUnitPrice(updated.getUnitPrice());
        existing.setUom(updated.getUom());
        existing.setVendor(updated.getVendor());
        existing.setMinOrderQty(updated.getMinOrderQty());
        existing.setIsActive(updated.getIsActive());
        return itemRepository.save(existing);
    }

    public void delete(Long id) { itemRepository.deleteById(id); }

    public List<Item> search(String query) {
        return itemRepository.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(query, query);
    }

    public List<Item> getByVendor(Long vendorId) {
        return itemRepository.findByVendorId(vendorId);
    }

    public long count() { return itemRepository.count(); }
}
