package com.procurement.controller;

import com.procurement.model.*;
import com.procurement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/org-units")
@RequiredArgsConstructor
public class OrgUnitController {

    private final OrgUnitRepository orgUnitRepo;
    private final CompanyRepository companyRepo;
    private final PersonRepository  personRepo;

    @GetMapping
    public List<OrgUnit> list(@RequestParam(required = false) Long companyId,
                              @RequestParam(defaultValue = "false") boolean rootOnly) {
        if (companyId != null && rootOnly)
            return orgUnitRepo.findByCompany_CompanyIdAndParentIsNullOrderBySortOrderAsc(companyId);
        if (companyId != null)
            return orgUnitRepo.findByCompany_CompanyIdOrderBySortOrderAsc(companyId);
        return orgUnitRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrgUnit> get(@PathVariable Long id) {
        return orgUnitRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/children")
    public List<OrgUnit> children(@PathVariable Long id,
                                  @RequestParam Long companyId) {
        return orgUnitRepo.findChildren(companyId, id);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Long companyId = Long.parseLong(body.get("companyId").toString());
        Company company = companyRepo.findById(companyId).orElse(null);
        if (company == null) return ResponseEntity.badRequest().body("Company not found");

        OrgUnit.OrgUnitBuilder builder = OrgUnit.builder()
                .company(company)
                .unitCode(body.get("unitCode").toString())
                .unitName(body.get("unitName").toString())
                .unitType(OrgUnit.UnitType.valueOf(body.get("unitType").toString()))
                .costCenter(body.getOrDefault("costCenter", "").toString())
                .description(body.getOrDefault("description", "").toString())
                .sortOrder(body.containsKey("sortOrder") ? Integer.parseInt(body.get("sortOrder").toString()) : 0)
                .status("ACTIVE");

        if (body.containsKey("parentId") && body.get("parentId") != null)
            orgUnitRepo.findById(Long.parseLong(body.get("parentId").toString()))
                    .ifPresent(builder::parent);

        if (body.containsKey("managerId") && body.get("managerId") != null)
            personRepo.findById(Long.parseLong(body.get("managerId").toString()))
                    .ifPresent(builder::manager);

        return ResponseEntity.ok(orgUnitRepo.save(builder.build()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return orgUnitRepo.findById(id).map(u -> {
            if (body.containsKey("unitName"))    u.setUnitName(body.get("unitName").toString());
            if (body.containsKey("description")) u.setDescription(body.get("description").toString());
            if (body.containsKey("costCenter"))  u.setCostCenter(body.get("costCenter").toString());
            if (body.containsKey("sortOrder"))   u.setSortOrder(Integer.parseInt(body.get("sortOrder").toString()));
            if (body.containsKey("status"))      u.setStatus(body.get("status").toString());

            if (body.containsKey("parentId") && body.get("parentId") != null)
                orgUnitRepo.findById(Long.parseLong(body.get("parentId").toString()))
                        .ifPresent(u::setParent);
            if (body.containsKey("managerId") && body.get("managerId") != null)
                personRepo.findById(Long.parseLong(body.get("managerId").toString()))
                        .ifPresent(u::setManager);

            return ResponseEntity.ok(orgUnitRepo.save(u));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!orgUnitRepo.existsById(id)) return ResponseEntity.notFound().build();
        orgUnitRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
