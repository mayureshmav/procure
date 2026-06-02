package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dashboard_widgets")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardWidget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WidgetType type; // STAT_CARD, CHART, TABLE, GRAPH

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DataMetric metric; // VENDOR_COUNT, ITEM_COUNT, PENDING_REQS, etc.

    @Column(name = "icon_name", length = 50)
    private String iconName; // lucide-react icon name

    @Column(name = "color_class", length = 100)
    private String colorClass; // Tailwind color classes

    @Column(name = "bg_color_class", length = 100)
    private String bgColorClass;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum WidgetType {
        STAT_CARD, CHART, TABLE, GRAPH, KPI
    }

    public enum DataMetric {
        TOTAL_VENDORS,
        TOTAL_ITEMS,
        PENDING_REQS,
        OPEN_POS,
        LOW_STOCK_ITEMS,
        DRAFT_REQS,
        APPROVED_REQS,
        RECEIVED_POS,
        PENDING_INVOICES,
        OVERDUE_POS,
        VENDOR_PERFORMANCE,
        ITEM_UTILIZATION,
        BUDGET_UTILIZATION,
        APPROVAL_PIPELINE,
        RECENT_ORDERS,
        RECENT_REQUISITIONS
    }
}
