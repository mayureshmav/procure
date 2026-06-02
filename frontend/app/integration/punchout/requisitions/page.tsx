'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList, RefreshCw, Search, ChevronDown, ChevronRight,
  User, DollarSign, Package, Calendar, ShoppingCart,
} from 'lucide-react';
import { getPunchOutRequisitions } from '@/lib/api';
import type { PunchOutRequisition, PunchOutLineItem } from '@/types';

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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700' },
  CONVERTED: { label: 'Converted', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
};

// ── Line items sub-table ──────────────────────────────────────────────────────

function LineItemsTable({ items }: { items: PunchOutLineItem[] }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-gray-400 italic">No line items</p>;
  }
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-gray-400 border-b border-gray-100">
          <th className="pb-1 pr-3 font-medium">#</th>
          <th className="pb-1 pr-3 font-medium">Part ID</th>
          <th className="pb-1 pr-3 font-medium">Description</th>
          <th className="pb-1 pr-3 font-medium text-right">Qty</th>
          <th className="pb-1 pr-3 font-medium">UOM</th>
          <th className="pb-1 font-medium text-right">Unit Price</th>
          <th className="pb-1 font-medium text-right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((li, i) => (
          <tr key={i} className="border-b border-gray-50 last:border-0">
            <td className="py-1.5 pr-3 text-gray-400">{i + 1}</td>
            <td className="py-1.5 pr-3 font-mono text-gray-700">{li.supplierPartId || '—'}</td>
            <td className="py-1.5 pr-3 text-gray-700 max-w-[200px] truncate">{li.description || '—'}</td>
            <td className="py-1.5 pr-3 text-right text-gray-700">{li.quantity}</td>
            <td className="py-1.5 pr-3 text-gray-500">{li.unitOfMeasure || '—'}</td>
            <td className="py-1.5 text-right text-gray-700">{fmt(li.unitPrice, li.currency)}</td>
            <td className="py-1.5 text-right font-medium text-gray-900">
              {fmt((li.quantity ?? 0) * (li.unitPrice ?? 0), li.currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Requisition row ───────────────────────────────────────────────────────────

function RequisitionRow({ req }: { req: PunchOutRequisition }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_MAP[req.status] ?? { label: req.status, color: 'bg-gray-100 text-gray-500' };

  let extrinsics: Record<string, string> = {};
  // buyer cookie doesn't have extrinsics, but we can show truncated cookie
  const buyerDisplay = req.buyerCookie.length > 24
    ? req.buyerCookie.slice(0, 24) + '…'
    : req.buyerCookie;

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="table-cell">
          <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            #{req.id}
          </span>
        </td>
        <td className="table-cell">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-mono text-xs text-gray-600">{buyerDisplay}</span>
          </div>
        </td>
        <td className="table-cell">
          <div className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm">{req.lineItems?.length ?? 0}</span>
          </div>
        </td>
        <td className="table-cell text-right font-semibold text-gray-900">
          {fmt(req.totalAmount, req.currency)}
        </td>
        <td className="table-cell">
          {req.shippingAmount != null && req.shippingAmount > 0
            ? <span className="text-xs text-gray-500">{fmt(req.shippingAmount, req.currency)}</span>
            : <span className="text-xs text-gray-300">—</span>}
        </td>
        <td className="table-cell">
          {req.taxAmount != null && req.taxAmount > 0
            ? <span className="text-xs text-gray-500">{fmt(req.taxAmount, req.currency)}</span>
            : <span className="text-xs text-gray-300">—</span>}
        </td>
        <td className="table-cell">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </td>
        <td className="table-cell text-xs text-gray-500">{fmtDate(req.createdAt)}</td>
        <td className="table-cell">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="bg-blue-50/40 px-6 py-4 border-b border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span><strong className="text-gray-700">Buyer Cookie:</strong> {req.buyerCookie}</span>
                <span><strong className="text-gray-700">Operation Allowed:</strong> {req.operationAllowed || 'edit'}</span>
                <span><strong className="text-gray-700">Currency:</strong> {req.currency}</span>
              </div>
              <LineItemsTable items={req.lineItems} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PunchOutRequisitionsPage() {
  const [data, setData]     = useState<PunchOutRequisition[]>([]);
  const [loading, setLoad]  = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const load = async () => {
    setLoad(true);
    try {
      const res = await getPunchOutRequisitions();
      setData(Array.isArray(res) ? res : []);
    } finally {
      setLoad(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(r => {
    if (status !== 'ALL' && r.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.buyerCookie.toLowerCase().includes(q) || String(r.id).includes(q);
    }
    return true;
  });

  const counts = { ALL: data.length, PENDING: 0, CONVERTED: 0, CANCELLED: 0 };
  data.forEach(r => { counts[r.status as keyof typeof counts] = (counts[r.status as keyof typeof counts] ?? 0) + 1; });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/integration/punchout" className="hover:text-blue-600">PunchOut</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-700 font-medium">Requisitions</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PunchOut Requisitions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Carts received from buyers via PunchOutOrderMessage — pending conversion to Purchase Orders</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1">
        {(['ALL', 'PENDING', 'CONVERTED', 'CANCELLED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              status === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              status === s ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + table */}
      <div className="card">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Search by ID or buyer cookie…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Buyer Cookie</th>
                <th className="table-header">Lines</th>
                <th className="table-header text-right">Total</th>
                <th className="table-header">Shipping</th>
                <th className="table-header">Tax</th>
                <th className="table-header">Status</th>
                <th className="table-header">Received</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
                    Loading requisitions…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No requisitions found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(r => <RequisitionRow key={r.id} req={r} />)
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {data.length} requisition{data.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
