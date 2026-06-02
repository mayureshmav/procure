package com.ocrreader.service;

import com.ocrreader.model.*;
import com.ocrreader.repository.OcrDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentProcessingService {

    private final OcrService ocrService;
    private final FieldExtractorService fieldExtractor;
    private final OcrDocumentRepository documentRepository;

    @Value("${ocr.processing.mandatory-fields:invoiceNumber,invoiceDate,vendorName,grandTotal}")
    private String mandatoryFieldsConfig;

    @Value("${ocr.processing.enable-duplicate-detection:true}")
    private boolean enableDuplicateDetection;

    @Value("${ocr.processing.enable-auto-classification:true}")
    private boolean enableAutoClassification;

    @Value("${ocr.tesseract.default-language:eng}")
    private String defaultLanguage;

    /**
     * Asynchronously process a document through the OCR pipeline.
     *
     * NOTE: @Transactional is intentionally NOT placed here alongside @Async.
     * Combining both on the same method in the same Spring context causes the
     * @Transactional proxy to wrap the already-proxied @Async method, which leads
     * to subtle Spring AOP ordering issues. Instead, each repository.save() call
     * runs inside the JPA repository's own @Transactional boundary, which is
     * correct — each state transition is persisted atomically and independently.
     *
     * @param documentId the ID of the already-saved OcrDocument
     * @param file       the source file to OCR; may be null for reprocess-from-rawText
     */
    @Async("ocrTaskExecutor")
    public void processAsync(String documentId, File file) {
        OcrDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        log.info("Starting OCR processing for document: {}", documentId);
        doc.setStatus(DocumentStatus.PROCESSING);
        doc = documentRepository.save(doc);
        addAudit(doc, "OCR_STARTED", "system", "OCR extraction started");
        documentRepository.save(doc);

        try {
            String rawText;

            if (file != null && file.exists()) {
                // ── Normal path: OCR from uploaded file ──────────────────────
                rawText = ocrService.extractText(file, defaultLanguage);
                doc.setRawText(rawText);
                // Clean up temp file after successful extraction
                deleteSilently(file);
            } else if (doc.getRawText() != null && !doc.getRawText().isBlank()) {
                // ── Reprocess path: re-run extraction on stored raw text ──────
                rawText = doc.getRawText();
                log.info("Reprocessing document {} from stored rawText ({} chars)", documentId, rawText.length());
            } else {
                throw new IllegalStateException(
                    "No source file and no cached raw text available for document: " + documentId);
            }

            int confidence = ocrService.calculateConfidence(rawText);
            doc.setOverallConfidence(confidence);

            // Clear previously extracted fields before re-populating
            doc.getExtractedFields().clear();
            List<ExtractedField> fields = fieldExtractor.extract(doc, rawText);
            doc.getExtractedFields().addAll(fields);

            // Auto-classify document type
            if (enableAutoClassification) {
                classifyDocument(doc, rawText);
            }

            // Duplicate detection
            if (enableDuplicateDetection && doc.getInvoiceNumber() != null) {
                checkDuplicate(doc);
            }

            // Validate mandatory fields (skip if already flagged duplicate)
            if (!doc.isDuplicate()) {
                validateMandatoryFields(doc);
            }

            doc.setProcessedAt(LocalDateTime.now());
            addAudit(doc, "OCR_COMPLETED", "system",
                String.format("Extraction complete. Confidence: %d%%. Status: %s", confidence, doc.getStatus()));

        } catch (Exception e) {
            log.error("OCR processing failed for document {}: {}", documentId, e.getMessage(), e);
            if (file != null) deleteSilently(file);
            doc.setStatus(DocumentStatus.FAILED);
            doc.setErrorMessage("OCR processing error: " + e.getMessage());
            doc.setProcessedAt(LocalDateTime.now());
            addAudit(doc, "OCR_FAILED", "system", "Error: " + e.getMessage());
        }

        documentRepository.save(doc);
        log.info("OCR processing completed for document: {} → status={}", documentId, doc.getStatus());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void classifyDocument(OcrDocument doc, String rawText) {
        String lower = rawText.toLowerCase();
        if (lower.contains("credit memo") || lower.contains("credit note") || lower.contains("cr memo")) {
            doc.setDocumentType(DocumentType.CREDIT_MEMO);
        } else if (lower.contains("invoice") || lower.contains("bill") || lower.contains("tax invoice")) {
            doc.setDocumentType(DocumentType.INVOICE);
        }
        // else: leave as UNKNOWN
    }

    private void checkDuplicate(OcrDocument doc) {
        documentRepository.findTopByInvoiceNumberAndIdNot(doc.getInvoiceNumber(), doc.getId())
            .ifPresent(existing -> {
                doc.setDuplicate(true);
                doc.setStatus(DocumentStatus.DUPLICATE);
                doc.setErrorMessage("Duplicate of document ID: " + existing.getId()
                    + " (Invoice#: " + existing.getInvoiceNumber() + ")");
                addAudit(doc, "DUPLICATE_DETECTED", "system",
                    "Invoice number '" + doc.getInvoiceNumber()
                    + "' matches existing document " + existing.getId());
            });
    }

    private void validateMandatoryFields(OcrDocument doc) {
        List<String> mandatory = Arrays.asList(mandatoryFieldsConfig.split(","));
        List<String> missing = mandatory.stream()
            .filter(field -> isMissing(doc, field.trim()))
            .toList();

        if (missing.isEmpty()) {
            doc.setStatus(DocumentStatus.SUCCESSFUL);
        } else {
            doc.setStatus(DocumentStatus.PENDING);
            doc.setErrorMessage("Missing mandatory fields: " + String.join(", ", missing));
            addAudit(doc, "VALIDATION_PENDING", "system",
                "Missing fields: " + String.join(", ", missing));
        }
    }

    private boolean isMissing(OcrDocument doc, String field) {
        return switch (field) {
            case "invoiceNumber" -> isBlank(doc.getInvoiceNumber());
            case "invoiceDate"   -> doc.getInvoiceDate() == null;
            case "vendorName"    -> isBlank(doc.getVendorName());
            case "grandTotal"    -> doc.getGrandTotal() == null;
            case "subtotal"      -> doc.getSubtotal() == null;
            case "taxAmount"     -> doc.getTaxAmount() == null;
            case "bankDetails"   -> isBlank(doc.getBankDetails());
            case "poReference"   -> isBlank(doc.getPoReference());
            default -> {
                log.warn("Unknown mandatory field configured: {}", field);
                yield false;
            }
        };
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private void addAudit(OcrDocument doc, String action, String user, String details) {
        AuditEntry entry = AuditEntry.builder()
            .document(doc)
            .action(action)
            .user(user)
            .details(details)
            .build();
        doc.getAuditLog().add(entry);
    }

    private void deleteSilently(File file) {
        try {
            if (file != null && file.exists()) {
                file.delete();
                log.debug("Deleted temp file: {}", file.getAbsolutePath());
            }
        } catch (Exception e) {
            log.warn("Could not delete temp file {}: {}", file.getAbsolutePath(), e.getMessage());
        }
    }
}
