package com.procurement.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_guide_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderGuideItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_guide_id", nullable = false)
    @JsonIgnoreProperties({"items", "hibernateLazyInitializer"})
    private OrderGuide orderGuide;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Builder.Default
    private Integer defaultQty = 1;

    @Column(precision = 12, scale = 2)
    private BigDecimal targetPrice;
}
