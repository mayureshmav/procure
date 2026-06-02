package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "order_guides")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderGuide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Builder.Default
    private Boolean isShared = false;

    private String createdBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "orderGuide", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderGuideItem> items = new ArrayList<>();
}
