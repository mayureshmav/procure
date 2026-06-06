package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "grn_lines")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GRNLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_id", nullable = false)
    private GRN grn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "po_line_id")
    private PurchaseOrderLine purchaseOrderLine;

    private Integer receivedQty;

    @Column(precision = 12, scale = 2)
    private BigDecimal receivedPrice;

    @Column(precision = 14, scale = 2)
    private BigDecimal lineTotal;

    private String uom;

    @PrePersist
    @PreUpdate
    public void calcLineTotal() {
        if (receivedPrice != null && receivedQty != null) {
            lineTotal = receivedPrice.multiply(java.math.BigDecimal.valueOf(receivedQty));
        }
    }
}
