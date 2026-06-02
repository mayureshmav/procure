package com.ocrreader.dto;

import com.ocrreader.model.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DocumentDTO {
    private String id;
    private String fileName;
    private DocumentType documentType;
    private DocumentStatus status;
    private SourceType sourceType;
    private LocalDateTime receivedAt;
    private LocalDateTime processedAt;

    private String vendorName;
    private String vendorAddress;
    private String vendorContact;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String poReference;

    private String currency;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal grandTotal;
    private String paymentTerms;
    private LocalDate dueDate;
    private String bankDetails;

    private int overallConfidence;
    private boolean isDuplicate;
    private String errorMessage;

    private List<ExtractedFieldDTO> extractedFields;
    private List<LineItemDTO> lineItems;
    private List<AuditEntryDTO> auditLog;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ExtractedFieldDTO {
        private String fieldName;
        private String value;
        private int confidence;
        private boolean flagged;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LineItemDTO {
        private String description;
        private double quantity;
        private double unitPrice;
        private double totalAmount;
        private double taxRate;
        private double taxAmount;
        private double discount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuditEntryDTO {
        private LocalDateTime timestamp;
        private String action;
        private String user;
        private String details;
    }
}
