package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "po_dispatch_log")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PoDispatchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "po_id", nullable = false)
    private Long poId;

    /** EMAIL | EDI | MANUAL */
    @Column(name = "dispatch_type", nullable = false)
    @Builder.Default
    private String dispatchType = "EMAIL";

    private String recipient;

    @Column(name = "sent_at")
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();

    /** SENT | FAILED | PENDING */
    @Builder.Default
    private String status = "SENT";

    @Column(name = "error_msg", length = 500)
    private String errorMsg;

    @Column(name = "payload_ref")
    private String payloadRef;
}
