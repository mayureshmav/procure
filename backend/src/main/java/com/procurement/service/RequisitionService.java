package com.procurement.service;

import com.procurement.model.*;
import com.procurement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class RequisitionService {

    private final RequisitionRepository requisitionRepository;
    private final RequisitionLineRepository lineRepository;
    private final VendorRepository vendorRepository;
    private final ItemRepository itemRepository;

    private static final AtomicLong seqCounter = new AtomicLong(1000);

    public List<Requisition> getAll() { return requisitionRepository.findAll(); }

    public List<Requisition> getByStatus(Requisition.ReqStatus status) {
        return requisitionRepository.findByStatus(status);
    }

    public Requisition getById(Long id) {
        return requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));
    }

    @Transactional
    public Requisition create(Requisition req) {
        req.setReqNumber(generateReqNumber());
        req.setStatus(Requisition.ReqStatus.DRAFT);
        req.setCreatedAt(LocalDateTime.now());
        return requisitionRepository.save(req);
    }

    @Transactional
    public RequisitionLine addLine(Long reqId, RequisitionLine line) {
        Requisition req = getById(reqId);
        if (req.getStatus() != Requisition.ReqStatus.DRAFT) {
            throw new RuntimeException("Can only add lines to DRAFT requisitions");
        }
        line.setRequisition(req);
        line.calcTotal();
        RequisitionLine saved = lineRepository.save(line);
        recalcTotal(req);
        return saved;
    }

    @Transactional
    public void removeLine(Long reqId, Long lineId) {
        Requisition req = getById(reqId);
        lineRepository.deleteById(lineId);
        recalcTotal(req);
    }

    @Transactional
    public Requisition submit(Long id) {
        Requisition req = getById(id);
        if (req.getStatus() != Requisition.ReqStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT requisitions can be submitted");
        }
        req.setStatus(Requisition.ReqStatus.SUBMITTED);
        req.setSubmittedAt(LocalDateTime.now());
        return requisitionRepository.save(req);
    }

    @Transactional
    public Requisition approve(Long id, String approvedBy) {
        Requisition req = getById(id);
        if (req.getStatus() != Requisition.ReqStatus.SUBMITTED) {
            throw new RuntimeException("Only SUBMITTED requisitions can be approved");
        }
        req.setStatus(Requisition.ReqStatus.APPROVED);
        req.setApprovedAt(LocalDateTime.now());
        req.setApprovedBy(approvedBy);
        return requisitionRepository.save(req);
    }

    @Transactional
    public Requisition reject(Long id, String notes) {
        Requisition req = getById(id);
        if (req.getStatus() != Requisition.ReqStatus.SUBMITTED) {
            throw new RuntimeException("Only SUBMITTED requisitions can be rejected");
        }
        req.setStatus(Requisition.ReqStatus.REJECTED);
        if (notes != null) req.setNotes(req.getNotes() != null ? req.getNotes() + "\nRejection: " + notes : notes);
        return requisitionRepository.save(req);
    }

    @Transactional
    public Requisition update(Long id, Requisition updated) {
        Requisition existing = getById(id);
        if (existing.getStatus() != Requisition.ReqStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT requisitions can be edited");
        }
        existing.setTitle(updated.getTitle());
        existing.setDepartment(updated.getDepartment());
        existing.setRequestedBy(updated.getRequestedBy());
        existing.setNotes(updated.getNotes());
        return requisitionRepository.save(existing);
    }

    private void recalcTotal(Requisition req) {
        List<RequisitionLine> lines = lineRepository.findByRequisitionId(req.getId());
        BigDecimal total = lines.stream()
                .map(l -> l.getTotalPrice() != null ? l.getTotalPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        req.setTotalAmount(total);
        requisitionRepository.save(req);
    }

    private String generateReqNumber() {
        long count = requisitionRepository.count();
        return "REQ-" + String.format("%05d", count + seqCounter.getAndIncrement() % 10000);
    }

    public long countByStatus(Requisition.ReqStatus status) {
        return requisitionRepository.countByStatus(status);
    }
}
