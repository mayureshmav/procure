package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "positions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"company_id", "position_code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long positionId;

    @Column(nullable = false, length = 50)
    private String positionCode;

    @Column(nullable = false, length = 255)
    private String positionName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(length = 500)
    private String description;

    /**
     * JSON object mapping module keys to permission maps.
     * Example:
     * {
     *   "vendors":        {"view":true,"create":true,"edit":true,"delete":false},
     *   "purchaseOrders": {"view":true,"create":true,"approve":false},
     *   ...
     * }
     */
    @Column(columnDefinition = "CLOB", nullable = false)
    @Builder.Default
    private String accessMatrix = "{}";

    @Column(nullable = false)
    @Builder.Default
    private Boolean isSystemRole = false;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
