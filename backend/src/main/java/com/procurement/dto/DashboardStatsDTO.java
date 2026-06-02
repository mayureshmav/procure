package com.procurement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    private Long totalVendors;
    private Long totalItems;
    private Long pendingReqs;
    private Long openPOs;
    private Long lowStockItems;
    private Long draftReqs;
    private Long approvedReqs;
    private Long receivedPOs;
}
