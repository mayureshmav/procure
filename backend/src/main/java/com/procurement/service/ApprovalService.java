package com.procurement.service;

import com.procurement.dto.approval.*;
import com.procurement.model.approval.*;
import com.procurement.repository.ApprovalPolicyRepository;
import com.procurement.repository.ApprovalRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalPolicyRepository policyRepo;
    private final ApprovalRuleRepository   ruleRepo;

    // ── Evaluate ─────────────────────────────────────────────────────────────

    /**
     * Evaluate approval rules for a submitted document.
     *
     * @param documentType  "REQUISITION" or "PO_STANDARD" / "PO_BLANKET" etc.
     * @param amount        total spend amount (may be null)
     * @param poType        PO order type string (may be null)
     * @param department    department code or name (may be null)
     */
    public ApprovalResult evaluate(String documentType, BigDecimal amount,
                                   String poType, String department) {
        Optional<ApprovalPolicy> activePolicyOpt = policyRepo.findAll().stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()))
                .findFirst();

        if (activePolicyOpt.isEmpty()) {
            return ApprovalResult.builder()
                    .requiresApproval(false)
                    .message("No active approval policy — auto-approved")
                    .build();
        }

        ApprovalPolicy policy = activePolicyOpt.get();
        List<ApprovalRule> rules = ruleRepo.findByPolicyIdOrderByPriorityAsc(policy.getId())
                .stream().filter(ApprovalRule::isActive).collect(Collectors.toList());

        for (ApprovalRule rule : rules) {
            // Check document type match (empty docTypes = match all)
            if (!rule.getDocumentTypes().isBlank()) {
                List<String> allowed = Arrays.asList(rule.getDocumentTypes().split(","));
                if (allowed.stream().noneMatch(t -> t.trim().equalsIgnoreCase(documentType))) {
                    continue;
                }
            }

            // Evaluate all conditions (AND logic)
            boolean allMatch = rule.getConditions().stream().allMatch(c ->
                    evaluateCondition(c, amount, poType, department));

            if (allMatch) {
                List<String> positionIds = rule.getSteps().stream()
                        .flatMap(s -> splitStringList(s.getPositionIds()).stream())
                        .distinct().collect(Collectors.toList());
                String approvalMode = rule.getSteps().stream()
                        .map(ApprovalStep::getApprovalMode)
                        .filter(Objects::nonNull)
                        .findFirst().orElse("ANY_ONE");

                return ApprovalResult.builder()
                        .requiresApproval(true)
                        .matchedRuleId(rule.getId())
                        .matchedRuleName(rule.getName())
                        .requiredApproverPositionIds(positionIds)
                        .approvalMode(approvalMode)
                        .message("Approval required: matched rule \"" + rule.getName() + "\"")
                        .build();
            }
        }

        return ApprovalResult.builder()
                .requiresApproval(false)
                .message("No matching approval rule — auto-approved")
                .build();
    }

    private boolean evaluateCondition(ApprovalCondition c, BigDecimal amount,
                                      String poType, String department) {
        String field = c.getField();
        String op    = c.getOperator();
        String val   = c.getValue();

        switch (field) {
            case "SPEND_AMOUNT" -> {
                if (amount == null) return false;
                BigDecimal threshold  = parseBD(val);
                BigDecimal thresholdTo = parseBD(c.getValueTo());
                return switch (op) {
                    case "GTE"     -> amount.compareTo(threshold) >= 0;
                    case "GT"      -> amount.compareTo(threshold) > 0;
                    case "LTE"     -> amount.compareTo(threshold) <= 0;
                    case "LT"      -> amount.compareTo(threshold) < 0;
                    case "EQ"      -> amount.compareTo(threshold) == 0;
                    case "BETWEEN" -> amount.compareTo(threshold) >= 0 && amount.compareTo(thresholdTo) <= 0;
                    default        -> false;
                };
            }
            case "PO_TYPE" -> {
                if (poType == null) return false;
                return switch (op) {
                    case "EQ"  -> poType.equalsIgnoreCase(val);
                    case "NEQ" -> !poType.equalsIgnoreCase(val);
                    case "IN"  -> Arrays.asList(val.split(",")).stream().anyMatch(v -> v.trim().equalsIgnoreCase(poType));
                    case "NOT_IN" -> Arrays.asList(val.split(",")).stream().noneMatch(v -> v.trim().equalsIgnoreCase(poType));
                    default    -> false;
                };
            }
            case "DEPARTMENT" -> {
                if (department == null) return false;
                return switch (op) {
                    case "EQ"       -> department.equalsIgnoreCase(val);
                    case "NEQ"      -> !department.equalsIgnoreCase(val);
                    case "CONTAINS" -> department.toLowerCase().contains(val.toLowerCase());
                    case "IN"       -> Arrays.asList(val.split(",")).stream().anyMatch(v -> v.trim().equalsIgnoreCase(department));
                    default         -> false;
                };
            }
            default -> { return true; } // Unknown fields pass through
        }
    }

    private BigDecimal parseBD(String s) {
        try { return s != null && !s.isBlank() ? new BigDecimal(s.trim()) : BigDecimal.ZERO; }
        catch (NumberFormatException e) { return BigDecimal.ZERO; }
    }

    // ── Policy ────────────────────────────────────────────────────────────────

    public Optional<ApprovalPolicyDTO> getPolicy() {
        return policyRepo.findTopByOrderByCreatedAtAsc().map(this::toPolicyDTO);
    }

    @Transactional
    public ApprovalPolicyDTO createPolicy(ApprovalPolicyDTO req) {
        ApprovalPolicy policy = ApprovalPolicy.builder()
                .name(req.getName())
                .description(req.getDescription())
                .status(req.getStatus() != null ? req.getStatus() : "DRAFT")
                .build();
        return toPolicyDTO(policyRepo.save(policy));
    }

    @Transactional
    public ApprovalPolicyDTO updatePolicy(String id, ApprovalPolicyDTO req) {
        ApprovalPolicy policy = policyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found: " + id));
        if (req.getName() != null && !req.getName().isBlank()) policy.setName(req.getName());
        if (req.getDescription() != null) policy.setDescription(req.getDescription());
        return toPolicyDTO(policyRepo.save(policy));
    }

    @Transactional
    public ApprovalPolicyDTO activatePolicy(String id) {
        ApprovalPolicy policy = policyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found: " + id));
        policy.setStatus("ACTIVE");
        return toPolicyDTO(policyRepo.save(policy));
    }

    // ── Rules ─────────────────────────────────────────────────────────────────

    public List<ApprovalRuleDTO> getRules(String policyId) {
        return ruleRepo.findByPolicyIdOrderByPriorityAsc(policyId)
                .stream().map(this::toRuleDTO).collect(Collectors.toList());
    }

    @Transactional
    public ApprovalRuleDTO createRule(String policyId, ApprovalRuleDTO req) {
        ApprovalPolicy policy = policyRepo.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Policy not found: " + policyId));

        ApprovalRule rule = ApprovalRule.builder()
                .policy(policy)
                .name(req.getName())
                .description(req.getDescription())
                .priority(req.getPriority() != null ? req.getPriority() : 1)
                .active(req.getActive() != null ? req.getActive() : true)
                .stopOnMatch(req.getStopOnMatch() != null ? req.getStopOnMatch() : true)
                .documentTypes(joinStringList(req.getDocumentTypes()))
                .build();

        applyConditions(rule, req.getConditions());
        applySteps(rule, req.getSteps());

        return toRuleDTO(ruleRepo.save(rule));
    }

    @Transactional
    public ApprovalRuleDTO updateRule(String ruleId, ApprovalRuleDTO req) {
        ApprovalRule rule = ruleRepo.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Rule not found: " + ruleId));

        // Partial update: only `active` toggled (name absent)
        if (req.getName() == null || req.getName().isBlank()) {
            if (req.getActive() != null) rule.setActive(req.getActive());
            return toRuleDTO(ruleRepo.save(rule));
        }

        // Full update
        rule.setName(req.getName());
        rule.setDescription(req.getDescription());
        if (req.getPriority()    != null) rule.setPriority(req.getPriority());
        if (req.getActive()      != null) rule.setActive(req.getActive());
        if (req.getStopOnMatch() != null) rule.setStopOnMatch(req.getStopOnMatch());
        if (req.getDocumentTypes() != null) rule.setDocumentTypes(joinStringList(req.getDocumentTypes()));

        rule.getConditions().clear();
        rule.getSteps().clear();
        ruleRepo.saveAndFlush(rule);

        applyConditions(rule, req.getConditions());
        applySteps(rule, req.getSteps());

        return toRuleDTO(ruleRepo.save(rule));
    }

    @Transactional
    public void deleteRule(String ruleId) {
        ruleRepo.deleteById(ruleId);
    }

    @Transactional
    public void reorderRules(String policyId, List<String> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            ruleRepo.updatePriority(orderedIds.get(i), i + 1);
        }
    }

    // ── Entity builders ───────────────────────────────────────────────────────

    private void applyConditions(ApprovalRule rule, List<ApprovalConditionDTO> dtos) {
        if (dtos == null) return;
        for (int i = 0; i < dtos.size(); i++) {
            ApprovalConditionDTO d = dtos.get(i);
            rule.getConditions().add(ApprovalCondition.builder()
                    .rule(rule)
                    .field(d.getField())
                    .operator(d.getOperator())
                    .value(d.getValue() != null ? d.getValue() : "")
                    .valueTo(d.getValueTo())
                    .sortOrder(i)
                    .build());
        }
    }

    private void applySteps(ApprovalRule rule, List<ApprovalStepDTO> dtos) {
        if (dtos == null) return;
        for (int i = 0; i < dtos.size(); i++) {
            ApprovalStepDTO d = dtos.get(i);
            rule.getSteps().add(ApprovalStep.builder()
                    .rule(rule)
                    .stepNumber(d.getStepNumber() != null ? d.getStepNumber() : i + 1)
                    .label(d.getLabel())
                    .stepType(d.getStepType() != null ? d.getStepType() : "POSITION")
                    .positionIds(joinLongList(d.getPositionIds()))
                    .personIds(joinLongList(d.getPersonIds()))
                    .approvalMode(d.getApprovalMode() != null ? d.getApprovalMode() : "ANY_ONE")
                    .approvalLimitAmount(d.getApprovalLimitAmount())
                    .timeoutHours(d.getTimeoutHours())
                    .onTimeout(d.getOnTimeout() != null ? d.getOnTimeout() : "ESCALATE")
                    .build());
        }
    }

    // ── DTO mappers ───────────────────────────────────────────────────────────

    private ApprovalPolicyDTO toPolicyDTO(ApprovalPolicy p) {
        return ApprovalPolicyDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .status(p.getStatus())
                .effectiveDate(p.getEffectiveDate() != null ? p.getEffectiveDate().toString() : null)
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                .updatedAt(p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null)
                .build();
    }

    private ApprovalRuleDTO toRuleDTO(ApprovalRule r) {
        return ApprovalRuleDTO.builder()
                .id(r.getId())
                .policyId(r.getPolicy() != null ? r.getPolicy().getId() : null)
                .name(r.getName())
                .description(r.getDescription())
                .priority(r.getPriority())
                .active(r.isActive())
                .stopOnMatch(r.isStopOnMatch())
                .documentTypes(splitStringList(r.getDocumentTypes()))
                .conditions(r.getConditions().stream().map(this::toConditionDTO).collect(Collectors.toList()))
                .steps(r.getSteps().stream().map(this::toStepDTO).collect(Collectors.toList()))
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null)
                .updatedAt(r.getUpdatedAt() != null ? r.getUpdatedAt().toString() : null)
                .build();
    }

    private ApprovalConditionDTO toConditionDTO(ApprovalCondition c) {
        return ApprovalConditionDTO.builder()
                .id(c.getId())
                .field(c.getField())
                .operator(c.getOperator())
                .value(c.getValue())
                .valueTo(c.getValueTo())
                .build();
    }

    private ApprovalStepDTO toStepDTO(ApprovalStep s) {
        return ApprovalStepDTO.builder()
                .id(s.getId())
                .stepNumber(s.getStepNumber())
                .label(s.getLabel())
                .stepType(s.getStepType())
                .positionIds(splitLongList(s.getPositionIds()))
                .personIds(splitLongList(s.getPersonIds()))
                .approvalMode(s.getApprovalMode())
                .approvalLimitAmount(s.getApprovalLimitAmount())
                .timeoutHours(s.getTimeoutHours())
                .onTimeout(s.getOnTimeout())
                .build();
    }

    // ── CSV utilities ─────────────────────────────────────────────────────────

    private String joinStringList(List<String> list) {
        if (list == null || list.isEmpty()) return "";
        return String.join(",", list);
    }

    private String joinLongList(List<Long> list) {
        if (list == null || list.isEmpty()) return null;
        return list.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private List<String> splitStringList(String csv) {
        if (csv == null || csv.isBlank()) return new ArrayList<>();
        return Arrays.stream(csv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private List<Long> splitLongList(String csv) {
        if (csv == null || csv.isBlank()) return new ArrayList<>();
        return Arrays.stream(csv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }
}
