package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "requisitions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Requisition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reqNumber;

    @Column(nullable = false)
    private String title;

    private String requestedBy;
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReqStatus status = ReqStatus.DRAFT;

    @Column(length = 1000)
    private String notes;

    @Column(precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;
    private String approvedBy;

    @OneToMany(mappedBy = "requisition", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RequisitionLine> lines = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"companies", "hibernateLazyInitializer"})
    private Company company;

    public enum ReqStatus {
        DRAFT, SUBMITTED, APPROVED, REJECTED, CONVERTED
    }
}
