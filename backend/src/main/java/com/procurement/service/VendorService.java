package com.procurement.service;

import com.procurement.model.Vendor;
import com.procurement.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;

    public List<Vendor> getAll() { return vendorRepository.findAll(); }

    public List<Vendor> getActive() { return vendorRepository.findByStatus(Vendor.VendorStatus.ACTIVE); }

    public Vendor getById(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + id));
    }

    public Vendor create(Vendor vendor) {
        return vendorRepository.save(vendor);
    }

    public Vendor update(Long id, Vendor updated) {
        Vendor existing = getById(id);
        existing.setName(updated.getName());
        existing.setContactName(updated.getContactName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setAddress(updated.getAddress());
        existing.setPaymentTerms(updated.getPaymentTerms());
        existing.setCategory(updated.getCategory());
        existing.setStatus(updated.getStatus());
        return vendorRepository.save(existing);
    }

    public void delete(Long id) {
        vendorRepository.deleteById(id);
    }

    public List<Vendor> search(String name) {
        return vendorRepository.findByNameContainingIgnoreCase(name);
    }

    public long count() { return vendorRepository.count(); }
}
