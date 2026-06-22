package com.procurement.controller;

import com.procurement.model.GRN;
import com.procurement.repository.GRNRepository;
import com.procurement.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class GRNController {

    private final GRNRepository grnRepository;
    private final PurchaseOrderService poService;

    /** All GRNs linked to a specific PO */
    @GetMapping("/api/purchase-orders/{poId}/grns")
    public List<GRN> getGRNsForPO(@PathVariable Long poId) {
        return poService.getGRNsForPO(poId);
    }

    /** Single GRN by ID */
    @GetMapping("/api/grns/{id}")
    public GRN getById(@PathVariable Long id) {
        return grnRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("GRN not found: " + id));
    }

    /** All GRNs */
    @GetMapping("/api/grns")
    public List<GRN> getAll() {
        return grnRepository.findAll();
    }
}
