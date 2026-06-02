'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, ChevronRight, Clock, CheckCircle2, XCircle,
  AlertCircle, RefreshCw, ArrowLeft, User, DollarSign,
  Hash, MapPin, CreditCard, FileText, ChevronDown,
  Truck, Tag, Barcode,
} from 'lucide-react';
import { getPunchOutOrder, updatePunchOutOrderStatus } from '@/lib/api';
import type { PunchOutOrder, PunchOutLineItem } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n?: number, currency = 'USD') {
  return (n ?? 0).toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 2 });
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  RECEIVED:   { label: 'Received',   color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Clock },
  PROCESSING: { label: 'Processing', color: 'text-purple-700', bg: 'bg-purple-100', icon: RefreshCw },
  CONFIRMED:  { label: 'Confirmed',  color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle2 },
  CANCELLED:  { label: 'Cancelled',  color: 'text-gray-600',   bg: 'bg-gray-100',   icon: XCircle },
  FAILED:     { label: 'Failed',     color: 'text-red-700',    bg: 'bg-red-100',    icon: AlertCircle },
};

// Valid status transitions
const TRANSITIONS: Record<string, string[]> = {
  RECEIVED:   ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['CONFIRMED', 'FAILED', 'CANCELLED'],
  CONFIRMED:  [],
  CANCELLED:  [],
  FAILED:     ['PROCESSING'],
};

// ── Address card ──────────────────────────────────────────────────────────────

function AddressCard({ title, data, icon: Icon }: {
  title: string;
  data?: Record<string, string>;
  icon: React.ElementType;
}) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      </div>
      <div className="space-y-1">
        {Object.entries(data).map(([k, v]) => (
          v ? (
            <div key={k} className="flex gap-2 text-xs">
              <span className="text-gray-400 w-24 flex-shrink-0 capitalize">
                {k.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-gray-700">{v}</span>
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
}

// ── Line items table ──────────────────────────────────────────────────────────

function LineItemsTable({ items, currency }: { items: PunchOutLineItem[]; currency: string }) {
  const lineTotal = items.reduce((s, li) => s + (li.quantity ?? 0) * (li.unitPrice ?? 0), 0);

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Package className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-700">Line Items</h4>
        <span className="ml-auto text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="table-header">#</th>
              <th className="table-header">Part ID</th>
              <th className="table-header">Description</th>
              <th className="table-header">UNSPSC</th>
              <th className="table-header">Manufacturer</th>
              <th className="table-header text-right">Qty</th>
              <th className="table-header">UOM</th>
              <th className="table-header text-right">Unit Price</th>
              <th className="table-header text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((li, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell text-gray-400 text-xs">{li.lineNumber ?? i + 1}</td>
                <td className="table-cell">
                  <div>
                    <p className="font-mono text-xs text-blue-700 font-medium">{li.supplierPartId || '—'}</p>
                    {li.supplierPartAuxId && (
                      <p className="font-mono text-xs text-gray-400">{li.supplierPartAuxId}</p>
                    )}
                  </div>
                </td>
                <td className="table-cell max-w-[200px]">
                  <p className="text-sm text-gray-800 truncate">{li.description || '—'}</p>
                </td>
                <td className="table-cell">
                  {li.unspscCode
                    ? <span className="font-mono text-xs text-gray-600">{li.unspscCode}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="table-cell">
                  {li.manufacturerName
                    ? <div>
                        <p className="text-xs text-gray-700">{li.manufacturerName}</p>
                        {li.manufacturerPartId && (
                          <p className="font-mono text-xs text-gray-400">{li.manufacturerPartId}</p>
                        )}
                      </div>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="table-cell text-right font-medium text-gray-900">
                  {li.quantity}
                </td>
                <td className="table-cell text-xs text-gray-500">{li.unitOfMeasure || '—'}</td>
                <td className="table-cell text-right text-gray-700">
                  {fmt(li.unitPrice, li.currency || currency)}
                </td>
                <td className="table-cell text-right font-semibold text-gray-900">
                  {fmt((li.quantity ?? 0) * (li.unitPrice ?? 0), li.currency || currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan={8} className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right">
                Order Total
              </td>
              <td className="px-4 py-2.5 text-right text-base font-bold text-gray-900">
                {fmt(lineTotal, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Status stepper ────────────────────────────────────────────────────────────

function StatusStepper({ current }: { current: string }) {
  const steps = ['RECEIVED', 'PROCESSING', 'CONFIRMED'];
  const terminal = current === 'CANCELLED' || current === 'FAILED';

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const idx = steps.indexOf(current);
        const done   = !terminal && i < idx;
        const active = !terminal && s === current;
        const future = !done && !active;
        const cfg    = STATUS_CFG[s];
        const Icon   = cfg.icon;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              active ? `${cfg.bg} ${cfg.color}` :
              done   ? 'bg-green-50 text-green-600' :
                       'bg-gray-100 text-gray-400'
            }`}>
              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              {cfg.label}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className={`w-3.5 h-3.5 ${done ? 'text-green-400' : 'text-gray-300'}`} />
            )}
          </div>
        );
      })}
      {terminal && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${STATUS_CFG[current].bg} ${STATUS_CFG[current].color}`}>
            {(() => { const Icon = STATUS_CFG[current].icon; return <Icon className="w-3.5 h-3.5" />; })()}
            {STATUS_CFG[current].label}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PunchOutOrderDetailPage() {
  const params   = useParams<{ orderId: string }>();
  const router   = useRouter();
  const orderId  = params.orderId;

  const [order, setOrder]     = useState<PunchOutOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdate] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPunchOutOrder(orderId);
      setOrder(res);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setUpdate(true);
    try {
      const updated = await updatePunchOutOrderStatus(order.orderId, newStatus);
      setOrder(updated);
    } catch {
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading order {orderId}…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-700">Order not found</p>
          <p className="text-sm text-gray-400 mt-1">{error ?? `No order with ID ${orderId}`}</p>
          <Link href="/integration/punchout/orders" className="btn-secondary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const nextStatuses = TRANSITIONS[order.status] ?? [];
  const statusCfg    = STATUS_CFG[order.status] ?? STATUS_CFG['RECEIVED'];

  return (
    <div className="space-y-5">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/integration/punchout" className="hover:text-blue-600">PunchOut</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/integration/punchout/orders" className="hover:text-blue-600">Orders</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-mono text-gray-700 font-medium">{order.orderId}</span>
      </div>

      {/* Title + status actions */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900 font-mono">
                #{order.orderId}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                {(() => { const Icon = statusCfg.icon; return <Icon className="w-4 h-4" />; })()}
                {statusCfg.label}
              </span>
              {order.orderType !== 'new' && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium uppercase">
                  {order.orderType}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Received from <strong className="text-gray-700">{order.buyerIdentity}</strong>
              {order.agreementId && <> · Agreement <code className="text-xs bg-gray-100 px-1 rounded">{order.agreementId}</code></>}
            </p>
          </div>

          {/* Status transition buttons */}
          {nextStatuses.length > 0 && (
            <div className="flex items-center gap-2">
              {nextStatuses.map(s => {
                const cfg  = STATUS_CFG[s];
                const Icon = cfg.icon;
                const isGreen  = s === 'CONFIRMED';
                const isRed    = s === 'CANCELLED' || s === 'FAILED';
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updating}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      isGreen ? 'bg-green-600 hover:bg-green-700 text-white' :
                      isRed   ? 'border border-red-300 text-red-600 hover:bg-red-50' :
                                'btn-primary'
                    }`}
                  >
                    {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                    Mark {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status stepper */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <StatusStepper current={order.status} />
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Order Date',  value: fmtDate(order.orderDate),  icon: Clock },
          { label: 'Received',    value: fmtDate(order.createdAt),  icon: FileText },
          { label: 'Last Updated',value: fmtDate(order.updatedAt),  icon: RefreshCw },
          { label: 'Order Total', value: fmt(order.totalAmount, order.currency), icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-3 flex items-start gap-2.5">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Addresses */}
      {((order.shipTo && Object.keys(order.shipTo).length > 0) ||
        (order.billTo && Object.keys(order.billTo).length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {order.shipTo && Object.keys(order.shipTo).length > 0 && (
            <AddressCard title="Ship To" data={order.shipTo} icon={Truck} />
          )}
          {order.billTo && Object.keys(order.billTo).length > 0 && (
            <AddressCard title="Bill To" data={order.billTo} icon={CreditCard} />
          )}
        </div>
      )}

      {/* Line items */}
      {order.lineItems && order.lineItems.length > 0 && (
        <LineItemsTable items={order.lineItems} currency={order.currency} />
      )}

      {/* Raw cXML note */}
      <div className="card p-4 bg-gray-50 border-gray-200">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-600">Raw cXML Stored</p>
            <p className="text-xs text-gray-400 mt-0.5">
              The original Ariba <code className="bg-gray-200 px-1 rounded">OrderRequest</code> cXML is stored in
              the database for audit and replay purposes. Contact your backend administrator to retrieve it
              via the <code className="bg-gray-200 px-1 rounded">/punchout/orders/{'{orderId}'}/raw</code> endpoint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
