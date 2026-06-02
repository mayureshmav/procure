package com.procurement.controller;

import com.procurement.model.*;
import com.procurement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/persons")
@RequiredArgsConstructor
public class PersonController {

    private final PersonRepository   personRepo;
    private final CompanyRepository  companyRepo;
    private final PositionRepository positionRepo;
    private final OrgUnitRepository  orgUnitRepo;

    @GetMapping
    public Page<Person> list(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName", "firstName"));
        if (companyId != null) {
            return personRepo.search(companyId, search, pageable);
        }
        return personRepo.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Person> get(@PathVariable Long id) {
        return personRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Long companyId = Long.parseLong(body.get("companyId").toString());
        Company company = companyRepo.findById(companyId).orElse(null);
        if (company == null) return ResponseEntity.badRequest().body("Company not found");

        Person.PersonBuilder builder = Person.builder()
                .company(company)
                .employeeCode(body.get("employeeCode").toString())
                .firstName(body.get("firstName").toString())
                .lastName(body.get("lastName").toString())
                .email(body.get("email").toString())
                .phone(body.getOrDefault("phone", "").toString())
                .status("ACTIVE");

        if (body.containsKey("positionId") && body.get("positionId") != null)
            positionRepo.findById(Long.parseLong(body.get("positionId").toString()))
                    .ifPresent(builder::position);

        if (body.containsKey("orgUnitId") && body.get("orgUnitId") != null)
            orgUnitRepo.findById(Long.parseLong(body.get("orgUnitId").toString()))
                    .ifPresent(builder::orgUnit);

        if (body.containsKey("managerId") && body.get("managerId") != null)
            personRepo.findById(Long.parseLong(body.get("managerId").toString()))
                    .ifPresent(builder::manager);

        if (body.containsKey("hireDate") && body.get("hireDate") != null)
            builder.hireDate(LocalDate.parse(body.get("hireDate").toString()));

        return ResponseEntity.ok(personRepo.save(builder.build()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return personRepo.findById(id).map(p -> {
            if (body.containsKey("firstName")) p.setFirstName(body.get("firstName").toString());
            if (body.containsKey("lastName"))  p.setLastName(body.get("lastName").toString());
            if (body.containsKey("phone"))     p.setPhone(body.get("phone").toString());
            if (body.containsKey("status"))    p.setStatus(body.get("status").toString());

            if (body.containsKey("positionId") && body.get("positionId") != null)
                positionRepo.findById(Long.parseLong(body.get("positionId").toString()))
                        .ifPresent(p::setPosition);

            if (body.containsKey("orgUnitId") && body.get("orgUnitId") != null)
                orgUnitRepo.findById(Long.parseLong(body.get("orgUnitId").toString()))
                        .ifPresent(p::setOrgUnit);

            if (body.containsKey("managerId") && body.get("managerId") != null)
                personRepo.findById(Long.parseLong(body.get("managerId").toString()))
                        .ifPresent(p::setManager);

            if (body.containsKey("hireDate") && body.get("hireDate") != null)
                p.setHireDate(LocalDate.parse(body.get("hireDate").toString()));

            return ResponseEntity.ok(personRepo.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!personRepo.existsById(id)) return ResponseEntity.notFound().build();
        personRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
