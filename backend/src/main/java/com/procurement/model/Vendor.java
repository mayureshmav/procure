package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendors")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String contactName;
    private String email;
    private String phone;

    @Column(length = 500)
    private String address;

    private String paymentTerms;    // e.g. NET30, NET60, COD
    private String category;         // e.g. Food & Beverage, Office Supplies

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VendorStatus status = VendorStatus.ACTIVE;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum VendorStatus { ACTIVE, INACTIVE }
}
