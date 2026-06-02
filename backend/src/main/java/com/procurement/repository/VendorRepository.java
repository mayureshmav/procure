package com.procurement.repository;

import com.procurement.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findByStatus(Vendor.VendorStatus status);
    List<Vendor> findByNameContainingIgnoreCase(String name);
    List<Vendor> findByCategoryIgnoreCase(String category);
}
