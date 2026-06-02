package com.procurement.repository;

import com.procurement.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    List<Company> findByCustomer_CustomerIdAndStatus(Long customerId, String status);
    List<Company> findByCustomer_CustomerId(Long customerId);
    boolean existsByCustomer_CustomerIdAndCompanyCode(Long customerId, String companyCode);
}
