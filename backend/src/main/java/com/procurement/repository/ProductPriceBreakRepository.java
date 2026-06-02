package com.procurement.repository;

import com.procurement.model.ProductPriceBreak;
import com.procurement.model.enums.BreakType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductPriceBreakRepository extends JpaRepository<ProductPriceBreak, Long> {
    List<ProductPriceBreak> findByProductIdAndActiveTrueOrderByTierSequenceAsc(Long productId);
    List<ProductPriceBreak> findByProductIdAndBreakTypeAndActiveTrueOrderByTierSequenceAsc(Long productId, BreakType breakType);
}
