package com.procurement.controller;

import com.procurement.model.GRN;
import com.procurement.model.PoDispatchLog;
import com.procurement.model.PurchaseOrder;
import com.procurement.model.PurchaseOrderLine;
import com.procurement.service.PoDispatchService;
import com.procurement.service.PurchaseOrderService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService poService;
    private final PoDispatchService    dispatchService;

    @GetMapping
    public List<PurchaseOrder> getAll(@RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return poService.getByStatus(PurchaseOrder.PoStatus.valueOf(status.toUpperCase()));
        }
        return poService.getAll();
    }

    @GetMapping("/{id}")
    public PurchaseOrder getById(@PathVariable Long id) { return poService.getById(id); }

    @PostMapping
    public PurchaseOrder create(@RequestBody PurchaseOrder po) { return poService.create(po); }

    @PutMapping("/{id}")
    public PurchaseOrder update(@PathVariable Long id, @RequestBody PurchaseOrder po) {
        return poService.update(id, po);
    }

    @PostMapping("/from-requisition/{reqId}")
    public PurchaseOrder createFromReq(@PathVariable Long reqId,
                                        @RequestParam(required = false) Long vendorId) {
        return poService.createFromRequisition(reqId, vendorId);
    }

    @PostMapping("/{id}/lines")
    public PurchaseOrderLine addLine(@PathVariable Long id, @RequestBody PurchaseOrderLine line) {
        return poService.addLine(id, line);
    }

    @PostMapping("/{id}/submit")
    public PurchaseOrder submit(@PathVariable Long id) { return poService.submit(id); }

    @PostMapping("/{id}/receive")
    public PurchaseOrder receiveGoods(@PathVariable Long id,
                                       @RequestBody Map<Long, Integer> receivedQtys) {
        return poService.receiveGoods(id, receivedQtys);
    }

    @PostMapping("/{id}/close")
    public PurchaseOrder close(@PathVariable Long id) { return poService.close(id); }

    @PostMapping("/{id}/cancel")
    public PurchaseOrder cancel(@PathVariable Long id) { return poService.cancel(id); }

    @GetMapping("/{id}/grns")
    public List<GRN> getGRNs(@PathVariable Long id) {
        return poService.getGRNsForPO(id);
    }

    @GetMapping("/{id}/dispatch-log")
    public List<PoDispatchLog> getDispatchLog(@PathVariable Long id) {
        return dispatchService.getLogsForPO(id);
    }

    // ── Blanket PO Release endpoints ─────────────────────────────────────────

    @PostMapping("/{id}/release")
    public PurchaseOrder createRelease(@PathVariable Long id,
                                       @RequestBody ReleaseRequest req) {
        return poService.createRelease(id,
                java.math.BigDecimal.valueOf(req.getAmount()),
                req.getNotes());
    }

    @GetMapping("/{id}/releases")
    public List<PurchaseOrder> getReleases(@PathVariable Long id) {
        return poService.getReleasesForBlanket(id);
    }

    @Data
    static class ReleaseRequest {
        private double amount;
        private String notes;
    }

    /** Delete — only DRAFT POs; actually removes the record. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        PurchaseOrder po = poService.getById(id);
        if (po.getStatus() != PurchaseOrder.PoStatus.DRAFT) {
            throw new RuntimeException("Can only delete DRAFT purchase orders");
        }
        poService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
