package com.procurement.controller;

import com.procurement.model.Company;
import com.procurement.model.Customer;
import com.procurement.repository.CompanyRepository;
import com.procurement.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyRepository companyRepo;
    private final CustomerRepository customerRepo;

    @GetMapping
    public List<Company> list(@RequestParam(required = false) Long customerId) {
        if (customerId != null) return companyRepo.findByCustomer_CustomerId(customerId);
        return companyRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Company> get(@PathVariable Long id) {
        return companyRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Long customerId = Long.parseLong(body.get("customerId").toString());
        Customer customer = customerRepo.findById(customerId).orElse(null);
        if (customer == null) return ResponseEntity.badRequest().body("Customer not found");

        Company company = Company.builder()
                .customer(customer)
                .companyCode(body.get("companyCode").toString())
                .companyName(body.get("companyName").toString())
                .legalEntity(body.getOrDefault("legalEntity", "").toString())
                .country(body.getOrDefault("country", "").toString())
                .currency(body.getOrDefault("currency", "").toString())
                .address(body.getOrDefault("address", "").toString())
                .status("ACTIVE")
                .build();
        return ResponseEntity.ok(companyRepo.save(company));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return companyRepo.findById(id).map(c -> {
            if (body.containsKey("companyName")) c.setCompanyName(body.get("companyName").toString());
            if (body.containsKey("legalEntity")) c.setLegalEntity(body.get("legalEntity").toString());
            if (body.containsKey("country"))     c.setCountry(body.get("country").toString());
            if (body.containsKey("currency"))    c.setCurrency(body.get("currency").toString());
            if (body.containsKey("address"))     c.setAddress(body.get("address").toString());
            if (body.containsKey("status"))      c.setStatus(body.get("status").toString());
            return ResponseEntity.ok(companyRepo.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!companyRepo.existsById(id)) return ResponseEntity.notFound().build();
        companyRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
