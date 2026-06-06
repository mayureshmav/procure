package com.procurement.repository;

import com.procurement.model.approval.ApprovalRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ApprovalRuleRepository extends JpaRepository<ApprovalRule, String> {

    List<ApprovalRule> findByPolicyIdOrderByPriorityAsc(String policyId);

    @Modifying
    @Query("UPDATE ApprovalRule r SET r.priority = :priority WHERE r.id = :id")
    void updatePriority(@Param("id") String id, @Param("priority") int priority);
}
