package com.procurement.controller;

import com.procurement.dto.ApiResponse;
import com.procurement.dto.approval.ApprovalPolicyDTO;
import com.procurement.dto.approval.ApprovalRuleDTO;
import com.procurement.service.ApprovalService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for the approval engine.
 *
 * Policy endpoints:
 *   GET    /api/approval/policy
 *   POST   /api/approval/policy
 *   PUT    /api/approval/policy/{id}
 *   POST   /api/approval/policy/{id}/activate
 *
 * Rule endpoints (nested under policy):
 *   GET    /api/approval/policy/{policyId}/rules
 *   POST   /api/approval/policy/{policyId}/rules
 *   PUT    /api/approval/rules/{ruleId}
 *   DELETE /api/approval/rules/{ruleId}
 *   PUT    /api/approval/policy/{policyId}/rules/reorder
 */
@RestController
@RequestMapping("/api/approval")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    // ── Policy ────────────────────────────────────────────────────────────────

    @GetMapping("/policy")
    public ResponseEntity<ApiResponse<ApprovalPolicyDTO>> getPolicy() {
        return approvalService.getPolicy()
                .map(p -> ResponseEntity.ok(ApiResponse.ok(p)))
                .orElse(ResponseEntity.ok(ApiResponse.ok(null)));
    }

    @PostMapping("/policy")
    public ResponseEntity<ApiResponse<ApprovalPolicyDTO>> createPolicy(
            @RequestBody ApprovalPolicyDTO req) {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.createPolicy(req)));
    }

    @PutMapping("/policy/{id}")
    public ResponseEntity<ApiResponse<ApprovalPolicyDTO>> updatePolicy(
            @PathVariable String id, @RequestBody ApprovalPolicyDTO req) {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.updatePolicy(id, req)));
    }

    @PostMapping("/policy/{id}/activate")
    public ResponseEntity<ApiResponse<ApprovalPolicyDTO>> activatePolicy(
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.activatePolicy(id)));
    }

    // ── Rules ─────────────────────────────────────────────────────────────────

    @GetMapping("/policy/{policyId}/rules")
    public ResponseEntity<ApiResponse<List<ApprovalRuleDTO>>> getRules(
            @PathVariable String policyId) {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.getRules(policyId)));
    }

    @PostMapping("/policy/{policyId}/rules")
    public ResponseEntity<ApiResponse<ApprovalRuleDTO>> createRule(
            @PathVariable String policyId, @RequestBody ApprovalRuleDTO req) {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.createRule(policyId, req)));
    }

    @PutMapping("/rules/{ruleId}")
    public ResponseEntity<ApiResponse<ApprovalRuleDTO>> updateRule(
            @PathVariable String ruleId, @RequestBody ApprovalRuleDTO req) {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.updateRule(ruleId, req)));
    }

    @DeleteMapping("/rules/{ruleId}")
    public ResponseEntity<Void> deleteRule(@PathVariable String ruleId) {
        approvalService.deleteRule(ruleId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/policy/{policyId}/rules/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderRules(
            @PathVariable String policyId, @RequestBody ReorderRequest req) {
        approvalService.reorderRules(policyId, req.getOrderedIds());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @Data
    static class ReorderRequest {
        private List<String> orderedIds;
    }
}
