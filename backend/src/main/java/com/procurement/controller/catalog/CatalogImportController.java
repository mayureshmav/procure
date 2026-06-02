package com.procurement.controller.catalog;

import com.procurement.dto.ApiResponse;
import com.procurement.model.CatalogImportJob;
import com.procurement.model.ImportFailureLog;
import com.procurement.model.enums.FileFormatType;
import com.procurement.model.enums.SourceType;
import com.procurement.service.catalog.CatalogImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/catalog/import")
@RequiredArgsConstructor
public class CatalogImportController {

    private final CatalogImportService importService;

    /** Upload a catalog file and kick off async processing */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<CatalogImportJob>> upload(
            @RequestParam("vendorId") Long vendorId,
            @RequestParam("formatType") FileFormatType formatType,
            @RequestParam("file") MultipartFile file) {

        CatalogImportJob job = importService.createJob(
                vendorId, formatType, SourceType.MANUAL_UPLOAD, file.getOriginalFilename());
        importService.processUpload(job.getId(), file);   // async
        return ResponseEntity.ok(ApiResponse.ok("Import job created", job));
    }

    /** List all import jobs (paginated) */
    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<Page<CatalogImportJob>>> listJobs(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<CatalogImportJob> jobs = importService.listJobs(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.ok(jobs));
    }

    /** Get a single job by ID */
    @GetMapping("/jobs/{id}")
    public ResponseEntity<ApiResponse<CatalogImportJob>> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(importService.getJob(id)));
    }

    /** Get failure logs for a job */
    @GetMapping("/jobs/{id}/failures")
    public ResponseEntity<ApiResponse<List<ImportFailureLog>>> getFailures(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(importService.getFailures(id)));
    }
}
