package com.ocrreader.repository;

import com.ocrreader.model.IntegrationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IntegrationConfigRepository extends JpaRepository<IntegrationConfig, String> {
}
