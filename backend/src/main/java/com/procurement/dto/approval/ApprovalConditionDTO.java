package com.procurement.dto.approval;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalConditionDTO {
    private String id;
    private String field;
    private String operator;
    private String value;
    private String valueTo;
}
