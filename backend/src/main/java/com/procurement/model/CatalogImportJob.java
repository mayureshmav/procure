package com.procurement.model;

import com.procurement.model.enums.FileFormatType;
import com.procurement.model.enums.ImportStatus;
import com.procurement.model.enums.SourceType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "catalog_import_jobs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CatalogImportJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id")
    private User uploadedBy;

    @Column(name = "job_ref", nullable = false, unique = true, length = 100)
    private String jobRef;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 20)
    private SourceType sourceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "format_type", nullable = false, length = 20)
    private FileFormatType formatType;

    @Column(name = "file_name", length = 500)
    private String fileName;

    @Column(name = "source_url", columnDefinition = "CLOB")
    private String sourceUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mapping_id")
    private FileFormatMapping mapping;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ImportStatus status = ImportStatus.PENDING;

    @Builder.Default
    @Column(name = "total_records")
    private int totalRecords = 0;

    @Builder.Default
    @Column(name = "processed_records")
    private int processedRecords = 0;

    @Builder.Default
    @Column(name = "failed_records")
    private int failedRecords = 0;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Builder.Default
    @Column(name = "notification_sent")
    private boolean notificationSent = false;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
