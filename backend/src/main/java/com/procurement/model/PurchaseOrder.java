package com.procurement.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "purchase_orders")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String poNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id")
    @JsonIgnoreProperties({"lines", "hibernateLazyInitializer"})
    private Requisition requisition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PoStatus status = PoStatus.DRAFT;

    /** Classification of this purchase order — drives workflow and UI behaviour. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrderType orderType = OrderType.STANDARD;

    private LocalDate deliveryDate;

    @Column(length = 1000)
    private String notes;

    @Column(precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime submittedAt;

    // ── Blanket PO fields ─────────────────────────────────────────────────────
    @Column(precision = 14, scale = 2)
    private BigDecimal blanketMaxAmount;
    private LocalDate  blanketExpiryDate;
    @Builder.Default
    private Integer    blanketReleasesCount = 0;

    // ── Storeroom PO fields ───────────────────────────────────────────────────
    @Column(length = 100)
    private String storeroomLocation;
    private Long   storeroomItemId;

    // ── Confirming PO fields ──────────────────────────────────────────────────
    @Column(length = 500)
    private String confirmingReason;
    private LocalDate confirmingOriginalDate;

    // ── Planned PO fields ─────────────────────────────────────────────────────
    private LocalDate plannedReleaseDate;

    // ── Emergency PO fields ───────────────────────────────────────────────────
    @Column(length = 1000)
    private String emergencyJustification;
    @Column(length = 200)
    private String emergencyAuthorisedBy;

    // ── Service PO fields ─────────────────────────────────────────────────────
    @Column(length = 500)
    private String serviceDescription;
    private LocalDate serviceAcceptanceDate;
    @Column(length = 200)
    private String serviceAcceptedBy;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseOrderLine> lines = new ArrayList<>();

    public enum PoStatus {
        DRAFT, SUBMITTED, ACKNOWLEDGED, PARTIALLY_RECEIVED, RECEIVED, CLOSED, CANCELLED
    }

    /**
     * Purchase Order types supported by ProcureTop.
     *
     * STANDARD    — Regular PO; sent to vendor via EDI or email.
     * CONFIRMING  — After-the-fact internal documentation; NOT transmitted to vendor.
     *               Used when a purchase was made verbally or in an emergency and needs
     *               to be documented for audit / accounting purposes.
     * BLANKET     — Framework agreement with a vendor for recurring purchases over a
     *               defined period and maximum spend cap. Individual release orders
     *               are created against it.
     * STOREROOM   — Inventory replenishment PO. Created to refill a specific storeroom
     *               location to its reorder point. Linked to an inventory item.
     * PLANNED     — Pre-scheduled PO with a future release date, typically generated
     *               from an MRP/production plan.
     * SERVICE     — For services (consulting, maintenance, SLAs). No goods receipt;
     *               uses service acceptance instead.
     * EMERGENCY   — Urgent PO that bypasses normal approval workflow. Requires
     *               post-facto justification and authorising manager name.
     */
    public enum OrderType {
        STANDARD, CONFIRMING, BLANKET, STOREROOM, PLANNED, SERVICE, EMERGENCY
    }
}
