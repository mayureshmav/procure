package com.procurement.dto.approval;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalPolicyDTO {
    private String id;
    private String name;
    private String description;
    private String status;
    private String effectiveDate;
    private String createdAt;
    private String updatedAt;
}
