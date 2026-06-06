package com.procurement.model.approval;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "approval_rules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalRule {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private ApprovalPolicy policy;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private int priority = 1;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "stop_on_match", nullable = false)
    @Builder.Default
    private boolean stopOnMatch = true;

    /** Comma-separated ApprovalDocumentType values, e.g. "REQUISITION,PO_STANDARD" */
    @Column(name = "document_types", nullable = false, length = 500)
    @Builder.Default
    private String documentTypes = "";

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "rule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<ApprovalCondition> conditions = new ArrayList<>();

    @OneToMany(mappedBy = "rule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stepNumber ASC")
    @Builder.Default
    private List<ApprovalStep> steps = new ArrayList<>();

    @PrePersist
    void initId() {
        if (id == null) id = UUID.randomUUID().toString();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void touch() { updatedAt = LocalDateTime.now(); }
}
