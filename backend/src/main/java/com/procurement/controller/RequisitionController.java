package com.procurement.controller;

import com.procurement.model.Requisition;
import com.procurement.model.RequisitionLine;
import com.procurement.service.RequisitionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/requisitions")
@RequiredArgsConstructor
public class RequisitionController {

    private final RequisitionService requisitionService;

    @GetMapping
    public List<Requisition> getAll(@RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return requisitionService.getByStatus(Requisition.ReqStatus.valueOf(status.toUpperCase()));
        }
        return requisitionService.getAll();
    }

    @GetMapping("/{id}")
    public Requisition getById(@PathVariable Long id) { return requisitionService.getById(id); }

    @PostMapping
    public Requisition create(@RequestBody Requisition req) { return requisitionService.create(req); }

    @PutMapping("/{id}")
    public Requisition update(@PathVariable Long id, @RequestBody Requisition req) {
        return requisitionService.update(id, req);
    }

    @PostMapping("/{id}/lines")
    public RequisitionLine addLine(@PathVariable Long id, @RequestBody RequisitionLine line) {
        return requisitionService.addLine(id, line);
    }

    @DeleteMapping("/{id}/lines/{lineId}")
    public ResponseEntity<Void> removeLine(@PathVariable Long id, @PathVariable Long lineId) {
        requisitionService.removeLine(id, lineId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    public Requisition submit(@PathVariable Long id) { return requisitionService.submit(id); }

    @PostMapping("/{id}/approve")
    public Requisition approve(@PathVariable Long id, @RequestBody(required = false) ApprovalRequest req) {
        String by = req != null ? req.getApprovedBy() : "System";
        return requisitionService.approve(id, by);
    }

    @PostMapping("/{id}/reject")
    public Requisition reject(@PathVariable Long id, @RequestBody(required = false) ApprovalRequest req) {
        String notes = req != null ? req.getNotes() : null;
        return requisitionService.reject(id, notes);
    }

    @Data
    static class ApprovalRequest {
        private String approvedBy;
        private String notes;
    }
}
