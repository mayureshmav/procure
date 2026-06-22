package com.procurement.controller;

import com.procurement.model.PurchaseOrder;
import com.procurement.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Finance endpoints — derive AP payables and GL journal entries from real PO data.
 *
 * AP:  POs in RECEIVED / PARTIALLY_RECEIVED / CLOSED status (goods received = liability to pay vendor)
 * GL:  POs in SUBMITTED+ status (each submission = debit to expense/asset account, credit to AP)
 */
@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final PurchaseOrderRepository poRepository;

    private static final AtomicLong glSeq = new AtomicLong(1000);

    // ── Accounts Payable ──────────────────────────────────────────────────────

    @GetMapping("/ap/invoices")
    public List<Map<String, Object>> getApInvoices(
            @RequestParam(required = false) String status) {

        List<PurchaseOrder.PoStatus> apStatuses = List.of(
                PurchaseOrder.PoStatus.PARTIALLY_RECEIVED,
                PurchaseOrder.PoStatus.RECEIVED,
                PurchaseOrder.PoStatus.CLOSED
        );

        return poRepository.findAll().stream()
                .filter(po -> apStatuses.contains(po.getStatus()))
                .filter(po -> {
                    if (status == null || status.isBlank()) return true;
                    return deriveInvoiceStatus(po).equals(status);
                })
                .sorted(Comparator.comparing(
                        p -> p.getSubmittedAt() != null ? p.getSubmittedAt() : p.getCreatedAt(),
                        Comparator.reverseOrder()))
                .map(this::toApInvoice)
                .collect(Collectors.toList());
    }

    @GetMapping("/ap/summary")
    public Map<String, Object> getApSummary() {
        List<PurchaseOrder> apPos = poRepository.findAll().stream()
                .filter(po -> List.of(
                        PurchaseOrder.PoStatus.PARTIALLY_RECEIVED,
                        PurchaseOrder.PoStatus.RECEIVED,
                        PurchaseOrder.PoStatus.CLOSED
                ).contains(po.getStatus()))
                .collect(Collectors.toList());

        BigDecimal totalOutstanding = apPos.stream()
                .filter(p -> !"PAID".equals(deriveInvoiceStatus(p)))
                .map(p -> p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = apPos.stream()
                .filter(p -> "PAID".equals(deriveInvoiceStatus(p)))
                .map(p -> p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long overdueCount = apPos.stream()
                .filter(p -> "OVERDUE".equals(deriveInvoiceStatus(p)))
                .count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalOutstanding", totalOutstanding);
        summary.put("totalPaid", totalPaid);
        summary.put("overdueCount", overdueCount);
        summary.put("invoiceCount", apPos.size());
        summary.put("currency", "USD");
        return summary;
    }

    // ── General Ledger ────────────────────────────────────────────────────────

    @GetMapping("/gl/transactions")
    public List<Map<String, Object>> getGlTransactions(
            @RequestParam(required = false) String type) {

        List<PurchaseOrder.PoStatus> glStatuses = List.of(
                PurchaseOrder.PoStatus.SUBMITTED,
                PurchaseOrder.PoStatus.ACKNOWLEDGED,
                PurchaseOrder.PoStatus.PARTIALLY_RECEIVED,
                PurchaseOrder.PoStatus.RECEIVED,
                PurchaseOrder.PoStatus.CLOSED
        );

        List<Map<String, Object>> entries = new ArrayList<>();
        long seq = 1;

        for (PurchaseOrder po : poRepository.findAll()) {
            if (!glStatuses.contains(po.getStatus())) continue;

            String date = po.getSubmittedAt() != null
                    ? po.getSubmittedAt().format(DateTimeFormatter.ISO_LOCAL_DATE)
                    : po.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE);

            BigDecimal amt = po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal tax = po.getTaxAmount()   != null ? po.getTaxAmount()   : BigDecimal.ZERO;
            String vendorName = po.getVendor() != null ? po.getVendor().getName() : "Unknown";
            String poType = po.getOrderType() != null ? po.getOrderType().name() : "STANDARD";

            // Debit: Expense / Inventory
            Map<String, Object> debit = new LinkedHashMap<>();
            debit.put("id",          "GL-" + String.format("%06d", seq++));
            debit.put("date",        date);
            debit.put("reference",   po.getPoNumber());
            debit.put("description", "PO " + po.getPoNumber() + " — " + vendorName);
            debit.put("account",     "5000 — Purchases");
            debit.put("type",        "DEBIT");
            debit.put("amount",      amt);
            debit.put("currency",    po.getTaxCurrency() != null ? po.getTaxCurrency() : "USD");
            debit.put("poType",      poType);
            debit.put("status",      po.getStatus().name());
            entries.add(debit);

            // Credit: Accounts Payable
            Map<String, Object> credit = new LinkedHashMap<>();
            credit.put("id",          "GL-" + String.format("%06d", seq++));
            credit.put("date",        date);
            credit.put("reference",   po.getPoNumber());
            credit.put("description", "AP — " + vendorName);
            credit.put("account",     "2000 — Accounts Payable");
            credit.put("type",        "CREDIT");
            credit.put("amount",      amt);
            credit.put("currency",    po.getTaxCurrency() != null ? po.getTaxCurrency() : "USD");
            credit.put("poType",      poType);
            credit.put("status",      po.getStatus().name());
            entries.add(credit);

            // Tax entry if applicable
            if (tax.compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> taxEntry = new LinkedHashMap<>();
                taxEntry.put("id",          "GL-" + String.format("%06d", seq++));
                taxEntry.put("date",        date);
                taxEntry.put("reference",   po.getPoNumber());
                taxEntry.put("description", "Tax — " + vendorName);
                taxEntry.put("account",     "2100 — Tax Payable");
                taxEntry.put("type",        "CREDIT");
                taxEntry.put("amount",      tax);
                taxEntry.put("currency",    po.getTaxCurrency() != null ? po.getTaxCurrency() : "USD");
                taxEntry.put("poType",      poType);
                taxEntry.put("status",      po.getStatus().name());
                entries.add(taxEntry);
            }
        }

        if (type != null && !type.isBlank()) {
            entries = entries.stream()
                    .filter(e -> type.equalsIgnoreCase((String) e.get("type")))
                    .collect(Collectors.toList());
        }

        // Sort newest first
        entries.sort(Comparator.comparing(e -> (String) e.get("date"), Comparator.reverseOrder()));
        return entries;
    }

    @GetMapping("/gl/summary")
    public Map<String, Object> getGlSummary() {
        List<Map<String, Object>> txns = getGlTransactions(null);
        BigDecimal totalDebits  = txns.stream().filter(t -> "DEBIT".equals(t.get("type")))
                .map(t -> (BigDecimal) t.get("amount")).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredits = txns.stream().filter(t -> "CREDIT".equals(t.get("type")))
                .map(t -> (BigDecimal) t.get("amount")).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> s = new LinkedHashMap<>();
        s.put("totalDebits",  totalDebits);
        s.put("totalCredits", totalCredits);
        s.put("balance",      totalCredits.subtract(totalDebits));
        s.put("entryCount",   txns.size());
        return s;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> toApInvoice(PurchaseOrder po) {
        String status = deriveInvoiceStatus(po);
        String vendorName = po.getVendor() != null ? po.getVendor().getName() : "Unknown";
        String date = po.getSubmittedAt() != null
                ? po.getSubmittedAt().format(DateTimeFormatter.ISO_LOCAL_DATE)
                : po.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE);

        // Due date: 30 days after submission
        String dueDate = po.getSubmittedAt() != null
                ? po.getSubmittedAt().plusDays(30).format(DateTimeFormatter.ISO_LOCAL_DATE)
                : po.getCreatedAt().plusDays(30).format(DateTimeFormatter.ISO_LOCAL_DATE);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          "INV-" + po.getId());
        m.put("invoiceNo",   "INV-" + po.getPoNumber());
        m.put("poId",        po.getId());
        m.put("poNumber",    po.getPoNumber());
        m.put("vendor",      vendorName);
        m.put("vendorId",    po.getVendor() != null ? po.getVendor().getId() : null);
        m.put("date",        date);
        m.put("dueDate",     dueDate);
        m.put("amount",      po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO);
        m.put("tax",         po.getTaxAmount()   != null ? po.getTaxAmount()   : BigDecimal.ZERO);
        m.put("currency",    po.getTaxCurrency() != null ? po.getTaxCurrency() : "USD");
        m.put("status",      status);
        m.put("poStatus",    po.getStatus().name());
        return m;
    }

    /** Derive AP invoice payment status from PO status */
    private String deriveInvoiceStatus(PurchaseOrder po) {
        return switch (po.getStatus()) {
            case CLOSED              -> "PAID";
            case RECEIVED            -> "PENDING";
            case PARTIALLY_RECEIVED  -> "PARTIAL";
            default                  -> "PENDING";
        };
    }
}
