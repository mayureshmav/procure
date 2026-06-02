package com.procurement.repository;

import com.procurement.model.Person;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PersonRepository extends JpaRepository<Person, Long> {
    Optional<Person> findByCompany_CompanyIdAndEmail(Long companyId, String email);
    List<Person> findByCompany_CompanyId(Long companyId);

    @Query("SELECT p FROM Person p WHERE p.company.companyId = :companyId " +
           "AND (:search IS NULL OR LOWER(p.firstName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(p.lastName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(p.email) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<Person> search(@Param("companyId") Long companyId,
                        @Param("search") String search,
                        Pageable pageable);

    List<Person> findByPosition_PositionId(Long positionId);
}
