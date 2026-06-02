package com.procurement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDataDTO {
    private UserDashboardPreferenceDTO preference;
    private List<DashboardWidgetDTO> availableWidgets;
    private DashboardStatsDTO stats;
}
