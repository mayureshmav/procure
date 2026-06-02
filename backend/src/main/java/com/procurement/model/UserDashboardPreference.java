package com.procurement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_dashboard_preferences", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDashboardPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ElementCollection
    @CollectionTable(name = "user_dashboard_widget_config", joinColumns = @JoinColumn(name = "preference_id"))
    @OrderColumn(name = "position")
    @Builder.Default
    private List<DashboardWidgetConfig> widgets = new ArrayList<>();

    @Column(name = "layout_type", length = 50)
    private String layoutType; // GRID, FLEX, MASONRY

    @Column(name = "refresh_interval")
    private Integer refreshInterval; // in seconds

    @Builder.Default
    private Boolean showQuickActions = true;

    @Builder.Default
    private Boolean useDefaultLayout = false;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Embeddable
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DashboardWidgetConfig {
        @Column(name = "widget_id")
        private Long widgetId;

        @Column(name = "is_enabled")
        private Boolean isEnabled;

        @Column(name = "custom_title")
        private String customTitle;

        @Column(name = "widget_size", length = 50)
        private String widgetSize; // sm, md, lg

        @Column(name = "chart_type", length = 50)
        private String chartType; // for charts: BAR, LINE, PIE, AREA

        @Column(name = "time_range", length = 50)
        private String timeRange; // TODAY, WEEK, MONTH, QUARTER, YEAR

        @Column(name = "comparison_enabled")
        private Boolean comparisonEnabled;

        @Column(name = "drill_down_enabled")
        private Boolean drillDownEnabled;

        @Column(name = "custom_config", columnDefinition = "TEXT")
        private String customConfig; // JSON string for additional configs
    }
}
