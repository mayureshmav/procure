package com.procurement.repository;

import com.procurement.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    Optional<Item> findBySku(String sku);
    List<Item> findByIsActiveTrue();
    List<Item> findByVendorId(Long vendorId);
    List<Item> findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(String name, String sku);
    List<Item> findByCategoryIgnoreCase(String category);
}
