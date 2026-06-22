package com.procurement.service;

import com.procurement.model.PoDispatchLog;
import com.procurement.model.PurchaseOrder;
import com.procurement.repository.PoDispatchLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Stub dispatch service — logs every dispatch attempt to po_dispatch_log.
 *
 * In production this would integrate with an SMTP or EDI adapter.
 * For now it logs the intent and writes a SENT record so the
 * frontend can display a dispatch badge.
 *
 * CONFIRMING POs are NOT dispatched (they are internal documentation only).
 */
@Service
@RequiredArgsConstructor
public class PoDispatchService {

    private static final Logger log = LoggerFactory.getLogger(PoDispatchService.class);

    private final PoDispatchLogRepository dispatchRepo;

    /**
     * Dispatch a PO to its vendor.
     * Determines channel: EDI for vendors with EDI capability (stubbed as random),
     * EMAIL otherwise.
     *
     * @return the created dispatch log entry
     */
    @Transactional
    public PoDispatchLog dispatch(PurchaseOrder po) {
        // CONFIRMING POs are never transmitted
        if (po.getOrderType() == PurchaseOrder.OrderType.CONFIRMING) {
            log.info("PO {} is CONFIRMING — skipping dispatch", po.getPoNumber());
            return null;
        }

        String vendorEmail = po.getVendor() != null && po.getVendor().getEmail() != null
                ? po.getVendor().getEmail()
                : "vendor@example.com";

        // Stub: treat vendors whose name starts with a letter A-M as EDI-capable
        boolean ediCapable = po.getVendor() != null &&
                po.getVendor().getName() != null &&
                po.getVendor().getName().toLowerCase().charAt(0) <= 'm';

        String dispatchType = ediCapable ? "EDI" : "EMAIL";
        String recipient    = ediCapable ? "edi://" + po.getVendor().getName().replaceAll("\\s+", "") : vendorEmail;
        String payloadRef   = "PO-" + po.getPoNumber() + "-" + System.currentTimeMillis();

        log.info("Dispatching PO {} via {} to {}", po.getPoNumber(), dispatchType, recipient);

        PoDispatchLog entry = PoDispatchLog.builder()
                .poId(po.getId())
                .dispatchType(dispatchType)
                .recipient(recipient)
                .sentAt(LocalDateTime.now())
                .status("SENT")
                .payloadRef(payloadRef)
                .build();

        return dispatchRepo.save(entry);
    }

    public List<PoDispatchLog> getLogsForPO(Long poId) {
        return dispatchRepo.findByPoIdOrderBySentAtDesc(poId);
    }
}
