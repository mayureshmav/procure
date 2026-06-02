package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "org_units")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrgUnit {

    public enum UnitType {
        DIVISION, LEGAL_ENTITY, BU, OU, DEPARTMENT, SUB_DEPARTMENT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orgUnitId;

    @Column(nullable = false, length = 50)
    private String unitCode;

    @Column(nullable = false, length = 255)
    private String unitName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private UnitType unitType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private OrgUnit parent;

    @OneToMany(mappedBy = "parent")
    @Builder.Default
    private List<OrgUnit> children = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Person manager;

    @Column(length = 50)
    private String costCenter;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

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
