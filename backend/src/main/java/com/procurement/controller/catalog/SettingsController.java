package com.procurement.controller.catalog;

import com.procurement.dto.ApiResponse;
import com.procurement.model.CurrencyMaster;
import com.procurement.model.UomMaster;
import com.procurement.service.catalog.CurrencyService;
import com.procurement.service.catalog.UomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final UomService uomService;
    private final CurrencyService currencyService;

    // ── UOM endpoints ──────────────────────────────────────────────────────────
    @GetMapping("/uom")
    public ResponseEntity<ApiResponse<List<UomMaster>>> getUoms() {
        return ResponseEntity.ok(ApiResponse.ok(uomService.getAll()));
    }

    @PostMapping("/uom")
    public ResponseEntity<ApiResponse<UomMaster>> createUom(@RequestBody UomMaster uom) {
        return ResponseEntity.ok(ApiResponse.ok(uomService.save(uom)));
    }

    @PutMapping("/uom/{id}")
    public ResponseEntity<ApiResponse<UomMaster>> updateUom(@PathVariable Long id, @RequestBody UomMaster uom) {
        uom.setId(id);
        return ResponseEntity.ok(ApiResponse.ok(uomService.save(uom)));
    }

    @DeleteMapping("/uom/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUom(@PathVariable Long id) {
        uomService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("UOM deleted", null));
    }

    // ── Currency endpoints ─────────────────────────────────────────────────────
    @GetMapping("/currencies")
    public ResponseEntity<ApiResponse<List<CurrencyMaster>>> getCurrencies() {
        return ResponseEntity.ok(ApiResponse.ok(currencyService.getActive()));
    }

    @PostMapping("/currencies")
    public ResponseEntity<ApiResponse<CurrencyMaster>> createCurrency(@RequestBody CurrencyMaster currency) {
        return ResponseEntity.ok(ApiResponse.ok(currencyService.save(currency)));
    }

    @PutMapping("/currencies/{id}")
    public ResponseEntity<ApiResponse<CurrencyMaster>> updateCurrency(@PathVariable Long id,
                                                                        @RequestBody CurrencyMaster currency) {
        currency.setId(id);
        return ResponseEntity.ok(ApiResponse.ok(currencyService.save(currency)));
    }

    @DeleteMapping("/currencies/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCurrency(@PathVariable Long id) {
        currencyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Currency deleted", null));
    }
}
