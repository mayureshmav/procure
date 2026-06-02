package com.ocrreader.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "ocr_documents",
    indexes = {
        @Index(name = "idx_invoice_number", columnList = "invoiceNumber"),
        @Index(name = "idx_status",         columnList = "status"),
        @Index(name = "idx_received_at",    columnList = "receivedAt")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OcrDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DocumentType documentType = DocumentType.UNKNOWN;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SourceType sourceType = SourceType.MANUAL;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime receivedAt = LocalDateTime.now();

    private LocalDateTime processedAt;

    // ── Header fields ──────────────────────────────────────────────────────────
    private String vendorName;
    private String vendorAddress;
    private String vendorContact;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String poReference;

    // ── Financial fields ──────────────────────────────────────────────────────
    private String currency;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal grandTotal;
    private String paymentTerms;
    private LocalDate dueDate;
    private String bankDetails;

    // ── Processing metadata ──────────────────────────────────────────────────
    private int overallConfidence;
    private boolean isDuplicate;
    private String errorMessage;

    // ── Procurement linkage ───────────────────────────────────────────────────
    /** ID of the matched Vendor in the Procurement system */
    private Long linkedVendorId;

    /** ID of the matched Purchase Order in the Procurement system */
    private Long linkedPoId;

    /** Human-readable PO reference after matching */
    private String matchedPo;

    // ── Raw extracted text (for re-processing) ────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String rawText;

    // ── Line items stored as JSON ─────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String lineItemsJson;

    // ── Child relationships ───────────────────────────────────────────────────
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ExtractedField> extractedFields = new ArrayList<>();

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("timestamp ASC")
    @Builder.Default
    private List<AuditEntry> auditLog = new ArrayList<>();
}
