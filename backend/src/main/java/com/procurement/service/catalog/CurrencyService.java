package com.procurement.service.catalog;

import com.procurement.model.CurrencyMaster;
import com.procurement.repository.CurrencyMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CurrencyService {

    private final CurrencyMasterRepository currencyRepo;

    public List<CurrencyMaster> getAll() { return currencyRepo.findAll(); }

    public List<CurrencyMaster> getActive() { return currencyRepo.findByActiveTrue(); }

    public CurrencyMaster save(CurrencyMaster currency) { return currencyRepo.save(currency); }

    public void delete(Long id) { currencyRepo.deleteById(id); }
}
