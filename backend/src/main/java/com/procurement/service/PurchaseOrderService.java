package com.procurement.service;

import com.procurement.model.*;
import com.procurement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final PurchaseOrderLineRepository lineRepository;
    private final RequisitionRepository requisitionRepository;
    private final InventoryItemRepository inventoryItemRepository;

    private static final AtomicLong seqCounter = new AtomicLong(1000);

    public List<PurchaseOrder> getAll() { return poRepository.findAll(); }

    public List<PurchaseOrder> getByStatus(PurchaseOrder.PoStatus status) {
        return poRepository.findByStatus(status);
    }

    public PurchaseOrder getById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found: " + id));
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
        return poRepository.save(po);
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

        for (PurchaseOrderLine line : lines) {
            Integer qty = receivedQtys.get(line.getId());
            if (qty != null && qty > 0) {
                int newReceived = (line.getReceivedQty() != null ? line.getReceivedQty() : 0) + qty;
                line.setReceivedQty(newReceived);
                lineRepository.save(line);

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

    public long countByStatus(PurchaseOrder.PoStatus status) {
        return poRepository.countByStatus(status);
    }
}
