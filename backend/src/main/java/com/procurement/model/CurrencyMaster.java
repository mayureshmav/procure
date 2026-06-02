package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "currency_master")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CurrencyMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 10)
    private String symbol;

    @Builder.Default
    @Column(name = "decimal_places", nullable = false)
    private int decimalPlaces = 2;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
