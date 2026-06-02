package com.ocrreader.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocrreader.dto.DocumentDTO;
import com.ocrreader.dto.DocumentDTO.*;
import com.ocrreader.dto.QueueStatsDTO;
import com.ocrreader.model.*;
import com.ocrreader.repository.OcrDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final OcrDocumentRepository documentRepository;
    private final DocumentProcessingService processingService;
    private final ObjectMapper objectMapper;

    @Value("${ocr.processing.temp-dir:${java.io.tmpdir}/ocr-reader}")
    private String tempDir;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * List documents. @Transactional(readOnly=true) is required to keep the
     * Hibernate session open so lazy-loaded collections (extractedFields, auditLog)
     * are accessible during DTO mapping.
     */
    @Transactional(readOnly = true)
    public Page<DocumentDTO> listDocuments(DocumentStatus status, String search, Pageable pageable) {
        return documentRepository.search(status, search, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public DocumentDTO getDocument(String id) {
        return toDTO(findOrThrow(id));
    }

    /**
     * Save the document record FIRST (commits immediately via JPA repo's own
     * @Transactional), THEN dispatch the async OCR task. This guarantees the
     * async worker can always find the document in the DB — no race condition.
     * Do NOT annotate this method with @Transactional; the async dispatch must
     * happen AFTER the save is committed.
     */
    public DocumentDTO uploadAndQueue(MultipartFile file) {
        File tempFile = null;
        try {
            // 1. Persist temp file to disk
            Path tempPath = ensureTempDir().resolve(System.currentTimeMillis() + "_" + file.getOriginalFilename());
            file.transferTo(tempPath.toFile());
            tempFile = tempPath.toFile();

            // 2. Create + save document record (commits immediately — no outer tx)
            OcrDocument doc = OcrDocument.builder()
                .fileName(file.getOriginalFilename())
                .sourceType(SourceType.MANUAL)
                .status(DocumentStatus.PENDING)
                .build();
            addAudit(doc, "RECEIVED", "system", "Uploaded manually via UI");
            doc = documentRepository.save(doc);   // JPA repo @Transactional → commits here

            // 3. Dispatch async OCR AFTER save has committed
            final String docId = doc.getId();
            final File fileRef = tempFile;
            processingService.processAsync(docId, fileRef);

            return toDTO(doc);
        } catch (IOException e) {
            // Clean up temp file on failure
            if (tempFile != null) tempFile.delete();
            throw new RuntimeException("Failed to upload document: " + e.getMessage(), e);
        }
    }

    /**
     * Reprocess: clear stale data, save immediately, then dispatch async.
     * Uses the stored rawText path — no @Transactional to avoid race condition.
     */
    public DocumentDTO reprocess(String id) {
        OcrDocument doc = findOrThrow(id);
        doc.setStatus(DocumentStatus.PENDING);
        doc.setErrorMessage(null);
        doc.setOverallConfidence(0);
        doc.setProcessedAt(null);
        // Clear extracted fields — will be repopulated by processing pipeline
        doc.getExtractedFields().clear();
        addAudit(doc, "REPROCESSED", "user", "Manual reprocess triggered from UI");
        doc = documentRepository.save(doc);   // commits immediately

        boolean hasRawText = doc.getRawText() != null && !doc.getRawText().isBlank();
        if (hasRawText) {
            // Pass null file — processAsync will re-extract from stored rawText
            processingService.processAsync(id, null);
        } else {
            // No source material available — fail immediately
            doc.setStatus(DocumentStatus.FAILED);
            doc.setErrorMessage("No source file or cached text available. Please re-upload the document.");
            addAudit(doc, "REPROCESS_FAILED", "system", "No rawText or file available for reprocessing");
            documentRepository.save(doc);
        }
        return toDTO(doc);
    }

    @Transactional
    public DocumentDTO validate(String id, Map<String, String> corrections) {
        OcrDocument doc = findOrThrow(id);
        corrections.forEach((key, value) -> applyCorrection(doc, key, value));

        doc.setStatus(DocumentStatus.SUCCESSFUL);
        doc.setErrorMessage(null);
        addAudit(doc, "VALIDATED", "user",
            "Manual validation applied. Fields corrected: " + String.join(", ", corrections.keySet()));

        return toDTO(documentRepository.save(doc));
    }

    @Transactional(readOnly = true)
    public QueueStatsDTO getStats() {
        return QueueStatsDTO.builder()
            .total(documentRepository.count())
            .pending(documentRepository.countByStatus(DocumentStatus.PENDING))
            .processing(documentRepository.countByStatus(DocumentStatus.PROCESSING))
            .successful(documentRepository.countByStatus(DocumentStatus.SUCCESSFUL))
            .failed(documentRepository.countByStatus(DocumentStatus.FAILED))
            .duplicate(documentRepository.countByStatus(DocumentStatus.DUPLICATE))
            .build();
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private OcrDocument findOrThrow(String id) {
        return documentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));
    }

    /**
     * Apply a user correction to a document field.
     * Covers all editable fields shown in the UI detail panel.
     */
    private void applyCorrection(OcrDocument doc, String field, String value) {
        switch (field) {
            case "vendorName"    -> doc.setVendorName(value);
            case "vendorAddress" -> doc.setVendorAddress(value);
            case "vendorContact" -> doc.setVendorContact(value);
            case "invoiceNumber" -> doc.setInvoiceNumber(value);
            case "invoiceDate"   -> doc.setInvoiceDate(parseDate(value));
            case "poReference"   -> doc.setPoReference(value);
            case "currency"      -> doc.setCurrency(value);
            case "subtotal"      -> doc.setSubtotal(parseBigDecimal(value));
            case "taxAmount"     -> doc.setTaxAmount(parseBigDecimal(value));
            case "grandTotal"    -> doc.setGrandTotal(parseBigDecimal(value));
            case "paymentTerms"  -> doc.setPaymentTerms(value);
            case "dueDate"       -> doc.setDueDate(parseDate(value));
            case "bankDetails"   -> doc.setBankDetails(value);
            default              -> log.warn("Unknown correction field ignored: {}", field);
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try { return LocalDate.parse(value); } catch (Exception e) {
            log.warn("Could not parse date correction value: {}", value);
            return null;
        }
    }

    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.isBlank()) return null;
        try { return new BigDecimal(value.replace(",", "").trim()); } catch (Exception e) {
            log.warn("Could not parse numeric correction value: {}", value);
            return null;
        }
    }

    private void addAudit(OcrDocument doc, String action, String user, String details) {
        AuditEntry entry = AuditEntry.builder()
            .document(doc)
            .action(action)
            .user(user)
            .details(details)
            .timestamp(LocalDateTime.now())
            .build();
        doc.getAuditLog().add(entry);
    }

    private Path ensureTempDir() throws IOException {
        Path dir = Path.of(tempDir);
        if (!Files.exists(dir)) Files.createDirectories(dir);
        return dir;
    }

    // ── DTO mapping ───────────────────────────────────────────────────────────

    private DocumentDTO toDTO(OcrDocument doc) {
        return DocumentDTO.builder()
            .id(doc.getId())
            .fileName(doc.getFileName())
            .documentType(doc.getDocumentType())
            .status(doc.getStatus())
            .sourceType(doc.getSourceType())
            .receivedAt(doc.getReceivedAt())
            .processedAt(doc.getProcessedAt())
            .vendorName(doc.getVendorName())
            .vendorAddress(doc.getVendorAddress())
            .vendorContact(doc.getVendorContact())
            .invoiceNumber(doc.getInvoiceNumber())
            .invoiceDate(doc.getInvoiceDate())
            .poReference(doc.getPoReference())
            .currency(doc.getCurrency())
            .subtotal(doc.getSubtotal())
            .taxAmount(doc.getTaxAmount())
            .grandTotal(doc.getGrandTotal())
            .paymentTerms(doc.getPaymentTerms())
            .dueDate(doc.getDueDate())
            .bankDetails(doc.getBankDetails())
            .overallConfidence(doc.getOverallConfidence())
            .isDuplicate(doc.isDuplicate())
            .errorMessage(doc.getErrorMessage())
            .extractedFields(doc.getExtractedFields().stream().map(f ->
                ExtractedFieldDTO.builder()
                    .fieldName(f.getFieldName())
                    .value(f.getValue())
                    .confidence(f.getConfidence())
                    .flagged(f.isFlagged())
                    .build()).toList())
            .lineItems(parseLineItems(doc.getLineItemsJson()))
            .auditLog(doc.getAuditLog().stream().map(a ->
                AuditEntryDTO.builder()
                    .timestamp(a.getTimestamp())
                    .action(a.getAction())
                    .user(a.getUser())
                    .details(a.getDetails())
                    .build()).toList())
            .build();
    }

    private List<LineItemDTO> parseLineItems(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse lineItemsJson: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
