package com.procurement.service;

import com.procurement.model.*;
import com.procurement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderGuideService {

    private final OrderGuideRepository orderGuideRepository;
    private final OrderGuideItemRepository orderGuideItemRepository;
    private final ItemRepository itemRepository;

    public List<OrderGuide> getAll() { return orderGuideRepository.findAll(); }

    public OrderGuide getById(Long id) {
        return orderGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order Guide not found: " + id));
    }

    public OrderGuide create(OrderGuide guide) {
        return orderGuideRepository.save(guide);
    }

    public OrderGuide update(Long id, OrderGuide updated) {
        OrderGuide existing = getById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setIsShared(updated.getIsShared());
        return orderGuideRepository.save(existing);
    }

    public void delete(Long id) { orderGuideRepository.deleteById(id); }

    @Transactional
    public OrderGuideItem addItem(Long guideId, Long itemId, Integer qty, java.math.BigDecimal targetPrice) {
        OrderGuide guide = getById(guideId);
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found: " + itemId));

        OrderGuideItem ogi = OrderGuideItem.builder()
                .orderGuide(guide)
                .item(item)
                .defaultQty(qty != null ? qty : 1)
                .targetPrice(targetPrice)
                .build();
        return orderGuideItemRepository.save(ogi);
    }

    @Transactional
    public void removeItem(Long guideId, Long itemId) {
        orderGuideItemRepository.deleteByOrderGuideIdAndItemId(guideId, itemId);
    }

    public List<OrderGuideItem> getItems(Long guideId) {
        return orderGuideItemRepository.findByOrderGuideId(guideId);
    }
}
