package com.procurement.model.approval;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "approval_conditions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalCondition {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private ApprovalRule rule;

    /** SPEND_AMOUNT | PO_TYPE | DEPARTMENT | GL_ACCOUNT | VENDOR | COST_CENTER | CATEGORY */
    @Column(name = "field_name", nullable = false, length = 50)
    private String field;

    /** GTE | GT | LTE | LT | EQ | NEQ | IN | NOT_IN | BETWEEN | STARTS_WITH | CONTAINS */
    @Column(nullable = false, length = 20)
    private String operator;

    @Column(name = "cond_value", nullable = false, length = 500)
    @Builder.Default
    private String value = "";

    @Column(name = "value_to", length = 500)
    private String valueTo;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @PrePersist
    void initId() { if (id == null) id = UUID.randomUUID().toString(); }
}
