package com.procurement.dto;

import com.procurement.model.DashboardWidget;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardWidgetDTO {
    private Long id;
    private String code;
    private String title;
    private String description;
    private DashboardWidget.WidgetType type;
    private DashboardWidget.DataMetric metric;
    private String iconName;
    private String colorClass;
    private String bgColorClass;
    private Boolean active;
    private Integer displayOrder;
    private LocalDateTime createdAt;

    public static DashboardWidgetDTO fromEntity(DashboardWidget widget) {
        return DashboardWidgetDTO.builder()
                .id(widget.getId())
                .code(widget.getCode())
                .title(widget.getTitle())
                .description(widget.getDescription())
                .type(widget.getType())
                .metric(widget.getMetric())
                .iconName(widget.getIconName())
                .colorClass(widget.getColorClass())
                .bgColorClass(widget.getBgColorClass())
                .active(widget.getActive())
                .displayOrder(widget.getDisplayOrder())
                .createdAt(widget.getCreatedAt())
                .build();
    }
}
