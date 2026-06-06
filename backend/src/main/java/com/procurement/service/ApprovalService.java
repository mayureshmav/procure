package com.procurement.service;

import com.procurement.dto.approval.*;
import com.procurement.model.approval.*;
import com.procurement.repository.ApprovalPolicyRepository;
import com.procurement.repository.ApprovalRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalPolicyRepository policyRepo;
    private final ApprovalRuleRepository   ruleRepo;

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
