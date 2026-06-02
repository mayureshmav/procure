package com.ocrreader.repository;

import com.ocrreader.model.DocumentStatus;
import com.ocrreader.model.OcrDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OcrDocumentRepository extends JpaRepository<OcrDocument, String> {

    Page<OcrDocument> findByStatus(DocumentStatus status, Pageable pageable);

    /**
     * Search with optional status filter and keyword search across fileName, vendorName,
     * invoiceNumber. Explicit parentheses ensure correct AND/OR precedence.
     */
    @Query("""
        SELECT d FROM OcrDocument d
        WHERE (:status IS NULL OR d.status = :status)
          AND (:search IS NULL OR (
                LOWER(d.fileName)      LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(d.vendorName)    LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(d.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%'))
          ))
        """)
    Page<OcrDocument> search(
        @Param("status") DocumentStatus status,
        @Param("search") String search,
        Pageable pageable
    );

    Optional<OcrDocument> findTopByInvoiceNumberAndIdNot(String invoiceNumber, String id);

    List<OcrDocument> findByStatus(DocumentStatus status);

    long countByStatus(DocumentStatus status);
}
