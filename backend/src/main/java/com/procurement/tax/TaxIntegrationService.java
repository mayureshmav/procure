package com.procurement.tax;

import com.procurement.model.PurchaseOrder;
import com.procurement.model.PurchaseOrderLine;
import com.procurement.model.Vendor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Maps P2P PurchaseOrder data into a TaxEngine request, calls the engine,
 * and writes the results back onto the PO and its lines.
 *
 * Called:
 *  - automatically when a PO is submitted (via PurchaseOrderService)
 *  - on-demand via TaxProxyController (manual recalculate button in UI)
 */
@Service
public class TaxIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(TaxIntegrationService.class);

    private final TaxEngineClient client;
    private final String defaultSupplierCountry;
    private final String defaultBuyerCountry;

    public TaxIntegrationService(
            TaxEngineClient client,
            @Value("${taxengine.default-supplier-country:US}") String defaultSupplierCountry,
            @Value("${taxengine.default-buyer-country:US}") String defaultBuyerCountry) {
        this.client = client;
        this.defaultSupplierCountry = defaultSupplierCountry;
        this.defaultBuyerCountry = defaultBuyerCountry;
    }

    /**
     * Calculate tax for all lines on a PurchaseOrder and persist results onto
     * the PO entity (caller must save).
     *
     * @return the updated PurchaseOrder (same instance, mutated in place)
     */
    public PurchaseOrder applyTax(PurchaseOrder po) {
        if (po.getLines() == null || po.getLines().isEmpty()) {
            log.debug("PO {} has no lines — skipping tax calculation", po.getPoNumber());
            return po;
        }

        TaxEngineClient.TaxRequest request = buildRequest(po);
        log.info("Calling Tax Engine for PO {}", po.getPoNumber());

        TaxEngineClient.TaxResult result = client.calculate(request);

        // Write totals onto the PO header
        if (result.totals() != null) {
            po.setTaxAmount(result.totals().totalTax());
        }
        po.setTaxAuditId(result.auditId());
        po.setTaxCurrency(result.baseCurrency() != null ? result.baseCurrency() : "USD");
        po.setTaxCalculatedAt(LocalDateTime.now());

        // Write per-line tax amounts
        if (result.lineResults() != null) {
            Map<String, TaxEngineClient.LineResultDto> byLineId = result.lineResults().stream()
                    .collect(Collectors.toMap(TaxEngineClient.LineResultDto::lineId, lr -> lr));

            for (PurchaseOrderLine line : po.getLines()) {
                String key = "line-" + line.getId();
                TaxEngineClient.LineResultDto lr = byLineId.get(key);
                if (lr != null) {
                    line.setTaxAmount(lr.taxAmount());
                }
            }
        }

        log.info("Tax applied to PO {} — total tax: {} {}", po.getPoNumber(),
                po.getTaxAmount(), po.getTaxCurrency());
        return po;
    }

    // ── Request Builder ────────────────────────────────────────────────────────

    private TaxEngineClient.TaxRequest buildRequest(PurchaseOrder po) {
        Vendor vendor = po.getVendor();

        TaxEngineClient.PartyDto supplier = new TaxEngineClient.PartyDto(
                defaultSupplierCountry,   // vendor country (extend Vendor model to add country later)
                null,
                vendor != null ? vendorTaxId(vendor) : null,
                true,
                null,
                "BUSINESS"
        );

        TaxEngineClient.PartyDto buyer = new TaxEngineClient.PartyDto(
                defaultBuyerCountry,
                null,
                null,
                true,
                null,
                "BUSINESS"
        );

        List<TaxEngineClient.LineItemDto> lineItems = po.getLines().stream()
                .map(line -> new TaxEngineClient.LineItemDto(
                        "line-" + line.getId(),
                        line.getItem() != null ? String.valueOf(line.getItem().getId()) : null,
                        line.getItem() != null ? line.getItem().getCategory() : null,
                        BigDecimal.valueOf(line.getOrderedQty()),
                        line.getUnitPrice(),
                        null,   // no discount field on PO line currently
                        line.getTaxClass(),
                        null
                ))
                .toList();

        return new TaxEngineClient.TaxRequest(
                "PO-" + po.getPoNumber(),
                LocalDate.now(),
                "USD",
                defaultBuyerCountry,
                "PURCHASE",
                supplier,
                buyer,
                lineItems
        );
    }

    private String vendorTaxId(Vendor vendor) {
        // Vendor model doesn't have taxId yet — return null; will be added in future
        return null;
    }
}
