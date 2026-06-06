package com.procurement.repository;

import com.procurement.model.approval.ApprovalPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApprovalPolicyRepository extends JpaRepository<ApprovalPolicy, String> {
    Optional<ApprovalPolicy> findTopByOrderByCreatedAtAsc();
}
