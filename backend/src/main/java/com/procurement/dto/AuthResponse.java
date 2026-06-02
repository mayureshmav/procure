package com.procurement.dto;

import lombok.*;

@Data @Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private String username;
    private String role;
    private Long vendorId;
    private String vendorName;

    // ── Multi-tenant context ──────────────────────────────────────────────────
    private Long   customerId;
    private String customerName;
    private Long   companyId;
    private String companyName;
    private Long   positionId;
    private String positionName;
    private Long   personId;
    /** Full JSON access matrix from the user's Position */
    private String accessMatrix;
}
