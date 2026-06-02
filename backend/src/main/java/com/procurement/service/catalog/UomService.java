package com.procurement.service.catalog;

import com.procurement.model.UomMaster;
import com.procurement.model.enums.UomType;
import com.procurement.repository.UomMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UomService {

    private final UomMasterRepository uomRepo;

    public List<UomMaster> getAll() { return uomRepo.findAll(); }

    public List<UomMaster> getByType(UomType type) { return uomRepo.findByUomType(type); }

    public List<UomMaster> getCatchWeightEligible() { return uomRepo.findByCatchWeightEligibleTrue(); }

    public UomMaster save(UomMaster uom) { return uomRepo.save(uom); }

    public void delete(Long id) { uomRepo.deleteById(id); }
}
