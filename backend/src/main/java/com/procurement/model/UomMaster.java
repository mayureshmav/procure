package com.procurement.model;

import com.procurement.model.enums.UomType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "uom_master")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UomMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "uom_type", nullable = false, length = 50)
    private UomType uomType;

    @Column(name = "is_catch_weight_eligible", nullable = false)
    @Builder.Default
    private boolean catchWeightEligible = false;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
