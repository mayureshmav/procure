package com.procurement.dto.approval;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class ApprovalResult {
    /** true = document requires approval; false = auto-approved (no matching active rules) */
    private boolean requiresApproval;
    private String  matchedRuleId;
    private String  matchedRuleName;
    private List<String> requiredApproverPositionIds;
    private String  approvalMode;  // ANY_ONE | ALL
    private String  message;
}
