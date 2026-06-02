'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  ShoppingCart,
  Users,
  Package,
  BookOpen,
  ChevronRight,
  X,
  Boxes,
  MapPin,
  TrendingDown,
  ArrowRightLeft,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  subFeatures: SubFeature[];
}

interface SubFeature {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

export default function QuickActionsPanel() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const actions: QuickAction[] = [
    {
      id: 'requisitions',
      title: 'Requisitions',
      description: 'Manage purchase requests',
      icon: FileText,
      color: 'text-primary-600',
      bg: 'bg-primary-50 hover:bg-primary-100',
      subFeatures: [
        {
          label: 'Create New Requisition',
          description: 'Start a new purchase request',
          icon: Plus,
          href: '/requisitions',
          color: 'text-primary-600',
        },
        {
          label: 'Draft Requisitions',
          description: `View and edit unsaved requisitions`,
          icon: FileText,
          href: '/requisitions?status=DRAFT',
          color: 'text-neutral-600',
        },
        {
          label: 'Pending Approval',
          description: 'Requisitions awaiting review',
          icon: FileText,
          href: '/requisitions?status=SUBMITTED',
          color: 'text-warning-600',
        },
        {
          label: 'Approved Requisitions',
          description: 'Approved requests ready for ordering',
          icon: FileText,
          href: '/requisitions?status=APPROVED',
          color: 'text-success-600',
        },
      ],
    },
    {
      id: 'purchaseOrders',
      title: 'Purchase Orders',
      description: 'Create and track orders',
      icon: ShoppingCart,
      color: 'text-success-600',
      bg: 'bg-success-50 hover:bg-success-100',
      subFeatures: [
        {
          label: 'Create New PO',
          description: 'Create a new purchase order',
          icon: Plus,
          href: '/purchase-orders',
          color: 'text-success-600',
        },
        {
          label: 'Open Orders',
          description: 'Active purchase orders',
          icon: ShoppingCart,
          href: '/purchase-orders?status=SUBMITTED',
          color: 'text-warning-600',
        },
        {
          label: 'Received Orders',
          description: 'Completed and received orders',
          icon: ShoppingCart,
          href: '/purchase-orders?status=RECEIVED',
          color: 'text-success-600',
        },
      ],
    },
    {
      id: 'vendors',
      title: 'Vendors',
      description: 'Manage vendor information',
      icon: Users,
      color: 'text-primary-600',
      bg: 'bg-primary-50 hover:bg-primary-100',
      subFeatures: [
        {
          label: 'Add New Vendor',
          description: 'Register a new supplier',
          icon: Plus,
          href: '/vendors',
          color: 'text-primary-600',
        },
        {
          label: 'View All Vendors',
          description: 'Browse vendor directory',
          icon: Users,
          href: '/vendors',
          color: 'text-primary-600',
        },
        {
          label: 'Vendor Ratings',
          description: 'View vendor performance metrics',
          icon: Users,
          href: '/vendors?view=ratings',
          color: 'text-warning-600',
        },
      ],
    },
    {
      id: 'catalog',
      title: 'Catalog',
      description: 'Manage product catalog',
      icon: Package,
      color: 'text-primary-600',
      bg: 'bg-primary-50 hover:bg-primary-100',
      subFeatures: [
        {
          label: 'Add New Item',
          description: 'Add product to catalog',
          icon: Plus,
          href: '/catalog',
          color: 'text-primary-600',
        },
        {
          label: 'Browse Catalog',
          description: 'View all catalog items',
          icon: Package,
          href: '/catalog',
          color: 'text-primary-600',
        },
        {
          label: 'Import Catalog',
          description: 'Bulk import items from file',
          icon: Package,
          href: '/catalog/import',
          color: 'text-primary-600',
        },
      ],
    },
    {
      id: 'orderGuides',
      title: 'Order Guides',
      description: 'Configure order rules',
      icon: BookOpen,
      color: 'text-primary-600',
      bg: 'bg-primary-50 hover:bg-primary-100',
      subFeatures: [
        {
          label: 'Create Order Guide',
          description: 'Set up new ordering rules',
          icon: Plus,
          href: '/order-guides',
          color: 'text-primary-600',
        },
        {
          label: 'View Order Guides',
          description: 'Browse existing guides',
          icon: BookOpen,
          href: '/order-guides',
          color: 'text-primary-600',
        },
      ],
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Manage stock & locations',
      icon: Boxes,
      color: 'text-primary-600',
      bg: 'bg-primary-50 hover:bg-primary-100',
      subFeatures: [
        {
          label: 'Locations & Warehouses',
          description: 'Manage store rooms and warehouse locations',
          icon: MapPin,
          href: '/inventory/locations',
          color: 'text-primary-600',
        },
        {
          label: 'Item Master',
          description: 'Define items, UOM, and pricing',
          icon: Package,
          href: '/inventory/items',
          color: 'text-primary-600',
        },
        {
          label: 'Goods Receipt Notes',
          description: 'Record incoming materials and GRN',
          icon: Plus,
          href: '/inventory/grn',
          color: 'text-success-600',
        },
        {
          label: 'Stock Issues & Transfers',
          description: 'Issue items to production or transfer between locations',
          icon: ArrowRightLeft,
          href: '/inventory/transactions',
          color: 'text-primary-600',
        },
        {
          label: 'Stock Levels & Reorder',
          description: 'Monitor on-hand inventory and reorder points',
          icon: AlertCircle,
          href: '/inventory/stock-levels',
          color: 'text-warning-600',
        },
        {
          label: 'Inventory Valuation',
          description: 'View cost calculations and inventory value (FIFO/LIFO/WAM)',
          icon: TrendingDown,
          href: '/inventory/valuation',
          color: 'text-primary-600',
        },
        {
          label: 'Inventory Reports',
          description: 'Analytics, stock status, and compliance reports',
          icon: BarChart3,
          href: '/inventory/reports',
          color: 'text-primary-600',
        },
      ],
    },
  ];

  const current = actions.find((a) => a.id === selectedAction);

  return (
    <div className="card">
      {/* Quick Actions Grid */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const isSelected = selectedAction === action.id;

            return (
              <button
                key={action.id}
                onClick={() =>
                  setSelectedAction(isSelected ? null : action.id)
                }
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  ${isSelected
                    ? `border-primary-500 ${action.bg} shadow-md`
                    : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm bg-white'
                  }
                `}
              >
                <div className={`w-8 h-8 rounded-lg ${action.bg} flex items-center justify-center mb-2 mx-auto`}>
                  <Icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <p className="text-xs font-semibold text-neutral-900 text-center">
                  {action.title}
                </p>
                <p className="text-xs text-neutral-500 text-center mt-0.5">
                  {action.description}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Features Panel */}
      {current && (
        <div className="border-t border-neutral-200 p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900">
              {current.title} — Sub-Features
            </h3>
            <button
              onClick={() => setSelectedAction(null)}
              className="p-1 -m-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {current.subFeatures.map((feature) => {
              const FeatureIcon = feature.icon;

              return (
                <Link
                  key={feature.label}
                  href={feature.href}
                  className="
                    group p-4 rounded-lg border border-neutral-200 hover:border-primary-200
                    hover:shadow-md hover:bg-primary-25 transition-all duration-200 bg-white
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <FeatureIcon className={`w-4 h-4 ${feature.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 group-hover:text-neutral-950">
                        {feature.label}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {feature.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 ml-2 flex-shrink-0 mt-0.5 transition-colors duration-200" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!current && (
        <p className="text-center text-sm text-neutral-400 py-8">
          Select a quick action tile above to see available sub-features
        </p>
      )}
    </div>
  );
}
