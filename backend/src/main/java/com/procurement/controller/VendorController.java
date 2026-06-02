package com.procurement.controller;

import com.procurement.model.Vendor;
import com.procurement.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    @GetMapping
    public List<Vendor> getAll(@RequestParam(required = false) String search,
                                @RequestParam(required = false) String status) {
        if (search != null && !search.isBlank()) return vendorService.search(search);
        if ("ACTIVE".equalsIgnoreCase(status)) return vendorService.getActive();
        return vendorService.getAll();
    }

    @GetMapping("/{id}")
    public Vendor getById(@PathVariable Long id) { return vendorService.getById(id); }

    @PostMapping
    public Vendor create(@RequestBody Vendor vendor) { return vendorService.create(vendor); }

    @PutMapping("/{id}")
    public Vendor update(@PathVariable Long id, @RequestBody Vendor vendor) {
        return vendorService.update(id, vendor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vendorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
