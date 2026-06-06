package com.procurement.dto.approval;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ApprovalRuleDTO {
    private String id;
    private String policyId;
    private String name;
    private String description;
    private Integer priority;
    private Boolean active;
    private Boolean stopOnMatch;
    private List<String> documentTypes;
    private List<ApprovalConditionDTO> conditions;
    private List<ApprovalStepDTO> steps;
    private String createdAt;
    private String updatedAt;
}
