package com.procurement.dto;

import com.procurement.model.UserDashboardPreference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDashboardPreferenceDTO {
    private Long id;
    private String layoutType;
    private Integer refreshInterval;
    private Boolean showQuickActions;
    private Boolean useDefaultLayout;
    private List<WidgetConfigDTO> widgets;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WidgetConfigDTO {
        private Long widgetId;
        private Boolean isEnabled;
        private String customTitle;
        private String widgetSize;
        private String chartType;
        private String timeRange;
        private Boolean comparisonEnabled;
        private Boolean drillDownEnabled;
        private String customConfig;
    }

    public static UserDashboardPreferenceDTO fromEntity(UserDashboardPreference pref) {
        return UserDashboardPreferenceDTO.builder()
                .id(pref.getId())
                .layoutType(pref.getLayoutType())
                .refreshInterval(pref.getRefreshInterval())
                .showQuickActions(pref.getShowQuickActions())
                .useDefaultLayout(pref.getUseDefaultLayout())
                .widgets(pref.getWidgets().stream()
                        .map(w -> WidgetConfigDTO.builder()
                                .widgetId(w.getWidgetId())
                                .isEnabled(w.getIsEnabled())
                                .customTitle(w.getCustomTitle())
                                .widgetSize(w.getWidgetSize())
                                .chartType(w.getChartType())
                                .timeRange(w.getTimeRange())
                                .comparisonEnabled(w.getComparisonEnabled())
                                .drillDownEnabled(w.getDrillDownEnabled())
                                .customConfig(w.getCustomConfig())
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(pref.getCreatedAt())
                .updatedAt(pref.getUpdatedAt())
                .build();
    }
}
