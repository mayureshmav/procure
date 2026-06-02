package com.ocrreader.controller;

import com.ocrreader.dto.DocumentDTO;
import com.ocrreader.dto.QueueStatsDTO;
import com.ocrreader.model.DocumentStatus;
import com.ocrreader.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    /** List documents with optional filtering and pagination */
    @GetMapping
    public ResponseEntity<Page<DocumentDTO>> listDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String documentType
    ) {
        DocumentStatus statusEnum = status != null ? DocumentStatus.valueOf(status) : null;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "receivedAt"));
        return ResponseEntity.ok(documentService.listDocuments(statusEnum, search, pageable));
    }

    /** Get single document by ID */
    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> getDocument(@PathVariable String id) {
        return ResponseEntity.ok(documentService.getDocument(id));
    }

    /** Upload a document manually for OCR processing */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDTO> uploadDocument(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentService.uploadAndQueue(file));
    }

    /** Reprocess a document through the OCR queue */
    @PostMapping("/{id}/reprocess")
    public ResponseEntity<DocumentDTO> reprocess(@PathVariable String id) {
        return ResponseEntity.ok(documentService.reprocess(id));
    }

    /** Validate and apply manual corrections to a document */
    @PostMapping("/{id}/validate")
    public ResponseEntity<DocumentDTO> validate(
            @PathVariable String id,
            @RequestBody Map<String, String> corrections
    ) {
        return ResponseEntity.ok(documentService.validate(id, corrections));
    }

    /** Get queue statistics */
    @GetMapping("/stats")
    public ResponseEntity<QueueStatsDTO> getStats() {
        return ResponseEntity.ok(documentService.getStats());
    }
}
