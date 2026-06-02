package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false, unique = true)
    private Item item;

    @Builder.Default
    private Integer onHandQty = 0;

    @Builder.Default
    private Integer reorderPoint = 10;

    @Builder.Default
    private Integer reorderQty = 50;

    private String location;      // e.g. "Storeroom A, Shelf 3"

    @Builder.Default
    private LocalDateTime lastUpdated = LocalDateTime.now();

    /** Convenience: is stock below reorder point? */
    @Transient
    public boolean isLowStock() {
        return onHandQty != null && reorderPoint != null && onHandQty <= reorderPoint;
    }
}
