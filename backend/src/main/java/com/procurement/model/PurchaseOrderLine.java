package com.procurement.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "purchase_order_lines")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseOrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "po_id", nullable = false)
    @JsonIgnoreProperties({"lines", "hibernateLazyInitializer"})
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id")
    private Item item;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Integer orderedQty;

    @Builder.Default
    private Integer receivedQty = 0;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    private String uom;

    @Column(precision = 14, scale = 2)
    private BigDecimal totalPrice;

    private String glAccount;

    // ── Tax Engine fields ─────────────────────────────────────────────────────
    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(length = 50)
    private String taxClass;   // e.g. STANDARD, REDUCED, ZERO, EXEMPT

    @PrePersist
    @PreUpdate
    public void calcTotal() {
        if (unitPrice != null && orderedQty != null) {
            totalPrice = unitPrice.multiply(BigDecimal.valueOf(orderedQty));
        }
    }
}
