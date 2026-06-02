'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/lib/api';
import { DashboardStats } from '@/types';
import { Users, Package, FileText, ShoppingCart, AlertTriangle, TrendingUp, CheckCircle, Clock, WifiOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import QuickActionsPanel from '@/components/QuickActionsPanel';

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  href: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    setError(false);
    getDashboardStats()
      .then(data => { setStats(data); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  const cards: StatCard[] = stats ? [
    { label: 'Total Vendors',    value: stats.totalVendors,   icon: Users,         color: 'text-primary-600',   bg: 'bg-primary-50',   href: '/vendors' },
    { label: 'Catalog Items',    value: stats.totalItems,     icon: Package,       color: 'text-primary-600',   bg: 'bg-primary-50',   href: '/catalog' },
    { label: 'Pending REQs',     value: stats.pendingReqs,    icon: Clock,         color: 'text-warning-600',   bg: 'bg-warning-50',   href: '/requisitions?status=SUBMITTED' },
    { label: 'Open POs',         value: stats.openPOs,        icon: ShoppingCart,  color: 'text-success-600',   bg: 'bg-success-50',   href: '/purchase-orders?status=SUBMITTED' },
    { label: 'Low Stock Items',  value: stats.lowStockItems,  icon: AlertTriangle, color: 'text-error-600',     bg: 'bg-error-50',     href: '/inventory?lowStock=true' },
    { label: 'Draft REQs',       value: stats.draftReqs,      icon: FileText,      color: 'text-neutral-600',   bg: 'bg-neutral-100',  href: '/requisitions?status=DRAFT' },
    { label: 'Approved REQs',    value: stats.approvedReqs,   icon: CheckCircle,   color: 'text-success-600',   bg: 'bg-success-50',   href: '/requisitions?status=APPROVED' },
    { label: 'Received POs',     value: stats.receivedPOs,    icon: TrendingUp,    color: 'text-primary-600',   bg: 'bg-primary-50',   href: '/purchase-orders?status=RECEIVED' },
  ] : [];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-2">Welcome to ProcureX — your Procure-to-Pay command centre</p>
      </div>

      {/* Backend offline banner */}
      {!loading && error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-warning-50 border border-warning-200 rounded-lg text-warning-800 text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">Backend not reachable — start the Spring Boot API on port 8080 to see live data.</span>
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-warning-100 hover:bg-warning-200 rounded-md text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid-cols-responsive">
          {Array.from({length: 8}).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse-soft">
              <div className="h-10 w-10 rounded-lg bg-neutral-200 mb-4" />
              <div className="h-3 bg-neutral-200 rounded w-3/4 mb-3" />
              <div className="h-8 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards Grid */}
          {cards.length > 0 ? (
            <div className="grid-cols-responsive">
              {cards.map(({ label, value, icon: Icon, color, bg, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="card-hover p-6 hover:shadow-md transition-all duration-200 block group"
                >
                  <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">{label}</p>
                  <p className="text-4xl font-bold text-neutral-900 mt-3">{value}</p>
                  <p className="text-xs text-neutral-500 mt-2 group-hover:text-primary-600 transition-colors">View details →</p>
                </Link>
              ))}
            </div>
          ) : (
            !error && (
              <div className="card p-10 text-center text-neutral-400">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No data yet — create your first vendor or catalog item to get started.</p>
              </div>
            )
          )}

          {/* Quick Actions with Sub-Features */}
          <div>
            <QuickActionsPanel />
          </div>
        </>
      )}
    </div>
  );
}
