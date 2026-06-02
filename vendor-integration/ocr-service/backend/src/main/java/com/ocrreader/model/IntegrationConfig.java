package com.ocrreader.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "integration_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IntegrationConfig {

    @Id
    @Column(nullable = false)
    private String configKey;   // e.g. "SFTP", "EMAIL", "OCR_SETTINGS"

    @Column(columnDefinition = "TEXT")
    private String configJson;  // Serialised JSON blob of the config
}
