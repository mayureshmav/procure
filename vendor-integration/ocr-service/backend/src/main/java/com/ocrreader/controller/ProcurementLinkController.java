package com.ocrreader.controller;

import com.ocrreader.dto.DocumentDTO;
import com.ocrreader.model.OcrDocument;
import com.ocrreader.repository.OcrDocumentRepository;
import com.ocrreader.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Handles procurement-side linkage of OCR-processed documents to
 * vendors and purchase orders in the P2P system.
 *
 * Endpoint: POST /api/documents/{id}/link
 * Called by the procure frontend via the /api proxy on port 8080,
 * which in turn routes to this OCR service on port 8081.
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class ProcurementLinkController {

    private final OcrDocumentRepository documentRepository;
    private final DocumentService        documentService;

    /**
     * Link an OCR document to a procurement vendor and/or PO.
     *
     * Request body (all fields optional):
     * {
     *   "vendorId":    42,
     *   "poId":        7,
     *   "poReference": "PO-2024-0042"
     * }
     */
    @PostMapping("/{id}/link")
    public ResponseEntity<DocumentDTO> linkToProcurement(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload
    ) {
        OcrDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));

        if (payload.containsKey("vendorId") && payload.get("vendorId") != null) {
            doc.setLinkedVendorId(((Number) payload.get("vendorId")).longValue());
        }
        if (payload.containsKey("poId") && payload.get("poId") != null) {
            doc.setLinkedPoId(((Number) payload.get("poId")).longValue());
        }
        if (payload.containsKey("poReference") && payload.get("poReference") != null) {
            String ref = payload.get("poReference").toString();
            doc.setPoReference(ref);
            doc.setMatchedPo(ref);
        }

        documentRepository.save(doc);
        return ResponseEntity.ok(documentService.getDocument(id));
    }

    /**
     * Return OCR documents pending procurement review
     * (SUCCESSFUL status, not yet linked to a PO).
     */
    @GetMapping("/pending-link")
    public ResponseEntity<?> getPendingLink() {
        return ResponseEntity.ok(
            documentRepository.findAll().stream()
                .filter(d -> "SUCCESSFUL".equals(d.getStatus().name()) && d.getLinkedPoId() == null)
                .toList()
        );
    }
}
