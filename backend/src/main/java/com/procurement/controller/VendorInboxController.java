package com.procurement.controller;

import com.procurement.model.PurchaseOrder;
import com.procurement.model.User;
import com.procurement.repository.PurchaseOrderRepository;
import com.procurement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Vendor Inbox — exposes POs that have been submitted/sent to the calling vendor.
 *
 * A vendor user logs in and sees all POs where vendor_id matches their linked vendor,
 * in status SUBMITTED, ACKNOWLEDGED, PARTIALLY_RECEIVED, RECEIVED, CLOSED, or CANCELLED.
 *
 * The response shape maps to the VendorInboxMessage interface on the frontend.
 */
@RestController
@RequestMapping("/api/vendor-inbox")
@RequiredArgsConstructor
public class VendorInboxController {

    private final PurchaseOrderRepository poRepository;
    private final UserRepository userRepository;

    // ── List ─────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long vendorId = resolveVendorId();
        if (vendorId == null) {
            return ResponseEntity.ok(emptyPage());
        }

        List<PurchaseOrder> allPos = poRepository.findByVendorId(vendorId);

        // Only show POs that are beyond DRAFT (i.e. have been "sent" to the vendor)
        List<PurchaseOrder.PoStatus> visibleStatuses = List.of(
                PurchaseOrder.PoStatus.SUBMITTED,
                PurchaseOrder.PoStatus.ACKNOWLEDGED,
                PurchaseOrder.PoStatus.PARTIALLY_RECEIVED,
                PurchaseOrder.PoStatus.RECEIVED,
                PurchaseOrder.PoStatus.CLOSED,
                PurchaseOrder.PoStatus.CANCELLED
        );

        List<Map<String, Object>> messages = allPos.stream()
                .filter(po -> visibleStatuses.contains(po.getStatus()))
                .filter(po -> status == null || status.isBlank() || mapStatus(po).equals(status))
                .sorted(Comparator.comparing(
                        p -> p.getSubmittedAt() != null ? p.getSubmittedAt() : p.getCreatedAt(),
                        Comparator.reverseOrder()))
                .skip((long) page * size)
                .limit(size)
                .map(this::toMessage)
                .collect(Collectors.toList());

        long total = allPos.stream()
                .filter(po -> visibleStatuses.contains(po.getStatus()))
                .filter(po -> status == null || status.isBlank() || mapStatus(po).equals(status))
                .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", messages);
        result.put("totalElements", total);
        result.put("totalPages", (int) Math.ceil((double) total / size));
        result.put("number", page);
        result.put("size", size);
        return ResponseEntity.ok(result);
    }

    // ── Mark read ─────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable String id) {
        PurchaseOrder po = poRepository.findById(Long.parseLong(id)).orElse(null);
        if (po == null) return ResponseEntity.notFound().build();
        // In a real system this would write a read-receipt record.
        // For now we just reflect the current state back as READ.
        Map<String, Object> msg = toMessage(po);
        msg.put("status", "READ");
        return ResponseEntity.ok(msg);
    }

    // ── Acknowledge ───────────────────────────────────────────────────────────

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Map<String, Object>> acknowledge(@PathVariable String id) {
        PurchaseOrder po = poRepository.findById(Long.parseLong(id)).orElse(null);
        if (po == null) return ResponseEntity.notFound().build();

        if (po.getStatus() == PurchaseOrder.PoStatus.SUBMITTED) {
            po.setStatus(PurchaseOrder.PoStatus.ACKNOWLEDGED);
            poRepository.save(po);
        }

        Map<String, Object> msg = toMessage(po);
        msg.put("status", "ACKNOWLEDGED");
        return ResponseEntity.ok(msg);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Long resolveVendorId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .map(u -> u.getVendor() != null ? u.getVendor().getId() : null)
                .orElse(null);
    }

    /** Map PO status → inbox message status */
    private String mapStatus(PurchaseOrder po) {
        return switch (po.getStatus()) {
            case SUBMITTED           -> "UNREAD";
            case ACKNOWLEDGED        -> "ACKNOWLEDGED";
            default                  -> "READ";
        };
    }

    private Map<String, Object> toMessage(PurchaseOrder po) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          String.valueOf(po.getId()));
        m.put("vendorId",    po.getVendor() != null ? po.getVendor().getId()   : null);
        m.put("vendorName",  po.getVendor() != null ? po.getVendor().getName() : null);
        m.put("poId",        po.getId());
        m.put("poNumber",    po.getPoNumber());
        m.put("subject",     "Purchase Order " + po.getPoNumber());
        m.put("type",        "PURCHASE_ORDER");
        m.put("status",      mapStatus(po));
        m.put("sentAt",      po.getSubmittedAt() != null
                ? po.getSubmittedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : po.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        m.put("totalAmount", po.getTotalAmount());
        m.put("currency",    po.getTaxCurrency() != null ? po.getTaxCurrency() : "USD");
        m.put("lineCount",   po.getLines() != null ? po.getLines().size() : 0);
        m.put("deliveryDate", po.getDeliveryDate() != null ? po.getDeliveryDate().toString() : null);
        m.put("orderType",   po.getOrderType() != null ? po.getOrderType().name() : "STANDARD");
        m.put("notes",       po.getNotes());
        return m;
    }

    private Map<String, Object> emptyPage() {
        return Map.of(
                "content", List.of(),
                "totalElements", 0,
                "totalPages", 0,
                "number", 0,
                "size", 20
        );
    }
}
