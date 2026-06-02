package com.procurement.model;

import com.procurement.model.enums.BreakType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_price_breaks",
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "break_type", "tier_sequence"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductPriceBreak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Item product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(name = "break_type", nullable = false, length = 20)
    private BreakType breakType;

    @Column(name = "tier_sequence", nullable = false)
    private Integer tierSequence;

    @Column(name = "min_value", nullable = false, precision = 18, scale = 4)
    private BigDecimal minValue;

    @Column(name = "max_value", precision = 18, scale = 4)
    private BigDecimal maxValue;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "discount_pct", precision = 6, scale = 4)
    private BigDecimal discountPct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "currency_id")
    private CurrencyMaster currency;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "expire_date")
    private LocalDate expireDate;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
