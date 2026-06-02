package com.procurement.service;

import com.procurement.dto.DashboardDataDTO;
import com.procurement.dto.DashboardStatsDTO;
import com.procurement.dto.DashboardWidgetDTO;
import com.procurement.dto.UserDashboardPreferenceDTO;
import com.procurement.model.*;
import com.procurement.repository.DashboardWidgetRepository;
import com.procurement.repository.UserDashboardPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DashboardService {

    private final DashboardWidgetRepository widgetRepository;
    private final UserDashboardPreferenceRepository preferenceRepository;
    private final UserService userService;
    private final VendorService vendorService;
    private final ItemService itemService;
    private final RequisitionService requisitionService;
    private final PurchaseOrderService poService;
    private final InventoryService inventoryService;

    /**
     * Get all available dashboard widgets
     */
    public List<DashboardWidgetDTO> getAllWidgets() {
        return widgetRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(DashboardWidgetDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get user's dashboard preference or create default
     */
    public UserDashboardPreferenceDTO getUserDashboardPreference(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(UserDashboardPreferenceDTO::fromEntity)
                .orElse(createDefaultPreference(userId));
    }

    /**
     * Create default dashboard preference for a user
     */
    private UserDashboardPreferenceDTO createDefaultPreference(Long userId) {
        User user = userService.findById(userId);
        
        // Get all active widgets
        List<DashboardWidget> allWidgets = widgetRepository.findByActiveTrueOrderByDisplayOrderAsc();
        
        // Create default configs for all widgets
        List<UserDashboardPreference.DashboardWidgetConfig> configs = allWidgets.stream()
                .map(w -> UserDashboardPreference.DashboardWidgetConfig.builder()
                        .widgetId(w.getId())
                        .isEnabled(true)
                        .widgetSize("md")
                        .chartType("BAR")
                        .timeRange("MONTH")
                        .comparisonEnabled(false)
                        .drillDownEnabled(true)
                        .build())
                .collect(Collectors.toList());

        UserDashboardPreference pref = UserDashboardPreference.builder()
                .user(user)
                .widgets(configs)
                .layoutType("GRID")
                .refreshInterval(60)
                .showQuickActions(true)
                .useDefaultLayout(true)
                .build();

        preferenceRepository.save(pref);
        return UserDashboardPreferenceDTO.fromEntity(pref);
    }

    /**
     * Save user's dashboard preference
     */
    public UserDashboardPreferenceDTO saveUserDashboardPreference(Long userId, UserDashboardPreferenceDTO dto) {
        User user = userService.findById(userId);
        
        UserDashboardPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> UserDashboardPreference.builder().user(user).build());

        pref.setLayoutType(dto.getLayoutType());
        pref.setRefreshInterval(dto.getRefreshInterval());
        pref.setShowQuickActions(dto.getShowQuickActions());
        pref.setUseDefaultLayout(dto.getUseDefaultLayout());
        pref.setUpdatedAt(LocalDateTime.now());

        // Update widget configurations
        List<UserDashboardPreference.DashboardWidgetConfig> configs = dto.getWidgets().stream()
                .map(w -> UserDashboardPreference.DashboardWidgetConfig.builder()
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
                .collect(Collectors.toList());

        pref.setWidgets(configs);
        preferenceRepository.save(pref);
        return UserDashboardPreferenceDTO.fromEntity(pref);
    }

    /**
     * Get dashboard data including stats and configured widgets
     */
    public DashboardDataDTO getDashboardData(Long userId) {
        UserDashboardPreferenceDTO preference = getUserDashboardPreference(userId);
        List<DashboardWidgetDTO> allWidgets = getAllWidgets();
        
        return DashboardDataDTO.builder()
                .preference(preference)
                .availableWidgets(allWidgets)
                .stats(getDashboardStats())
                .build();
    }

    /**
     * Get all dashboard statistics
     */
    public DashboardStatsDTO getDashboardStats() {
        return DashboardStatsDTO.builder()
                .totalVendors(vendorService.count())
                .totalItems(itemService.count())
                .pendingReqs(requisitionService.countByStatus(Requisition.ReqStatus.SUBMITTED))
                .openPOs(poService.countByStatus(PurchaseOrder.PoStatus.SUBMITTED))
                .lowStockItems(inventoryService.countLowStock())
                .draftReqs(requisitionService.countByStatus(Requisition.ReqStatus.DRAFT))
                .approvedReqs(requisitionService.countByStatus(Requisition.ReqStatus.APPROVED))
                .receivedPOs(poService.countByStatus(PurchaseOrder.PoStatus.RECEIVED))
                .build();
    }

    /**
     * Initialize default dashboard widgets (run once during setup)
     */
    public void initializeDefaultWidgets() {
        if (widgetRepository.count() == 0) {
            List<DashboardWidget> widgets = List.of(
                new DashboardWidget(null, "total_vendors", "Total Vendors", "Active vendors in system", 
                    DashboardWidget.WidgetType.STAT_CARD, DashboardWidget.DataMetric.TOTAL_VENDORS,
                    "Users", "text-blue-600", "bg-blue-50", true, 1, LocalDateTime.now(), null),
                new DashboardWidget(null, "total_items", "Catalog Items", "Items in catalog", 
                    DashboardWidget.WidgetType.STAT_CARD, DashboardWidget.DataMetric.TOTAL_ITEMS,
                    "Package", "text-purple-600", "bg-purple-50", true, 2, LocalDateTime.now(), null),
                new DashboardWidget(null, "pending_reqs", "Pending Requisitions", "Submitted but not approved", 
                    DashboardWidget.WidgetType.STAT_CARD, DashboardWidget.DataMetric.PENDING_REQS,
                    "Clock", "text-yellow-600", "bg-yellow-50", true, 3, LocalDateTime.now(), null),
                new DashboardWidget(null, "open_pos", "Open Purchase Orders", "Active purchase orders", 
                    DashboardWidget.WidgetType.STAT_CARD, DashboardWidget.DataMetric.OPEN_POS,
                    "ShoppingCart", "text-green-600", "bg-green-50", true, 4, LocalDateTime.now(), null),
                new DashboardWidget(null, "low_stock", "Low Stock Items", "Items below safety stock", 
                    DashboardWidget.WidgetType.STAT_CARD, DashboardWidget.DataMetric.LOW_STOCK_ITEMS,
                    "AlertTriangle", "text-red-600", "bg-red-50", true, 5, LocalDateTime.now(), null),
                new DashboardWidget(null, "draft_reqs", "Draft Requisitions", "Incomplete requisitions", 
                    DashboardWidget.WidgetType.STAT_CARD, DashboardWidget.DataMetric.DRAFT_REQS,
                    "FileText", "text-gray-600", "bg-gray-50", true, 6, LocalDateTime.now(), null),
                new DashboardWidget(null, "approved_reqs", "Approved Requisitions", "Awaiting conversion to PO", 
                    DashboardWidget.WidgetType.STAT_CARD, DashboardWidget.DataMetric.APPROVED_REQS,
                    "CheckCircle", "text-teal-600", "bg-teal-50", true, 7, LocalDateTime.now(), null),
                new DashboardWidget(null, "received_pos", "Received Purchase Orders", "Completed orders", 
                    DashboardWidget.WidgetType.STAT_CARD, DashboardWidget.DataMetric.RECEIVED_POS,
                    "TrendingUp", "text-indigo-600", "bg-indigo-50", true, 8, LocalDateTime.now(), null)
            );
            
            widgetRepository.saveAll(widgets);
        }
    }
}
