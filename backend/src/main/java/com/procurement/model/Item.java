package com.procurement.model;

import com.procurement.model.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Unified catalog item / product — maps to the `items` table.
 * Contains both basic P2P procurement fields and the full catalog
 * product model (pricing, catch weight, portions, import, etc.)
 */
@Entity
@Table(name = "items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Identification ────────────────────────────────────────────────────────
    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(name = "vendor_sku", length = 100)
    private String vendorSku;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(columnDefinition = "CLOB")
    private String description;

    private String category;

    @Column(name = "sub_category")
    private String subCategory;

    @Column(length = 255)
    private String brand;

    @Column(length = 255)
    private String manufacturer;

    @Column(name = "country_of_origin", length = 3)
    private String countryOfOrigin;

    // ── Barcodes ──────────────────────────────────────────────────────────────
    @Column(length = 20)
    private String gtin;

    @Column(length = 15)
    private String upc;

    @Column(length = 15)
    private String ean;

    // ── Vendor ────────────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    // ── UOM & Pricing ─────────────────────────────────────────────────────────
    /** Legacy string UOM (e.g. "EA", "KG") — kept for backward compat */
    @Column(length = 50)
    private String uom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uom_id")
    private UomMaster uomMaster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "price_uom_id")
    private UomMaster priceUom;

    @Column(name = "unit_price", precision = 18, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "cost_price", precision = 18, scale = 4)
    private BigDecimal costPrice;

    @Column(name = "rrp", precision = 18, scale = 4)
    private BigDecimal rrp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "currency_id")
    private CurrencyMaster currency;

    @Column(name = "currency_code", length = 10)
    @Builder.Default
    private String currencyCode = "INR";

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "tax_rate_pct", precision = 6, scale = 4)
    private BigDecimal taxRatePct;

    // ── Catch Weight ──────────────────────────────────────────────────────────
    @Column(name = "is_catch_weight", nullable = false)
    @Builder.Default
    private boolean catchWeight = false;

    @Column(name = "catch_weight_min", precision = 10, scale = 4)
    private BigDecimal catchWeightMin;

    @Column(name = "catch_weight_max", precision = 10, scale = 4)
    private BigDecimal catchWeightMax;

    @Column(name = "catch_weight_avg", precision = 10, scale = 4)
    private BigDecimal catchWeightAvg;

    @Column(name = "catch_weight_nominal", precision = 10, scale = 4)
    private BigDecimal catchWeightNominal;

    @Column(name = "catch_weight_tolerance_pct", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal catchWeightTolerancePct = new BigDecimal("5.00");

    @Enumerated(EnumType.STRING)
    @Column(name = "catch_weight_price_method", length = 20)
    @Builder.Default
    private CatchWeightPriceMethod catchWeightPriceMethod = CatchWeightPriceMethod.PER_WEIGHT_UNIT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catch_weight_uom_id")
    private UomMaster catchWeightUom;

    // ── Pack / Case ───────────────────────────────────────────────────────────
    @Column(name = "case_qty")
    private Integer caseQty;

    @Column(name = "inner_pack_qty")
    private Integer innerPackQty;

    @Column(name = "pack_size_description", length = 100)
    private String packSizeDescription;

    // ── Portion ───────────────────────────────────────────────────────────────
    @Column(name = "portion_size", precision = 10, scale = 4)
    private BigDecimal portionSize;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portion_size_uom_id")
    private UomMaster portionSizeUom;

    @Column(name = "portions_per_pack", precision = 10, scale = 4)
    private BigDecimal portionsPerPack;

    @Column(name = "serving_suggestion", length = 500)
    private String servingSuggestion;

    // ── Ordering Rules ────────────────────────────────────────────────────────
    @Column(name = "min_order_qty", precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal minOrderQty = BigDecimal.ONE;

    @Column(name = "max_order_qty", precision = 10, scale = 4)
    private BigDecimal maxOrderQty;

    @Column(name = "order_increment", precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal orderIncrement = BigDecimal.ONE;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    // ── Date Lifecycle ────────────────────────────────────────────────────────
    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "expire_date")
    private LocalDate expireDate;

    @Column(name = "discontinue_date")
    private LocalDate discontinueDate;

    @Column(name = "new_product_until")
    private LocalDate newProductUntil;

    // ── Status ────────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "product_status", length = 30)
    @Builder.Default
    private ProductStatus productStatus = ProductStatus.ACTIVE;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // ── Storage & Handling ────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "storage_temp", length = 20)
    private StorageTemp storageTemp;

    @Column(name = "storage_temp_min_c", precision = 5, scale = 2)
    private BigDecimal storageTempMinC;

    @Column(name = "storage_temp_max_c", precision = 5, scale = 2)
    private BigDecimal storageTempMaxC;

    @Column(name = "shelf_life_days")
    private Integer shelfLifeDays;

    @Builder.Default
    private boolean hazmat = false;

    @Column(name = "hazmat_class", length = 50)
    private String hazmatClass;

    // ── Allergens / Dietary (stored as JSON string) ───────────────────────────
    @Column(columnDefinition = "CLOB")
    private String allergens;

    @Column(name = "dietary_flags", columnDefinition = "CLOB")
    private String dietaryFlags;

    // ── Dimensions ────────────────────────────────────────────────────────────
    @Column(name = "gross_weight", precision = 10, scale = 4)
    private BigDecimal grossWeight;

    @Column(name = "net_weight", precision = 10, scale = 4)
    private BigDecimal netWeight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weight_uom_id")
    private UomMaster weightUom;

    @Column(name = "length_mm", precision = 10, scale = 2)
    private BigDecimal lengthMm;

    @Column(name = "width_mm", precision = 10, scale = 2)
    private BigDecimal widthMm;

    @Column(name = "height_mm", precision = 10, scale = 2)
    private BigDecimal heightMm;

    // ── Substitution ──────────────────────────────────────────────────────────
    @Column(name = "substitute_sku", length = 100)
    private String substituteSku;

    @Column(name = "is_substitute_allowed")
    @Builder.Default
    private boolean substituteAllowed = false;

    // ── Audit ─────────────────────────────────────────────────────────────────
    @Column(name = "last_imported_at")
    private LocalDateTime lastImportedAt;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Relations ─────────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProductPriceBreak> priceBreaks = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProductPriceHistory> priceHistory = new ArrayList<>();
}
