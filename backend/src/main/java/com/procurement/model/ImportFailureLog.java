package com.procurement.model;

import com.procurement.model.enums.FailureSeverity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "import_failure_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ImportFailureLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private CatalogImportJob job;

    @Column(name = "row_number")
    private Integer rowNumber;

    @Column(length = 100)
    private String sku;

    @Column(name = "field_name", length = 100)
    private String fieldName;

    @Column(name = "raw_value", columnDefinition = "CLOB")
    private String rawValue;

    @Column(name = "error_code", nullable = false, length = 100)
    private String errorCode;

    @Column(name = "error_message", nullable = false, columnDefinition = "CLOB")
    private String errorMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FailureSeverity severity = FailureSeverity.ERROR;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
