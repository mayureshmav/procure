package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_price_history")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Item product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "import_job_id")
    private CatalogImportJob importJob;

    @Column(name = "old_unit_price", precision = 18, scale = 4)
    private BigDecimal oldUnitPrice;

    @Column(name = "new_unit_price", precision = 18, scale = 4)
    private BigDecimal newUnitPrice;

    @Column(name = "old_effective_date")
    private LocalDate oldEffectiveDate;

    @Column(name = "new_effective_date")
    private LocalDate newEffectiveDate;

    @Column(name = "old_expire_date")
    private LocalDate oldExpireDate;

    @Column(name = "new_expire_date")
    private LocalDate newExpireDate;

    @Builder.Default
    @Column(name = "changed_at")
    private LocalDateTime changedAt = LocalDateTime.now();

    @Column(name = "changed_by", length = 100)
    private String changedBy;
}
