package com.ocrreader.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "extracted_fields")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExtractedField {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private OcrDocument document;

    @Column(nullable = false)
    private String fieldName;

    @Column(columnDefinition = "TEXT")
    private String value;

    /** Confidence score 0–100 from OCR engine */
    private int confidence;

    /** True if confidence < configured threshold */
    private boolean flagged;
}
