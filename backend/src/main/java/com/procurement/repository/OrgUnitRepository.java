package com.procurement.repository;

import com.procurement.model.OrgUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OrgUnitRepository extends JpaRepository<OrgUnit, Long> {
    List<OrgUnit> findByCompany_CompanyIdOrderBySortOrderAsc(Long companyId);
    List<OrgUnit> findByCompany_CompanyIdAndParentIsNullOrderBySortOrderAsc(Long companyId);

    @Query("SELECT o FROM OrgUnit o WHERE o.company.companyId = :companyId AND o.parent.orgUnitId = :parentId ORDER BY o.sortOrder")
    List<OrgUnit> findChildren(@Param("companyId") Long companyId, @Param("parentId") Long parentId);
}
