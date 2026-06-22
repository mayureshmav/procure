package com.procurement.service;

import com.procurement.dto.approval.ApprovalResult;
import com.procurement.model.*;
import com.procurement.repository.*;
import com.procurement.tax.TaxIntegrationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private static final Logger log = LoggerFactory.getLogger(PurchaseOrderService.class);

    private final PurchaseOrderRepository poRepository;
    private final PurchaseOrderLineRepository lineRepository;
    private final RequisitionRepository requisitionRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final TaxIntegrationService taxService;
    private final GRNRepository grnRepository;
    private final ApprovalService approvalService;
    private final PoDispatchService dispatchService;

    private static final AtomicLong seqCounter = new AtomicLong(1000);

    public List<PurchaseOrder> getAll() { return poRepository.findAll(); }

    public List<PurchaseOrder> getByStatus(PurchaseOrder.PoStatus status) {
        return poRepository.findByStatus(status);
    }

    public PurchaseOrder getById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found: " + id));
    }

    /** Persist an already-modified PO (used by TaxIntegrationService after applying tax). */
    public PurchaseOrder save(PurchaseOrder po) {
        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder create(PurchaseOrder po) {
        po.setPoNumber(generatePoNumber());
        po.setStatus(PurchaseOrder.PoStatus.DRAFT);
        po.setCreatedAt(LocalDateTime.now());
        return poRepository.save(po);
    }

    /** Convert an approved REQ into one or more POs (grouped by vendor) */
    @Transactional
    public PurchaseOrder createFromRequisition(Long reqId, Long vendorId) {
        Requisition req = requisitionRepository.findById(reqId)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + reqId));
        if (req.getStatus() != Requisition.ReqStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED requisitions can be converted to POs");
        }

        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(generatePoNumber())
                .requisition(req)
                .status(PurchaseOrder.PoStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .build();

        // Link vendor
        po.setVendor(req.getLines().stream()
                .filter(l -> l.getVendor() != null)
                .map(RequisitionLine::getVendor)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No vendor on REQ lines")));

        PurchaseOrder saved = poRepository.save(po);

        // Create PO lines from REQ lines
        for (RequisitionLine rl : req.getLines()) {
            PurchaseOrderLine pol = PurchaseOrderLine.builder()
                    .purchaseOrder(saved)
                    .item(rl.getItem())
                    .description(rl.getDescription())
                    .orderedQty(rl.getQuantity())
                    .unitPrice(rl.getUnitPrice())
                    .uom(rl.getUom())
                    .glAccount(rl.getGlAccount())
                    .build();
            pol.calcTotal();
            lineRepository.save(pol);
        }

        recalcTotal(saved);

        // Mark REQ as CONVERTED
        req.setStatus(Requisition.ReqStatus.CONVERTED);
        requisitionRepository.save(req);

        return poRepository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    public PurchaseOrderLine addLine(Long poId, PurchaseOrderLine line) {
        PurchaseOrder po = getById(poId);
        if (po.getStatus() != PurchaseOrder.PoStatus.DRAFT) {
            throw new RuntimeException("Can only add lines to DRAFT POs");
        }
        line.setPurchaseOrder(po);
        line.calcTotal();
        PurchaseOrderLine saved = lineRepository.save(line);
        recalcTotal(po);
        return saved;
    }

    @Transactional
    public PurchaseOrder submit(Long id) {
        PurchaseOrder po = getById(id);
        if (po.getStatus() != PurchaseOrder.PoStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT POs can be submitted");
        }
        po.setStatus(PurchaseOrder.PoStatus.SUBMITTED);
        po.setSubmittedAt(LocalDateTime.now());
        // Auto-calculate tax on submission; non-blocking — zero tax returned if engine is down
        taxService.applyTax(po);
        PurchaseOrder saved = poRepository.save(po);

        // Evaluate approval rules (non-blocking — log only; no hard gate yet)
        try {
            String poType = po.getOrderType() != null ? po.getOrderType().name() : "STANDARD";
            ApprovalResult result = approvalService.evaluate(
                    "PO_" + poType, po.getTotalAmount(), poType, null);
            log.info("PO {} approval evaluation: {}", po.getPoNumber(), result.getMessage());
        } catch (Exception ex) {
            log.warn("Approval evaluation failed for PO {} — skipping: {}", po.getPoNumber(), ex.getMessage());
        }

        // Dispatch PO to vendor (email/EDI stub) — non-blocking
        try {
            dispatchService.dispatch(saved);
        } catch (Exception ex) {
            log.warn("Dispatch failed for PO {} — skipping: {}", po.getPoNumber(), ex.getMessage());
        }

        return saved;
    }

    /**
     * Receive goods against a PO.
     * receivedQtys: map of lineId -> qty received
     */
    @Transactional
    public PurchaseOrder receiveGoods(Long poId, Map<Long, Integer> receivedQtys) {
        PurchaseOrder po = getById(poId);
        if (po.getStatus() != PurchaseOrder.PoStatus.SUBMITTED
                && po.getStatus() != PurchaseOrder.PoStatus.ACKNOWLEDGED
                && po.getStatus() != PurchaseOrder.PoStatus.PARTIALLY_RECEIVED) {
            throw new RuntimeException("PO is not in a receivable state");
        }

        List<PurchaseOrderLine> lines = lineRepository.findByPurchaseOrderId(poId);
        boolean allReceived = true;

        // Build GRN header
        long grnCount = grnRepository.count();
        String grnNumber = "GRN-" + String.format("%05d", grnCount + 1);
        GRN grn = GRN.builder()
                .grnNumber(grnNumber)
                .vendor(po.getVendor())
                .receivedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .lines(new ArrayList<>())
                .build();
        GRN savedGrn = grnRepository.save(grn);

        for (PurchaseOrderLine line : lines) {
            Integer qty = receivedQtys.get(line.getId());
            if (qty != null && qty > 0) {
                int newReceived = (line.getReceivedQty() != null ? line.getReceivedQty() : 0) + qty;
                line.setReceivedQty(newReceived);
                lineRepository.save(line);

                // Create GRN line
                GRNLine grnLine = GRNLine.builder()
                        .grn(savedGrn)
                        .purchaseOrderLine(line)
                        .receivedQty(qty)
                        .receivedPrice(line.getUnitPrice())
                        .uom(line.getUom())
                        .build();
                grnLine.calcLineTotal();
                savedGrn.getLines().add(grnLine);

                // Update inventory
                if (line.getItem() != null) {
                    InventoryItem inv = inventoryItemRepository.findByItemId(line.getItem().getId())
                            .orElseGet(() -> InventoryItem.builder().item(line.getItem()).onHandQty(0).build());
                    inv.setOnHandQty(inv.getOnHandQty() + qty);
                    inv.setLastUpdated(LocalDateTime.now());
                    inventoryItemRepository.save(inv);
                }
            }
            if (line.getReceivedQty() == null || line.getReceivedQty() < line.getOrderedQty()) {
                allReceived = false;
            }
        }

        grnRepository.save(savedGrn);

        po.setStatus(allReceived ? PurchaseOrder.PoStatus.RECEIVED : PurchaseOrder.PoStatus.PARTIALLY_RECEIVED);
        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder close(Long id) {
        PurchaseOrder po = getById(id);
        po.setStatus(PurchaseOrder.PoStatus.CLOSED);
        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder cancel(Long id) {
        PurchaseOrder po = getById(id);
        po.setStatus(PurchaseOrder.PoStatus.CANCELLED);
        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder update(Long id, PurchaseOrder updated) {
        PurchaseOrder existing = getById(id);
        existing.setDeliveryDate(updated.getDeliveryDate());
        existing.setNotes(updated.getNotes());
        return poRepository.save(existing);
    }

    private void recalcTotal(PurchaseOrder po) {
        List<PurchaseOrderLine> lines = lineRepository.findByPurchaseOrderId(po.getId());
        BigDecimal total = lines.stream()
                .map(l -> l.getTotalPrice() != null ? l.getTotalPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        po.setTotalAmount(total);
        poRepository.save(po);
    }

    private String generatePoNumber() {
        long count = poRepository.count();
        return "PO-" + String.format("%05d", count + seqCounter.getAndIncrement() % 10000);
    }

    @Transactional
    public void delete(Long id) {
        lineRepository.deleteByPurchaseOrderId(id);
        poRepository.deleteById(id);
    }

    public long countByStatus(PurchaseOrder.PoStatus status) {
        return poRepository.countByStatus(status);
    }

    public List<GRN> getGRNsForPO(Long poId) {
        return grnRepository.findByPurchaseOrderId(poId);
    }

    // ── Blanket PO Release ────────────────────────────────────────────────────

    /**
     * Create a release order against a BLANKET PO.
     * The release is a STANDARD PO linked to the blanket.
     * Enforces: blanket must be SUBMITTED or ACKNOWLEDGED; release amount must not exceed remaining cap.
     */
    @Transactional
    public PurchaseOrder createRelease(Long blanketPoId, BigDecimal releaseAmount, String notes) {
        PurchaseOrder blanket = getById(blanketPoId);
        if (blanket.getOrderType() != PurchaseOrder.OrderType.BLANKET) {
            throw new RuntimeException("PO " + blanket.getPoNumber() + " is not a BLANKET PO");
        }
        if (blanket.getStatus() != PurchaseOrder.PoStatus.SUBMITTED
                && blanket.getStatus() != PurchaseOrder.PoStatus.ACKNOWLEDGED) {
            throw new RuntimeException("Blanket PO must be SUBMITTED or ACKNOWLEDGED to create releases");
        }

        // Check remaining capacity
        BigDecimal alreadyReleased = blanket.getBlanketReleasedAmount() != null
                ? blanket.getBlanketReleasedAmount() : BigDecimal.ZERO;
        BigDecimal maxAmount = blanket.getBlanketMaxAmount();
        if (maxAmount != null && alreadyReleased.add(releaseAmount).compareTo(maxAmount) > 0) {
            throw new RuntimeException("Release amount exceeds blanket cap. Remaining: "
                    + maxAmount.subtract(alreadyReleased));
        }

        // Create release order as a STANDARD PO
        PurchaseOrder release = PurchaseOrder.builder()
                .poNumber(generatePoNumber())
                .vendor(blanket.getVendor())
                .orderType(PurchaseOrder.OrderType.STANDARD)
                .status(PurchaseOrder.PoStatus.DRAFT)
                .totalAmount(releaseAmount)
                .blanketParentId(blanketPoId)
                .notes("Release order against blanket " + blanket.getPoNumber()
                        + (notes != null && !notes.isBlank() ? ". " + notes : ""))
                .createdAt(LocalDateTime.now())
                .build();

        PurchaseOrder saved = poRepository.save(release);

        // Update blanket's released amount and release count
        blanket.setBlanketReleasedAmount(alreadyReleased.add(releaseAmount));
        blanket.setBlanketReleasesCount((blanket.getBlanketReleasesCount() != null
                ? blanket.getBlanketReleasesCount() : 0) + 1);
        poRepository.save(blanket);

        return saved;
    }

    /** Get all release orders for a blanket PO */
    public List<PurchaseOrder> getReleasesForBlanket(Long blanketPoId) {
        return poRepository.findAll().stream()
                .filter(p -> blanketPoId.equals(p.getBlanketParentId()))
                .sorted(Comparator.comparing(PurchaseOrder::getCreatedAt, Comparator.reverseOrder()))
                .collect(java.util.stream.Collectors.toList());
    }
}
