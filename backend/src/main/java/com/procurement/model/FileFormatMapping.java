package com.procurement.model;

import com.procurement.model.enums.FileFormatType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "file_format_mappings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"vendor_id", "format_type", "mapping_name"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FileFormatMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(name = "format_type", nullable = false, length = 20)
    private FileFormatType formatType;

    @Column(name = "mapping_name", nullable = false, length = 255)
    private String mappingName;

    /** JSON string: { "sourceName": "targetField", ... } */
    @Column(name = "mapping_config", nullable = false, columnDefinition = "CLOB")
    private String mappingConfig;

    @Builder.Default
    @Column(name = "is_default")
    private boolean isDefault = false;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
