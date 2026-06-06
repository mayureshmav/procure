package com.procurement.model.approval;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "approval_steps")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalStep {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private ApprovalRule rule;

    @Column(name = "step_number", nullable = false)
    private int stepNumber;

    @Column(length = 255)
    private String label;

    /** POSITION | DIRECT_MANAGER | SPECIFIC_PERSON */
    @Column(name = "step_type", nullable = false, length = 30)
    @Builder.Default
    private String stepType = "POSITION";

    /** Comma-separated position IDs, e.g. "1,3,7" */
    @Column(name = "position_ids", length = 500)
    private String positionIds;

    /** Comma-separated person IDs */
    @Column(name = "person_ids", length = 500)
    private String personIds;

    /** ANY_ONE | ALL | MAJORITY */
    @Column(name = "approval_mode", nullable = false, length = 20)
    @Builder.Default
    private String approvalMode = "ANY_ONE";

    @Column(name = "approval_limit_amount", precision = 14, scale = 2)
    private BigDecimal approvalLimitAmount;

    @Column(name = "timeout_hours")
    private Integer timeoutHours;

    /** ESCALATE | AUTO_APPROVE | AUTO_REJECT | REMIND */
    @Column(name = "on_timeout", length = 20)
    @Builder.Default
    private String onTimeout = "ESCALATE";

    @PrePersist
    void initId() { if (id == null) id = UUID.randomUUID().toString(); }
}
