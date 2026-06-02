package com.procurement.controller;

import com.procurement.model.Company;
import com.procurement.model.Position;
import com.procurement.repository.CompanyRepository;
import com.procurement.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionRepository positionRepo;
    private final CompanyRepository  companyRepo;

    @GetMapping
    public List<Position> list(@RequestParam(required = false) Long companyId) {
        if (companyId != null) return positionRepo.findByCompany_CompanyId(companyId);
        return positionRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Position> get(@PathVariable Long id) {
        return positionRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Long companyId = Long.parseLong(body.get("companyId").toString());
        Company company = companyRepo.findById(companyId).orElse(null);
        if (company == null) return ResponseEntity.badRequest().body("Company not found");

        Position pos = Position.builder()
                .company(company)
                .positionCode(body.get("positionCode").toString())
                .positionName(body.get("positionName").toString())
                .description(body.getOrDefault("description", "").toString())
                .accessMatrix(body.getOrDefault("accessMatrix", "{}").toString())
                .isSystemRole(false)
                .status("ACTIVE")
                .build();
        return ResponseEntity.ok(positionRepo.save(pos));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return positionRepo.findById(id).map(pos -> {
            if (pos.getIsSystemRole()) {
                // Allow updating access matrix on system roles but not renaming
                if (body.containsKey("accessMatrix"))
                    pos.setAccessMatrix(body.get("accessMatrix").toString());
            } else {
                if (body.containsKey("positionName"))  pos.setPositionName(body.get("positionName").toString());
                if (body.containsKey("description"))   pos.setDescription(body.get("description").toString());
                if (body.containsKey("accessMatrix"))  pos.setAccessMatrix(body.get("accessMatrix").toString());
                if (body.containsKey("status"))        pos.setStatus(body.get("status").toString());
            }
            return ResponseEntity.ok(positionRepo.save(pos));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return positionRepo.findById(id).map(pos -> {
            if (pos.getIsSystemRole())
                return ResponseEntity.badRequest().body((Object) "System roles cannot be deleted");
            positionRepo.deleteById(id);
            return ResponseEntity.noContent().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
