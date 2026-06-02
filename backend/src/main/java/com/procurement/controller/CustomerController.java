package com.procurement.controller;

import com.procurement.model.Customer;
import com.procurement.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository customerRepo;

    @GetMapping
    public List<Customer> list() { return customerRepo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> get(@PathVariable Long id) {
        return customerRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Customer> create(@RequestBody Customer body) {
        if (customerRepo.existsByCustomerCode(body.getCustomerCode()))
            return ResponseEntity.badRequest().build();
        body.setCustomerId(null);
        return ResponseEntity.ok(customerRepo.save(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> update(@PathVariable Long id, @RequestBody Customer body) {
        return customerRepo.findById(id).map(c -> {
            c.setCustomerName(body.getCustomerName());
            c.setStatus(body.getStatus());
            return ResponseEntity.ok(customerRepo.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!customerRepo.existsById(id)) return ResponseEntity.notFound().build();
        customerRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
