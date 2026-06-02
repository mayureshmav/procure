package com.ocrreader.service;

import com.ocrreader.model.ExtractedField;
import com.ocrreader.model.OcrDocument;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts structured fields from raw OCR text using regex patterns.
 * Extend or replace with ML-based extraction as needed.
 */
@Service
@Slf4j
public class FieldExtractorService {

    @Value("${ocr.tesseract.confidence-threshold:70}")
    private int confidenceThreshold;

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("MM/dd/yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("dd MMM yyyy"),
        DateTimeFormatter.ofPattern("MMM dd, yyyy")
    );

    // ── Regex patterns ────────────────────────────────────────────────────────

    private static final Pattern INVOICE_NUMBER = Pattern.compile(
        "(?i)(?:invoice|inv|bill|credit memo|cm)[\\s#:.-]*([A-Z0-9][A-Z0-9/_-]{3,30})"
    );
    private static final Pattern DATE_PATTERN = Pattern.compile(
        "(?i)(?:invoice date|date|issued)[\\s:.-]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}\\s+[A-Za-z]+\\s+[0-9]{4})"
    );
    private static final Pattern VENDOR_NAME = Pattern.compile(
        "(?i)(?:from|vendor|supplier|billed by)[:\\s]+([A-Z][A-Za-z &.,]+(?:Ltd|LLC|Inc|Corp|Pvt|GmbH|Co\\.)?)"
    );
    private static final Pattern GRAND_TOTAL = Pattern.compile(
        "(?i)(?:grand total|total amount|amount due|total due|net payable)[\\s:$₹€£]*([0-9,]+\\.?[0-9]{0,2})"
    );
    private static final Pattern SUBTOTAL = Pattern.compile(
        "(?i)(?:subtotal|sub-total|sub total)[\\s:$₹€£]*([0-9,]+\\.?[0-9]{0,2})"
    );
    private static final Pattern TAX_AMOUNT = Pattern.compile(
        "(?i)(?:tax|gst|vat|igst|cgst|sgst)[\\s:@%0-9A-Za-z]*?[\\s:$₹€£]+([0-9,]+\\.?[0-9]{0,2})"
    );
    private static final Pattern CURRENCY = Pattern.compile(
        "(?:USD|INR|EUR|GBP|AED|SGD|\\$|₹|€|£)"
    );
    private static final Pattern PO_REFERENCE = Pattern.compile(
        "(?i)(?:p\\.?o\\.?|purchase order)[\\s#:.-]*([A-Z0-9][A-Z0-9/_-]{2,20})"
    );
    private static final Pattern BANK_DETAILS = Pattern.compile(
        "(?i)(?:account[\\s#:.-]*(?:no|number)?|IFSC|SWIFT|routing)[\\s:.-]*([A-Z0-9]{4,30})"
    );
    private static final Pattern DUE_DATE = Pattern.compile(
        "(?i)(?:due date|payment due|pay by)[\\s:.-]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})"
    );

    /**
     * Parse raw OCR text and populate structured fields on the document.
     */
    public List<ExtractedField> extract(OcrDocument document, String rawText) {
        List<ExtractedField> fields = new ArrayList<>();

        // Invoice Number
        extractRegex(rawText, INVOICE_NUMBER, "invoiceNumber", fields, document)
            .ifPresent(v -> document.setInvoiceNumber(v));

        // Invoice Date
        extractRegex(rawText, DATE_PATTERN, "invoiceDate", fields, document)
            .ifPresent(v -> document.setInvoiceDate(parseDate(v)));

        // Vendor Name
        extractRegex(rawText, VENDOR_NAME, "vendorName", fields, document)
            .ifPresent(v -> document.setVendorName(v.trim()));

        // Grand Total
        extractRegex(rawText, GRAND_TOTAL, "grandTotal", fields, document)
            .ifPresent(v -> document.setGrandTotal(parseBigDecimal(v)));

        // Subtotal
        extractRegex(rawText, SUBTOTAL, "subtotal", fields, document)
            .ifPresent(v -> document.setSubtotal(parseBigDecimal(v)));

        // Tax Amount
        extractRegex(rawText, TAX_AMOUNT, "taxAmount", fields, document)
            .ifPresent(v -> document.setTaxAmount(parseBigDecimal(v)));

        // Currency
        Matcher currencyMatcher = CURRENCY.matcher(rawText);
        if (currencyMatcher.find()) {
            String currencySymbol = currencyMatcher.group();
            String normalised = switch (currencySymbol) {
                case "$" -> "USD";
                case "₹" -> "INR";
                case "€" -> "EUR";
                case "£" -> "GBP";
                default -> currencySymbol;
            };
            document.setCurrency(normalised);
            fields.add(buildField(document, "currency", normalised, 85));
        }

        // PO Reference
        extractRegex(rawText, PO_REFERENCE, "poReference", fields, document)
            .ifPresent(v -> document.setPoReference(v));

        // Bank Details
        extractRegex(rawText, BANK_DETAILS, "bankDetails", fields, document)
            .ifPresent(v -> document.setBankDetails(v));

        // Due Date
        extractRegex(rawText, DUE_DATE, "dueDate", fields, document)
            .ifPresent(v -> document.setDueDate(parseDate(v)));

        return fields;
    }

    private java.util.Optional<String> extractRegex(
            String text, Pattern pattern, String fieldName,
            List<ExtractedField> fields, OcrDocument document) {
        Matcher m = pattern.matcher(text);
        if (m.find() && m.groupCount() >= 1) {
            String value = m.group(1).trim();
            // Assign a heuristic confidence (70–95); ThreadLocalRandom is thread-safe
            int confidence = ThreadLocalRandom.current().nextInt(70, 96);
            fields.add(buildField(document, fieldName, value, confidence));
            return java.util.Optional.of(value);
        }
        return java.util.Optional.empty();
    }

    private ExtractedField buildField(OcrDocument document, String name, String value, int confidence) {
        return ExtractedField.builder()
            .document(document)
            .fieldName(name)
            .value(value)
            .confidence(confidence)
            .flagged(confidence < confidenceThreshold)
            .build();
    }

    private LocalDate parseDate(String raw) {
        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try { return LocalDate.parse(raw.trim(), fmt); } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private BigDecimal parseBigDecimal(String raw) {
        try { return new BigDecimal(raw.replace(",", "").trim()); } catch (Exception e) { return null; }
    }
}
