'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package, RefreshCw, Search, ChevronRight, Clock,
  CheckCircle2, XCircle, AlertCircle, DollarSign, Hash,
  User, Calendar, Filter,
} from 'lucide-react';
import { getPunchOutOrders } from '@/lib/api';
import type { PunchOutOrder } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n?: number, currency = 'USD') {
  return (n ?? 0).toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType; dot: string }> = {
  RECEIVED:   { label: 'Received',   color: 'bg-blue-100 text-blue-700',     icon: Clock,         dot: 'bg-blue-500' },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: RefreshCw,     dot: 'bg-purple-500' },
  CONFIRMED:  { label: 'Confirmed',  color: 'bg-green-100 text-green-700',   icon: CheckCircle2,  dot: 'bg-green-500' },
  CANCELLED:  { label: 'Cancelled',  color: 'bg-gray-100 text-gray-500',     icon: XCircle,       dot: 'bg-gray-400' },
  FAILED:     { label: 'Failed',     color: 'bg-red-100 text-red-700',       icon: AlertCircle,   dot: 'bg-red-500' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: 'bg-gray-100 text-gray-500', icon: Package, dot: 'bg-gray-400' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PunchOutOrdersPage() {
  const [data, setData]       = useState<PunchOutOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('ALL');
  const [type, setType]       = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPunchOutOrders();
      setData(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(o => {
    if (status !== 'ALL' && o.status !== status) return false;
    if (type !== 'ALL' && o.orderType !== type) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.orderId.toLowerCase().includes(q) ||
        (o.buyerIdentity ?? '').toLowerCase().includes(q) ||
        (o.agreementId ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Counts per status
  const counts: Record<string, number> = { ALL: data.length };
  data.forEach(o => { counts[o.status] = (counts[o.status] ?? 0) + 1; });

  const totalValue    = data.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const confirmedCnt  = counts['CONFIRMED'] ?? 0;
  const receivedCnt   = counts['RECEIVED']  ?? 0;
  const failedCnt     = counts['FAILED']    ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/integration/punchout" className="hover:text-blue-600">PunchOut</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-700 font-medium">Purchase Orders</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PunchOut Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Orders received from Ariba via cXML <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">OrderRequest</code>
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders"      value={loading ? '…' : data.length}       icon={Package}      color="bg-blue-100 text-blue-600" />
        <StatCard label="Awaiting Action"   value={loading ? '…' : receivedCnt}       icon={Clock}        color="bg-yellow-100 text-yellow-600" sub="status: RECEIVED" />
        <StatCard label="Confirmed"         value={loading ? '…' : confirmedCnt}      icon={CheckCircle2} color="bg-green-100 text-green-600" />
        <StatCard label="Total Value"       value={loading ? '…' : fmt(totalValue)}   icon={DollarSign}   color="bg-purple-100 text-purple-600" sub={`${failedCnt} failed`} />
      </div>

      {/* Status filter + search */}
      <div className="card">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          {/* Status tabs */}
          <div className="flex gap-1">
            {(['ALL', 'RECEIVED', 'PROCESSING', 'CONFIRMED', 'CANCELLED', 'FAILED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  status === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                <span className={`text-xs px-1 py-0.5 rounded-full ${
                  status === s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {counts[s] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Order type filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All types</option>
              <option value="new">New</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="input-field pl-8 py-1.5 text-sm"
              placeholder="Search order ID, buyer, agreement…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Order ID</th>
                <th className="table-header">Type</th>
                <th className="table-header">Buyer</th>
                <th className="table-header">Agreement</th>
                <th className="table-header text-right">Lines</th>
                <th className="table-header text-right">Total</th>
                <th className="table-header">Status</th>
                <th className="table-header">Order Date</th>
                <th className="table-header">Received</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-400">Loading orders…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No orders found</p>
                    {data.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <Link
                        href={`/integration/punchout/orders/${po.orderId}`}
                        className="font-mono text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Hash className="w-3 h-3" />
                        {po.orderId}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        po.orderType === 'new'    ? 'bg-green-50 text-green-700' :
                        po.orderType === 'update' ? 'bg-orange-50 text-orange-700' :
                                                    'bg-red-50 text-red-700'
                      }`}>
                        {po.orderType?.toUpperCase() ?? 'NEW'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate max-w-[140px]">
                          {po.buyerIdentity || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {po.agreementId
                        ? <span className="font-mono text-xs">{po.agreementId}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-cell text-right">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        {po.lineItems?.length ?? 0}
                      </span>
                    </td>
                    <td className="table-cell text-right font-semibold text-gray-900">
                      {fmt(po.totalAmount, po.currency)}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="table-cell text-xs text-gray-500">
                      {po.orderDate ? fmtDate(po.orderDate) : '—'}
                    </td>
                    <td className="table-cell text-xs text-gray-500">
                      {fmtDate(po.createdAt)}
                    </td>
                    <td className="table-cell">
                      <Link
                        href={`/integration/punchout/orders/${po.orderId}`}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {data.length} order{data.length !== 1 ? 's' : ''}
            {totalValue > 0 && (
              <span className="ml-4 font-medium text-gray-600">
                Filtered total: {fmt(filtered.reduce((s, o) => s + (o.totalAmount ?? 0), 0))}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
