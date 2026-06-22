package com.procurement.tax;

import com.procurement.model.PurchaseOrder;
import com.procurement.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Exposes tax-related endpoints to the P2P frontend.
 *
 * POST /api/tax/calculate-po/{poId}   — (re)calculate tax for a PO on demand
 * GET  /api/tax/summary/{poId}        — return current tax figures for a PO
 */
@RestController
@RequestMapping("/api/tax")
@RequiredArgsConstructor
public class TaxProxyController {

    private final PurchaseOrderService poService;
    private final TaxIntegrationService taxService;

    /**
     * Trigger (or re-trigger) a tax calculation for a specific PO.
     * Results are persisted back to the PO and returned.
     */
    @PostMapping("/calculate-po/{poId}")
    public ResponseEntity<TaxSummaryResponse> calculateForPO(@PathVariable Long poId) {
        PurchaseOrder po = poService.getById(poId);
        po = taxService.applyTax(po);
        poService.save(po);
        return ResponseEntity.ok(TaxSummaryResponse.from(po));
    }

    /**
     * Return the last-calculated tax summary for a PO without recalculating.
     */
    @GetMapping("/summary/{poId}")
    public ResponseEntity<TaxSummaryResponse> summary(@PathVariable Long poId) {
        PurchaseOrder po = poService.getById(poId);
        return ResponseEntity.ok(TaxSummaryResponse.from(po));
    }

    // ── Response DTO ──────────────────────────────────────────────────────────

    public record TaxSummaryResponse(
            Long poId,
            String poNumber,
            java.math.BigDecimal subTotal,
            java.math.BigDecimal taxAmount,
            java.math.BigDecimal totalWithTax,
            String taxCurrency,
            String taxJurisdiction,
            String taxAuditId,
            java.time.LocalDateTime taxCalculatedAt,
            java.util.List<LineTax> lines
    ) {
        public static TaxSummaryResponse from(PurchaseOrder po) {
            java.math.BigDecimal sub = po.getTotalAmount() != null ? po.getTotalAmount() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal tax = po.getTaxAmount() != null ? po.getTaxAmount() : java.math.BigDecimal.ZERO;

            java.util.List<LineTax> lineTaxes = po.getLines() == null ? java.util.List.of() :
                    po.getLines().stream()
                            .map(l -> new LineTax(
                                    l.getId(),
                                    l.getDescription(),
                                    l.getTotalPrice(),
                                    l.getTaxAmount(),
                                    l.getTaxClass()))
                            .toList();

            return new TaxSummaryResponse(
                    po.getId(), po.getPoNumber(),
                    sub, tax, sub.add(tax),
                    po.getTaxCurrency(), po.getTaxJurisdiction(),
                    po.getTaxAuditId(), po.getTaxCalculatedAt(),
                    lineTaxes);
        }
    }

    public record LineTax(
            Long lineId,
            String description,
            java.math.BigDecimal netAmount,
            java.math.BigDecimal taxAmount,
            String taxClass
    ) {}
}
