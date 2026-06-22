package com.procurement.controller;

import com.procurement.model.PurchaseOrder;
import com.procurement.model.VendorInboxEvent;
import com.procurement.repository.PurchaseOrderRepository;
import com.procurement.repository.UserRepository;
import com.procurement.repository.VendorInboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Vendor Inbox — exposes POs sent to the calling vendor.
 * Read/unread state is persisted in vendor_inbox_events table (V12 migration).
 */
@RestController
@RequestMapping("/api/vendor-inbox")
@RequiredArgsConstructor
public class VendorInboxController {

    private final PurchaseOrderRepository      poRepository;
    private final UserRepository               userRepository;
    private final VendorInboxEventRepository   eventRepository;

    // ── List ─────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long vendorId = resolveVendorId();
        if (vendorId == null) return ResponseEntity.ok(emptyPage());

        List<PurchaseOrder> allPos = poRepository.findByVendorId(vendorId);

        List<PurchaseOrder.PoStatus> visibleStatuses = List.of(
                PurchaseOrder.PoStatus.SUBMITTED,
                PurchaseOrder.PoStatus.ACKNOWLEDGED,
                PurchaseOrder.PoStatus.PARTIALLY_RECEIVED,
                PurchaseOrder.PoStatus.RECEIVED,
                PurchaseOrder.PoStatus.CLOSED,
                PurchaseOrder.PoStatus.CANCELLED
        );

        // Ensure inbox events exist for all visible POs (lazy-create UNREAD on first list)
        for (PurchaseOrder po : allPos) {
            if (visibleStatuses.contains(po.getStatus())) {
                eventRepository.findByPoIdAndVendorId(po.getId(), vendorId)
                        .orElseGet(() -> eventRepository.save(VendorInboxEvent.builder()
                                .poId(po.getId())
                                .vendorId(vendorId)
                                .status("UNREAD")
                                .build()));
            }
        }

        // Fetch events map for fast lookup
        Map<Long, VendorInboxEvent> eventMap = eventRepository.findByVendorId(vendorId).stream()
                .collect(Collectors.toMap(VendorInboxEvent::getPoId, e -> e, (a, b) -> a));

        List<Map<String, Object>> messages = allPos.stream()
                .filter(po -> visibleStatuses.contains(po.getStatus()))
                .filter(po -> {
                    if (status == null || status.isBlank()) return true;
                    VendorInboxEvent ev = eventMap.get(po.getId());
                    String st = ev != null ? ev.getStatus() : "UNREAD";
                    return st.equals(status);
                })
                .sorted(Comparator.comparing(
                        p -> p.getSubmittedAt() != null ? p.getSubmittedAt() : p.getCreatedAt(),
                        Comparator.reverseOrder()))
                .skip((long) page * size)
                .limit(size)
                .map(po -> toMessage(po, eventMap.get(po.getId())))
                .collect(Collectors.toList());

        long total = allPos.stream()
                .filter(po -> visibleStatuses.contains(po.getStatus()))
                .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", messages);
        result.put("totalElements", total);
        result.put("totalPages", (int) Math.ceil((double) total / size));
        result.put("number", page);
        result.put("size", size);
        result.put("unreadCount", eventRepository.countByVendorIdAndStatus(vendorId, "UNREAD"));
        return ResponseEntity.ok(result);
    }

    // ── Mark read ─────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable String id) {
        Long poId = Long.parseLong(id);
        PurchaseOrder po = poRepository.findById(poId).orElse(null);
        if (po == null) return ResponseEntity.notFound().build();

        Long vendorId = resolveVendorId();
        if (vendorId != null) {
            VendorInboxEvent ev = eventRepository.findByPoIdAndVendorId(poId, vendorId)
                    .orElseGet(() -> VendorInboxEvent.builder().poId(poId).vendorId(vendorId).build());
            if (!"ACKNOWLEDGED".equals(ev.getStatus())) {
                ev.setStatus("READ");
                ev.setReadAt(LocalDateTime.now());
                eventRepository.save(ev);
            }
        }

        return ResponseEntity.ok(toMessage(po, eventRepository.findByPoIdAndVendorId(poId, vendorId != null ? vendorId : -1L).orElse(null)));
    }

    // ── Acknowledge ───────────────────────────────────────────────────────────

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Map<String, Object>> acknowledge(@PathVariable String id) {
        Long poId = Long.parseLong(id);
        PurchaseOrder po = poRepository.findById(poId).orElse(null);
        if (po == null) return ResponseEntity.notFound().build();

        if (po.getStatus() == PurchaseOrder.PoStatus.SUBMITTED) {
            po.setStatus(PurchaseOrder.PoStatus.ACKNOWLEDGED);
            poRepository.save(po);
        }

        Long vendorId = resolveVendorId();
        if (vendorId != null) {
            VendorInboxEvent ev = eventRepository.findByPoIdAndVendorId(poId, vendorId)
                    .orElseGet(() -> VendorInboxEvent.builder().poId(poId).vendorId(vendorId).build());
            ev.setStatus("ACKNOWLEDGED");
            if (ev.getReadAt() == null) ev.setReadAt(LocalDateTime.now());
            ev.setAckAt(LocalDateTime.now());
            eventRepository.save(ev);
        }

        return ResponseEntity.ok(toMessage(po, eventRepository.findByPoIdAndVendorId(poId, vendorId != null ? vendorId : -1L).orElse(null)));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Long resolveVendorId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .map(u -> u.getVendor() != null ? u.getVendor().getId() : null)
                .orElse(null);
    }

    private Map<String, Object> toMessage(PurchaseOrder po, VendorInboxEvent event) {
        String status = event != null ? event.getStatus() : "UNREAD";
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          String.valueOf(po.getId()));
        m.put("vendorId",    po.getVendor() != null ? po.getVendor().getId()   : null);
        m.put("vendorName",  po.getVendor() != null ? po.getVendor().getName() : null);
        m.put("poId",        po.getId());
        m.put("poNumber",    po.getPoNumber());
        m.put("subject",     "Purchase Order " + po.getPoNumber());
        m.put("type",        "PURCHASE_ORDER");
        m.put("status",      status);
        m.put("sentAt",      po.getSubmittedAt() != null
                ? po.getSubmittedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : po.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        m.put("readAt",      event != null && event.getReadAt() != null
                ? event.getReadAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        m.put("ackAt",       event != null && event.getAckAt() != null
                ? event.getAckAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
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
                "size", 20,
                "unreadCount", 0
        );
    }
}
