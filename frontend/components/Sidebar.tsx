'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Package, BookOpen, FileText,
  ShoppingCart, Warehouse, ChevronRight, ChevronDown,
  Upload, Wifi, ScrollText, Settings, LogOut, UserCircle2,
  BarChart2, Store, ClipboardList, PackageCheck, Building2,
  Shield, Network, Cog, GitBranch, PanelLeftClose, PanelLeftOpen,
  Inbox, Receipt, CreditCard, BookMarked, Landmark, Banknote,
  PieChart, Calculator,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { AccessMatrix } from '@/types';

type NavChild = {
  href: string; label: string; icon: React.ElementType;
  module?: keyof AccessMatrix; roles?: string[];
};
type NavItem  = {
  href: string; label: string; icon: React.ElementType;
  module?: keyof AccessMatrix; exactMatch?: boolean; children?: NavChild[];
  roles?: string[];
};
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      {
        href: '/', label: 'Operations', icon: LayoutDashboard, exactMatch: true,
        children: [
          { href: '/',                label: 'Dashboard',       icon: LayoutDashboard, module: 'dashboard'      },
          { href: '/vendors',         label: 'Vendors',         icon: Building2,       module: 'vendors'        },
          { href: '/vendor-inbox',    label: 'PO Inbox',        icon: Inbox,           module: 'vendorInbox',
            roles: ['VENDOR_USER', 'VENDOR_ADMIN'] },
          { href: '/catalog',         label: 'Item Catalog',    icon: Package,         module: 'catalog'        },
          { href: '/catalog/import',  label: 'Catalog Import',  icon: Upload,          module: 'catalog'        },
          { href: '/order-guides',    label: 'Order Guides',    icon: BookOpen,        module: 'orderGuides'    },
          { href: '/requisitions',    label: 'Requisitions',    icon: FileText,        module: 'requisitions'   },
          { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart,    module: 'purchaseOrders' },
          { href: '/inventory',       label: 'Inventory',       icon: Warehouse,       module: 'inventory'      },
        ],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        href: '/finance', label: 'Finance', icon: Banknote, exactMatch: true,
        children: [
          { href: '/finance/accounts-payable',    label: 'Accounts Payable',    icon: Receipt    },
          { href: '/finance/accounts-receivable', label: 'Accounts Receivable', icon: CreditCard },
          { href: '/finance/general-ledger',      label: 'General Ledger',      icon: BookMarked },
          { href: '/finance/bank-reconciliation', label: 'Bank Reconciliation', icon: Landmark   },
          { href: '/finance/payments',            label: 'Payments',            icon: Banknote   },
          { href: '/finance/reports',             label: 'Financial Reports',   icon: PieChart   },
          { href: '/finance/tax',                 label: 'Tax Engine',          icon: Calculator },
        ],
      },
    ],
  },
  {
    label: 'Integration',
    items: [
      {
        href: '/integration', label: 'Integration', icon: Wifi, exactMatch: true,
        children: [
          { href: '/integration',                       label: 'Integrations',    icon: Wifi,          module: 'integration' },
          { href: '/integration/settings',              label: 'Settings',        icon: Cog,           module: 'integration' },
          { href: '/integration/mappings',              label: 'Field Mappings',  icon: GitBranch,     module: 'integration' },
          { href: '/integration/results',               label: 'Results',         icon: BarChart2,     module: 'integration' },
          { href: '/integration/punchout',              label: 'PunchOut',        icon: Store,         module: 'integration' },
          { href: '/integration/punchout/orders',       label: '↳ Orders',        icon: PackageCheck,  module: 'integration' },
          { href: '/integration/punchout/requisitions', label: '↳ Requisitions',  icon: ClipboardList, module: 'integration' },
          { href: '/logs',                              label: 'Import Logs',     icon: ScrollText,    module: 'logs'        },
        ],
      },
    ],
  },
  {
    label: 'Organization',
    items: [
      {
        href: '/org/structure', label: 'Organization', icon: Network,
        children: [
          { href: '/org/structure',     label: 'Org Structure', icon: Network, module: 'orgStructure' },
          { href: '/persons',           label: 'Persons',        icon: Users,   module: 'persons'      },
          { href: '/positions',         label: 'Positions',      icon: Shield,  module: 'positions'    },
          { href: '/org/access-matrix', label: 'Access Matrix',  icon: Shield,  module: 'orgStructure' },
        ],
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '/settings', label: 'System', icon: Settings,
        children: [
          { href: '/admin/organisation',    label: 'Organisation Setup', icon: Building2, roles: ['SYSTEM_ADMIN'] },
          { href: '/admin/approval-engine', label: 'Approval Engine',    icon: GitBranch, roles: ['SYSTEM_ADMIN'] },
          { href: '/settings',              label: 'Settings',           icon: Settings,  module: 'settings'      },
        ],
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, canAccess } = useAuth();

  // Auto-open sections where a child is currently active
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.children) {
          init[item.href] = item.children.some(
            c => pathname === c.href || pathname.startsWith(c.href + '/')
          );
        }
      }
    }
    return init;
  });

  const toggle = (href: string) =>
    setOpenSections(prev => ({ ...prev, [href]: !prev[href] }));

  const isActive = (href: string, exactMatch?: boolean) => {
    const base = href.split('?')[0];
    if (base === '/') return pathname === '/';
    if (exactMatch) return pathname === base;
    return pathname === base || pathname.startsWith(base + '/');
  };

  const visible = (items: NavItem[]) =>
    items.filter(item => {
      if (item.roles && !item.roles.includes(user?.role ?? '')) return false;
      return !item.module || canAccess(item.module, 'view');
    });

  const visibleChildren = (children: NavChild[]) =>
    children.filter(c => {
      if (c.roles && !c.roles.includes(user?.role ?? '')) return false;
      return !c.module || canAccess(c.module, 'view');
    });

  return (
    <aside
      className={`fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-neutral-200 flex flex-col z-30 transition-all duration-300`}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center flex-shrink-0 border-b border-neutral-200 ${collapsed ? 'flex-col gap-2 py-4' : 'gap-3 px-4 py-[18px]'}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-neutral-900 font-bold text-sm">ProcureX</p>
            <p className="text-neutral-400 text-[11px] mt-0.5">Procurement ERP</p>
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_GROUPS.map((group, gi) => {
          const items = visible(group.items);
          if (items.length === 0) return null;

          return (
            <div key={group.label} className={gi > 0 ? 'mt-1' : ''}>
              {/* Section label / divider */}
              {collapsed ? (
                gi > 0 && <hr className="mx-3 my-2 border-neutral-100" />
              ) : (
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest select-none">
                  {group.label}
                </p>
              )}

              <div className="px-2 space-y-0.5">
                {items.map(item => {
                  const active = isActive(item.href, item.exactMatch);
                  const open   = openSections[item.href] ?? false;
                  const Icon   = item.icon;

                  /* Collapsed — icon only; if item has children, expand on click */
                  if (collapsed) {
                    const anyChildActive = item.children?.some(c => isActive(c.href)) ?? false;
                    const collapsedActive = active || anyChildActive;
                    if (item.children) {
                      return (
                        <button
                          key={item.href}
                          title={item.label}
                          onClick={onToggle}   /* expand sidebar so user can pick a child */
                          className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-colors ${
                            collapsedActive
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${
                          active
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </Link>
                    );
                  }

                  /* Expanded — item with collapsible children */
                  if (item.children) {
                    const anyChildActive = item.children.some(c => isActive(c.href));
                    const highlight = active || anyChildActive;
                    return (
                      <div key={item.href}>
                        {/* Parent row — clicking anywhere toggles; children handle navigation */}
                        <button
                          onClick={() => toggle(item.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                            highlight
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                        </button>

                        {open && (
                          <div className="ml-4 mt-0.5 pl-3 border-l-2 border-neutral-100 space-y-0.5">
                            {visibleChildren(item.children).map(child => {
                              const ca = isActive(child.href);
                              const CIcon = child.icon;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    ca
                                      ? 'bg-primary-600 text-white shadow-sm'
                                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                                  }`}
                                >
                                  <CIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="flex-1">{child.label}</span>
                                  {ca && <ChevronRight className="w-3 h-3 opacity-70" />}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  /* Expanded — plain link */
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User footer ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-neutral-200">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5 py-3">
            {user ? (
              <>
                <div
                  title={user.username}
                  className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xs select-none cursor-default"
                >
                  {user.username?.slice(0, 2).toUpperCase() ?? 'U'}
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <UserCircle2 className="w-5 h-5 text-neutral-400" />
            )}
          </div>
        ) : user ? (
          <div className="flex items-center gap-2.5 px-3 py-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs select-none">
              {user.username?.slice(0, 2).toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-neutral-900 text-xs font-semibold truncate">{user.username}</p>
              <p className="text-neutral-400 text-[11px] truncate">
                {user.positionName ?? user.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 text-neutral-500">
            <UserCircle2 className="w-4 h-4" />
            <span className="text-xs">Not signed in</span>
          </div>
        )}
      </div>
    </aside>
  );
}
