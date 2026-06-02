package com.ocrreader.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_entries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private OcrDocument document;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    private String action;   // e.g. RECEIVED, OCR_STARTED, OCR_COMPLETED, VALIDATED, REPROCESSED, FAILED
    private String user;     // "system" or email of the user who acted
    @Column(columnDefinition = "TEXT")
    private String details;
}
