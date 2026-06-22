package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_inbox_events")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VendorInboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "po_id", nullable = false)
    private Long poId;

    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;

    /** UNREAD | READ | ACKNOWLEDGED */
    @Column(nullable = false)
    private String status;

    private LocalDateTime readAt;

    @Column(name = "ack_at")
    private LocalDateTime ackAt;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void touch() { updatedAt = LocalDateTime.now(); }
}
