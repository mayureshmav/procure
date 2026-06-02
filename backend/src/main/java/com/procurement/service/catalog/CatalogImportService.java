package com.procurement.service.catalog;

import com.procurement.model.*;
import com.procurement.model.enums.*;
import com.procurement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogImportService {

    private final CatalogImportJobRepository jobRepo;
    private final ImportFailureLogRepository failureRepo;
    private final VendorRepository vendorRepo;
    private final ItemRepository itemRepo;
    private final FileParserService fileParserService;

    @Value("${catalog.import.temp-dir:/tmp/catalog-imports}")
    private String tempDir;

    public CatalogImportJob createJob(Long vendorId, FileFormatType formatType,
                                       SourceType sourceType, String fileName) {
        Vendor vendor = vendorRepo.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));
        CatalogImportJob job = CatalogImportJob.builder()
                .vendor(vendor)
                .jobRef(UUID.randomUUID().toString())
                .sourceType(sourceType)
                .formatType(formatType)
                .fileName(fileName)
                .status(ImportStatus.PENDING)
                .build();
        return jobRepo.save(job);
    }

    @Async
    public void processUpload(Long jobId, MultipartFile file) {
        CatalogImportJob job = jobRepo.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        try {
            job.setStatus(ImportStatus.PROCESSING);
            job.setStartedAt(LocalDateTime.now());
            jobRepo.save(job);

            Path dir = Paths.get(tempDir);
            Files.createDirectories(dir);
            Path tempFile = dir.resolve(job.getJobRef() + "_" + file.getOriginalFilename());
            file.transferTo(tempFile.toFile());

            List<Map<String, String>> rows = fileParserService.parse(tempFile, job.getFormatType());
            job.setTotalRecords(rows.size());
            jobRepo.save(job);

            int processed = 0, failed = 0;
            for (int i = 0; i < rows.size(); i++) {
                try {
                    processRow(rows.get(i), job, i + 1);
                    processed++;
                } catch (Exception e) {
                    failed++;
                    logFailure(job, i + 1, rows.get(i).get("sku"), null,
                            rows.get(i).toString(), "PARSE_ERROR", e.getMessage(), FailureSeverity.ERROR);
                }
            }
            job.setProcessedRecords(processed);
            job.setFailedRecords(failed);
            job.setStatus(failed == 0 ? ImportStatus.COMPLETED :
                    processed == 0 ? ImportStatus.FAILED : ImportStatus.PARTIAL);
            job.setCompletedAt(LocalDateTime.now());
            jobRepo.save(job);

            Files.deleteIfExists(tempFile);
        } catch (Exception e) {
            log.error("Import job {} failed", jobId, e);
            job.setStatus(ImportStatus.FAILED);
            job.setCompletedAt(LocalDateTime.now());
            jobRepo.save(job);
            logFailure(job, null, null, null, null, "SYSTEM_ERROR", e.getMessage(), FailureSeverity.CRITICAL);
        }
    }

    private void processRow(Map<String, String> row, CatalogImportJob job, int rowNum) {
        String sku = row.get("sku");
        if (sku == null || sku.isBlank()) {
            throw new IllegalArgumentException("SKU is required");
        }

        Item item = itemRepo.findBySku(sku).orElse(Item.builder().sku(sku).build());
        if (row.containsKey("name"))        item.setName(row.get("name"));
        if (row.containsKey("description")) item.setDescription(row.get("description"));
        if (row.containsKey("category"))    item.setCategory(row.get("category"));
        if (row.containsKey("brand"))       item.setBrand(row.get("brand"));
        if (row.containsKey("unit_price") && row.get("unit_price") != null)
            item.setUnitPrice(new java.math.BigDecimal(row.get("unit_price")));
        if (row.containsKey("uom"))         item.setUom(row.get("uom"));
        if (row.containsKey("gtin"))        item.setGtin(row.get("gtin"));
        if (row.containsKey("product_status") && row.get("product_status") != null)
            item.setProductStatus(ProductStatus.valueOf(row.get("product_status").toUpperCase()));

        item.setLastImportedAt(LocalDateTime.now());
        if (item.getVendor() == null) item.setVendor(job.getVendor());
        itemRepo.save(item);
    }

    private void logFailure(CatalogImportJob job, Integer rowNum, String sku,
                             String field, String rawValue,
                             String errorCode, String message, FailureSeverity severity) {
        failureRepo.save(ImportFailureLog.builder()
                .job(job)
                .rowNumber(rowNum)
                .sku(sku)
                .fieldName(field)
                .rawValue(rawValue)
                .errorCode(errorCode)
                .errorMessage(message != null ? message : "Unknown error")
                .severity(severity)
                .build());
    }

    public Page<CatalogImportJob> listJobs(Pageable pageable) {
        return jobRepo.findAllByOrderByCreatedAtDesc(pageable);
    }

    public CatalogImportJob getJob(Long id) {
        return jobRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Job not found"));
    }

    public List<ImportFailureLog> getFailures(Long jobId) {
        return failureRepo.findByJobIdOrderByRowNumberAsc(jobId);
    }
}
