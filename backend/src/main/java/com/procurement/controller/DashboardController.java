package com.procurement.controller;

import com.procurement.model.PurchaseOrder;
import com.procurement.model.Requisition;
import com.procurement.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final VendorService vendorService;
    private final ItemService itemService;
    private final RequisitionService requisitionService;
    private final PurchaseOrderService poService;
    private final InventoryService inventoryService;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVendors", vendorService.count());
        stats.put("totalItems", itemService.count());
        stats.put("pendingReqs", requisitionService.countByStatus(Requisition.ReqStatus.SUBMITTED));
        stats.put("openPOs", poService.countByStatus(PurchaseOrder.PoStatus.SUBMITTED));
        stats.put("lowStockItems", inventoryService.countLowStock());
        stats.put("draftReqs", requisitionService.countByStatus(Requisition.ReqStatus.DRAFT));
        stats.put("approvedReqs", requisitionService.countByStatus(Requisition.ReqStatus.APPROVED));
        stats.put("receivedPOs", poService.countByStatus(PurchaseOrder.PoStatus.RECEIVED));
        return stats;
    }
}
