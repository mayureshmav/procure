package com.procurement.dto.approval;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalStepDTO {
    private String id;
    private Integer stepNumber;
    private String label;
    private String stepType;
    private List<Long> positionIds;
    private List<Long> personIds;
    private String approvalMode;
    private BigDecimal approvalLimitAmount;
    private Integer timeoutHours;
    private String onTimeout;
}
