'use client';

import { useEffect, useState } from 'react';
import {
  getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, submitPO,
  receiveGoods, closePO, cancelPO, getVendors, getItems, addPOLine, getRequisitions,
  createPOFromReq,
} from '@/lib/api';
import { PurchaseOrder, PurchaseOrderLine, Vendor, Item, Requisition, PoOrderType } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import TaxSummary from '@/components/TaxSummary';
import { useAuth } from '@/context/AuthContext';
import {
  Plus, ArrowLeft, ChevronRight, Truck, Check, Ban,
  AlertTriangle, Info, ShoppingCart, Archive, RefreshCw,
  Wrench, Zap, BookMarked, Package, CheckCircle, Loader2,
  Send, ClipboardList, GitBranch,
} from 'lucide-react';

// ── PO Order Type definitions ─────────────────────────────────────────────────

interface OrderTypeDef {
  label:       string;
  icon:        React.ElementType;
  color:       string;               // badge colour classes
  borderColor: string;               // card border when selected
  bgColor:     string;               // card bg when selected
  iconColor:   string;
  description: string;
  rules:       string[];             // business rules shown in UI
  warning?:    string;               // banner shown on detail view
  canSubmitEdi: boolean;             // false = CONFIRMING only
}

const ORDER_TYPES: Record<PoOrderType, OrderTypeDef> = {
  STANDARD: {
    label: 'Standard PO',
    icon: ShoppingCart,
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-500', bgColor: 'bg-blue-50', iconColor: 'text-blue-600',
    description: 'Regular purchase order sent to the vendor for specific goods or services at agreed price and delivery date.',
    rules: ['Follows full approval workflow', 'Transmitted to vendor via EDI or email', 'GRN required before closure'],
    canSubmitEdi: true,
  },
  CONFIRMING: {
    label: 'Confirming PO',
    icon: BookMarked,
    color: 'bg-orange-100 text-orange-700',
    borderColor: 'border-orange-500', bgColor: 'bg-orange-50', iconColor: 'text-orange-600',
    description: 'Internal documentation only. Created after a verbal or emergency purchase to formalise it for accounting and audit. NOT transmitted to the vendor.',
    rules: ['For internal record-keeping only', 'NOT sent to vendor — never transmitted externally', 'Requires original purchase date and business reason', 'Bypasses vendor EDI / email dispatch'],
    warning: '⚠  CONFIRMING PO — Internal Use Only. This order will NOT be sent to the vendor. It exists solely for internal accounting and audit documentation.',
    canSubmitEdi: false,
  },
  BLANKET: {
    label: 'Blanket PO',
    icon: Archive,
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-500', bgColor: 'bg-purple-50', iconColor: 'text-purple-600',
    description: 'Framework agreement with a vendor for recurring purchases over a defined period and maximum spend cap. Individual "release orders" are raised against it.',
    rules: ['Set maximum spend amount and expiry date', 'Multiple release orders can reference this PO', 'Vendor receives individual releases, not the blanket itself', 'Spend tracked against blanket cap'],
    canSubmitEdi: true,
  },
  STOREROOM: {
    label: 'Storeroom PO',
    icon: Package,
    color: 'bg-teal-100 text-teal-700',
    borderColor: 'border-teal-500', bgColor: 'bg-teal-50', iconColor: 'text-teal-600',
    description: 'Inventory replenishment order. Created to restock a specific storeroom location to its reorder point, typically triggered by a low-stock alert.',
    rules: ['Link to the inventory item being restocked', 'Specify the storeroom / warehouse location', 'Inventory is auto-updated on GRN', 'Often created from an automated reorder trigger'],
    canSubmitEdi: true,
  },
  PLANNED: {
    label: 'Planned PO',
    icon: RefreshCw,
    color: 'bg-indigo-100 text-indigo-700',
    borderColor: 'border-indigo-500', bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600',
    description: 'Pre-scheduled purchase order with a defined future release date, typically generated from a production plan or material requirements plan (MRP).',
    rules: ['Set a planned release date separate from delivery date', 'Held in DRAFT until the release date', 'Can be converted to a Standard PO on release'],
    canSubmitEdi: true,
  },
  SERVICE: {
    label: 'Service PO',
    icon: Wrench,
    color: 'bg-cyan-100 text-cyan-700',
    borderColor: 'border-cyan-500', bgColor: 'bg-cyan-50', iconColor: 'text-cyan-600',
    description: 'For services such as consulting, maintenance, IT support or SLAs. No physical goods receipt — closure uses a service acceptance form instead.',
    rules: ['No goods receipt (GRN) required', 'Closed via service acceptance sign-off', 'Capture service description and accepting manager', 'Line items describe services, not physical goods'],
    canSubmitEdi: true,
  },
  EMERGENCY: {
    label: 'Emergency PO',
    icon: Zap,
    color: 'bg-red-100 text-red-700',
    borderColor: 'border-red-500', bgColor: 'bg-red-50', iconColor: 'text-red-600',
    description: 'Urgent purchase order for critical business continuity. Bypasses the standard approval workflow but requires written justification and an authorising manager.',
    rules: ['Bypass normal approval — immediate DRAFT → SUBMITTED allowed', 'Mandatory justification statement required', 'Authorising manager name must be captured', 'Post-facto review required within 5 business days'],
    warning: '⚡ EMERGENCY PO — This order bypasses standard approval. Justification and authorising manager are mandatory. A post-facto review is required within 5 business days.',
    canSubmitEdi: true,
  },
};

const STATUS_FILTERS = ['ALL','DRAFT','SUBMITTED','ACKNOWLEDGED','PARTIALLY_RECEIVED','RECEIVED','CLOSED','CANCELLED'];

const fmt = (n?: number | null) => n != null ? `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

// ── Component ─────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const { canAccess } = useAuth();
  const canCreate  = canAccess('purchaseOrders', 'create');
  const canEdit    = canAccess('purchaseOrders', 'edit');
  const canApprove = canAccess('purchaseOrders', 'approve');
  const canDelete  = canAccess('purchaseOrders', 'delete');

  const [pos, setPOs]                 = useState<PurchaseOrder[]>([]);
  const [selected, setSelected]       = useState<PurchaseOrder | null>(null);
  const [vendors, setVendors]         = useState<Vendor[]>([]);
  const [items, setItems]             = useState<Item[]>([]);
  const [approvedReqs, setApprovedReqs] = useState<Requisition[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter]   = useState<PoOrderType | 'ALL'>('ALL');

  const [showCreate, setShowCreate]   = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showAcceptService, setShowAcceptService] = useState(false);

  // Create form
  const [selectedType, setSelectedType] = useState<PoOrderType>('STANDARD');
  const [newPO, setNewPO] = useState({
    vendorId: '', deliveryDate: '', notes: '',
    // blanket
    blanketMaxAmount: '', blanketExpiryDate: '',
    // storeroom
    storeroomLocation: '', storeroomItemId: '',
    // confirming
    confirmingReason: '', confirmingOriginalDate: '',
    // planned
    plannedReleaseDate: '',
    // emergency
    emergencyJustification: '', emergencyAuthorisedBy: '',
    // service
    serviceDescription: '',
  });

  const [lineForm, setLineForm] = useState({ itemId: '', description: '', orderedQty: 1, unitPrice: 0, uom: 'EA', glAccount: '' });
  const [receiveQtys, setReceiveQtys] = useState<Record<number, number>>({});
  const [serviceAccept, setServiceAccept] = useState({ date: '', acceptedBy: '' });

  // GRN, dispatch, blanket state
  const [grns, setGrns] = useState<any[]>([]);
  const [dispatchLog, setDispatchLog] = useState<any[]>([]);
  const [blanketReleases, setBlanketReleases] = useState<any[]>([]);
  const [showRelease, setShowRelease] = useState(false);
  const [releaseForm, setReleaseForm] = useState({ amount: '', notes: '' });

  const load = () => {
    setLoading(true);
    Promise.all([getPurchaseOrders(), getVendors(), getItems(), getRequisitions({ status: 'APPROVED' })])
      .then(([p, v, i, r]) => { setPOs(p as PurchaseOrder[]); setVendors(v as Vendor[]); setItems(i as Item[]); setApprovedReqs(r as Requisition[]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id: number) => {
    const po = await getPurchaseOrder(id) as PurchaseOrder;
    setSelected(po);
    const qtys: Record<number, number> = {};
    (po.lines ?? []).forEach((l: PurchaseOrderLine) => { if (l.id) qtys[l.id] = 0; });
    setReceiveQtys(qtys);
    setGrns([]); setDispatchLog([]); setBlanketReleases([]);

    const token = localStorage.getItem('token');
    const h = token ? { Authorization: `Bearer ${token}` } : {};
    // Fetch GRNs, dispatch log, and (for blankets) releases
    Promise.all([
      fetch(`/api/purchase-orders/${id}/grns`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`/api/purchase-orders/${id}/dispatch-log`, { headers: h }).then(r => r.ok ? r.json() : []),
      po.orderType === 'BLANKET'
        ? fetch(`/api/purchase-orders/${id}/releases`, { headers: h }).then(r => r.ok ? r.json() : [])
        : Promise.resolve([]),
    ]).then(([g, d, rel]) => { setGrns(g); setDispatchLog(d); setBlanketReleases(rel); })
      .catch(() => {});
  };

  const handleCreateRelease = async () => {
    if (!selected?.id || !releaseForm.amount) return;
    const token = localStorage.getItem('token');
    const h = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    await fetch(`/api/purchase-orders/${selected.id}/release`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ amount: parseFloat(releaseForm.amount), notes: releaseForm.notes }),
    });
    setShowRelease(false);
    setReleaseForm({ amount: '', notes: '' });
    openDetail(selected.id);
  };

  const handleCreate = async () => {
    const vendor = vendors.find(v => v.id === parseInt(newPO.vendorId));
    if (!vendor) return;
    await createPurchaseOrder({
      vendor: { id: vendor.id },
      orderType: selectedType,
      deliveryDate:           newPO.deliveryDate || null,
      notes:                  newPO.notes || null,
      blanketMaxAmount:       newPO.blanketMaxAmount    ? parseFloat(newPO.blanketMaxAmount) : null,
      blanketExpiryDate:      newPO.blanketExpiryDate   || null,
      storeroomLocation:      newPO.storeroomLocation   || null,
      storeroomItemId:        newPO.storeroomItemId     ? parseInt(newPO.storeroomItemId) : null,
      confirmingReason:       newPO.confirmingReason    || null,
      confirmingOriginalDate: newPO.confirmingOriginalDate || null,
      plannedReleaseDate:     newPO.plannedReleaseDate  || null,
      emergencyJustification: newPO.emergencyJustification || null,
      emergencyAuthorisedBy:  newPO.emergencyAuthorisedBy  || null,
      serviceDescription:     newPO.serviceDescription  || null,
    });
    setShowCreate(false);
    setSelectedType('STANDARD');
    setNewPO({ vendorId:'', deliveryDate:'', notes:'', blanketMaxAmount:'', blanketExpiryDate:'', storeroomLocation:'', storeroomItemId:'', confirmingReason:'', confirmingOriginalDate:'', plannedReleaseDate:'', emergencyJustification:'', emergencyAuthorisedBy:'', serviceDescription:'' });
    load();
  };

  const handleAddLine = async () => {
    if (!selected?.id) return;
    const item = items.find(i => i.id === parseInt(lineForm.itemId));
    await addPOLine(selected.id, { ...lineForm, itemId: parseInt(lineForm.itemId), item });
    setShowAddLine(false);
    setLineForm({ itemId: '', description: '', orderedQty: 1, unitPrice: 0, uom: 'EA', glAccount: '' });
    openDetail(selected.id);
  };

  const handleSubmit = async () => {
    if (!selected?.id) return;
    const def = ORDER_TYPES[selected.orderType ?? 'STANDARD'];
    if (!def.canSubmitEdi) {
      if (!confirm('This is a CONFIRMING PO for internal use only. It will be recorded but NOT sent to the vendor. Proceed?')) return;
    }
    const updated = await submitPO(selected.id) as PurchaseOrder;
    setSelected(updated); load();
  };

  const handleReceive = async () => {
    if (!selected?.id) return;
    const qtys: Record<number, number> = {};
    Object.entries(receiveQtys).forEach(([k, v]) => { if (v > 0) qtys[Number(k)] = v; });
    const updated = await receiveGoods(selected.id, qtys) as PurchaseOrder;
    setSelected(updated); setShowReceive(false); load();
  };

  const handleServiceAccept = async () => {
    if (!selected?.id) return;
    // In production: call a dedicated endpoint. For now use closePO with date capture.
    const updated = await closePO(selected.id) as PurchaseOrder;
    setSelected({ ...updated, serviceAcceptanceDate: serviceAccept.date, serviceAcceptedBy: serviceAccept.acceptedBy });
    setShowAcceptService(false); load();
  };

  // Apply filters
  const filtered = pos.filter(po => {
    const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
    const matchType   = typeFilter   === 'ALL' || (po.orderType ?? 'STANDARD') === typeFilter;
    return matchStatus && matchType;
  });

  const typeDef = (po: PurchaseOrder) => ORDER_TYPES[po.orderType ?? 'STANDARD'];

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selected) {
    const def  = typeDef(selected);
    const Icon = def.icon;

    return (
      <div className="p-8 max-w-5xl mx-auto">
        {/* Back */}
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> All Purchase Orders
        </button>

        {/* Order type warning banner */}
        {def.warning && (
          <div className={`flex items-start gap-3 rounded-xl p-4 mb-4 border ${
            selected.orderType === 'CONFIRMING' ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selected.orderType === 'CONFIRMING' ? 'text-orange-600' : 'text-red-600'}`} />
            <p className={`text-sm font-medium ${selected.orderType === 'CONFIRMING' ? 'text-orange-800' : 'text-red-800'}`}>
              {def.warning}
            </p>
          </div>
        )}

        {/* Header card */}
        <div className="card p-6 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${def.bgColor}`}>
                <Icon className={`w-6 h-6 ${def.iconColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 font-mono">{selected.poNumber}</h1>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${def.color}`}>{def.label}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                  <span><b>Vendor:</b> {selected.vendor?.name}</span>
                  {selected.deliveryDate && <span><b>Delivery:</b> {new Date(selected.deliveryDate).toLocaleDateString()}</span>}
                  {selected.requisition?.reqNumber && <span><b>From REQ:</b> {selected.requisition.reqNumber}</span>}
                  {selected.createdAt && <span><b>Created:</b> {new Date(selected.createdAt).toLocaleDateString()}</span>}
                </div>
                {selected.notes && <p className="mt-2 text-sm text-gray-500 italic">{selected.notes}</p>}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 flex-shrink-0">{fmt(selected.totalAmount)}</p>
          </div>

          {/* Tax Summary — shown for all POs with an id */}
          {selected.id && (
            <TaxSummary
              poId={selected.id}
              poStatus={selected.status}
              onRecalculated={() => getPurchaseOrder(selected.id!).then(setSelected)}
            />
          )}

          {/* Type-specific metadata */}
          <OrderTypeMetadata po={selected} />
        </div>

        {/* Action buttons — gated by type + permission */}
        <div className="flex flex-wrap gap-3 mb-5">
          {selected.status === 'DRAFT' && canEdit && (
            <>
              <button onClick={() => setShowAddLine(true)} className="btn-secondary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Line
              </button>
              <button onClick={handleSubmit} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white ${
                selected.orderType === 'CONFIRMING' ? 'bg-orange-500 hover:bg-orange-600' :
                selected.orderType === 'EMERGENCY'  ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                <Check className="w-4 h-4" />
                {selected.orderType === 'CONFIRMING' ? 'Record (Internal Only)' : 'Submit PO'}
              </button>
            </>
          )}
          {/* Goods receipt — not for SERVICE type */}
          {['SUBMITTED','ACKNOWLEDGED','PARTIALLY_RECEIVED'].includes(selected.status) && canApprove && selected.orderType !== 'SERVICE' && (
            <button onClick={() => setShowReceive(true)} className="btn-primary flex items-center gap-2">
              <Truck className="w-4 h-4" /> Receive Goods
            </button>
          )}
          {/* Service acceptance — only for SERVICE type */}
          {selected.status === 'SUBMITTED' && canApprove && selected.orderType === 'SERVICE' && (
            <button onClick={() => setShowAcceptService(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700">
              <CheckCircle className="w-4 h-4" /> Accept Service
            </button>
          )}
          {selected.status === 'RECEIVED' && canApprove && (
            <button onClick={async () => { const u = await closePO(selected.id!); setSelected(u as PurchaseOrder); load(); }}
              className="btn-primary flex items-center gap-2">
              <Check className="w-4 h-4" /> Close PO
            </button>
          )}
          {['DRAFT','SUBMITTED'].includes(selected.status) && canDelete && (
            <button onClick={async () => { const u = await cancelPO(selected.id!); setSelected(u as PurchaseOrder); load(); }}
              className="btn-danger flex items-center gap-2">
              <Ban className="w-4 h-4" /> Cancel
            </button>
          )}
          {/* Pending hint for non-approvers */}
          {['SUBMITTED','ACKNOWLEDGED','PARTIALLY_RECEIVED'].includes(selected.status) && !canApprove && (
            <span className="text-sm text-gray-400 italic self-center">Awaiting receipt by an authorised user</span>
          )}
          {selected.orderType === 'CONFIRMING' && selected.status === 'SUBMITTED' && (
            <span className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5" /> Not transmitted to vendor — internal record only
            </span>
          )}
        </div>

        {/* Lines table */}
        <div className="card">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {selected.orderType === 'SERVICE' ? 'Service Items' : 'Line Items'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#','Description','Ordered Qty','Received Qty','UOM','Unit Price','Total','GL Account']
                    .map(h => <th key={h} className="table-header">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(selected.lines ?? []).map((line: PurchaseOrderLine, idx: number) => (
                  <tr key={line.id ?? idx}>
                    <td className="table-cell text-gray-400">{idx + 1}</td>
                    <td className="table-cell font-medium">{line.item?.name ?? line.description}</td>
                    <td className="table-cell text-center">{line.orderedQty}</td>
                    <td className="table-cell text-center">
                      <span className={`font-semibold ${
                        selected.orderType === 'SERVICE' ? 'text-gray-400' :
                        (line.receivedQty ?? 0) >= line.orderedQty ? 'text-green-600' :
                        (line.receivedQty ?? 0) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {selected.orderType === 'SERVICE' ? '—' : (line.receivedQty ?? 0)}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">{line.uom}</td>
                    <td className="table-cell">{fmt(line.unitPrice)}</td>
                    <td className="table-cell font-semibold">{fmt((line.orderedQty ?? 0) * (line.unitPrice ?? 0))}</td>
                    <td className="table-cell text-gray-400 font-mono text-xs">{line.glAccount ?? '—'}</td>
                  </tr>
                ))}
                {(selected.lines ?? []).length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No lines added yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Dispatch Log ──────────────────────────────────────────────────── */}
        {dispatchLog.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-gray-800">Dispatch Log</h3>
            </div>
            <div className="space-y-2">
              {dispatchLog.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.dispatchType === 'EDI' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{d.dispatchType}</span>
                  <span className="text-gray-500">{d.recipient}</span>
                  <span className="text-gray-400">·</span>
                  <span className={`font-medium ${d.status === 'SENT' ? 'text-green-600' : 'text-red-600'}`}>{d.status}</span>
                  <span className="text-gray-400 text-xs ml-auto">{d.sentAt ? new Date(d.sentAt).toLocaleString() : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GRN Receipts ──────────────────────────────────────────────────── */}
        {grns.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-gray-800">Goods Receipt Notes</h3>
            </div>
            <div className="space-y-3">
              {grns.map((grn: any) => (
                <div key={grn.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-semibold text-green-700">{grn.grnNumber}</span>
                    <span className="text-xs text-gray-400">{grn.receivedAt ? new Date(grn.receivedAt).toLocaleDateString() : ''}</span>
                  </div>
                  {(grn.lines ?? []).length > 0 && (
                    <table className="w-full text-xs">
                      <thead><tr className="text-gray-500">{['Line','Qty Received','Unit Price','Total'].map(h => <th key={h} className="text-left py-1 font-medium">{h}</th>)}</tr></thead>
                      <tbody>
                        {grn.lines.map((l: any) => (
                          <tr key={l.id}>
                            <td className="py-1">{l.purchaseOrderLine?.description ?? l.purchaseOrderLine?.item?.name ?? '—'}</td>
                            <td className="py-1">{l.receivedQty}</td>
                            <td className="py-1">${Number(l.receivedPrice ?? 0).toFixed(2)}</td>
                            <td className="py-1 font-semibold">${Number(l.lineTotal ?? 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Blanket PO: Release Orders ────────────────────────────────────── */}
        {selected.orderType === 'BLANKET' && (
          <div className="mt-6 bg-white rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-gray-800">Blanket Release Orders</h3>
              </div>
              {['SUBMITTED','ACKNOWLEDGED'].includes(selected.status) && canApprove && (
                <button onClick={() => setShowRelease(true)}
                  className="flex items-center gap-1.5 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700">
                  <Plus className="w-3.5 h-3.5" /> Create Release Order
                </button>
              )}
            </div>

            {/* Spend tracker */}
            {selected.blanketMaxAmount && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Released: ${Number(selected.blanketReleasedAmount ?? 0).toLocaleString()}</span>
                  <span>Cap: ${Number(selected.blanketMaxAmount).toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (Number(selected.blanketReleasedAmount ?? 0) / Number(selected.blanketMaxAmount)) * 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Remaining: ${(Number(selected.blanketMaxAmount) - Number(selected.blanketReleasedAmount ?? 0)).toLocaleString()}
                  {selected.blanketExpiryDate && ` · Expires ${new Date(selected.blanketExpiryDate).toLocaleDateString()}`}
                </p>
              </div>
            )}

            {blanketReleases.length === 0 ? (
              <p className="text-sm text-gray-400">No release orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['PO #','Status','Amount','Created'].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {blanketReleases.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(r.id)}>
                      <td className="px-3 py-2 font-mono text-xs text-blue-600">{r.poNumber}</td>
                      <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2 font-semibold">${Number(r.totalAmount ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modals */}
        {showAddLine && (
          <Modal title="Add Line Item" onClose={() => setShowAddLine(false)}>
            <div className="space-y-4">
              <div>
                <label className="input-label">Item</label>
                <select className="input-field" value={lineForm.itemId} onChange={e => {
                  const item = items.find(i => i.id === parseInt(e.target.value));
                  setLineForm(p => ({ ...p, itemId: e.target.value, description: item?.name ?? '', unitPrice: item?.unitPrice ?? 0, uom: item?.uom ?? 'EA' }));
                }}>
                  <option value="">— Select Item —</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                </select>
              </div>
              {!lineForm.itemId && (
                <div><label className="input-label">Description (free text)</label>
                  <input className="input-field" value={lineForm.description} onChange={e => setLineForm(p => ({ ...p, description: e.target.value }))} /></div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="input-label">Quantity</label>
                  <input type="number" className="input-field" value={lineForm.orderedQty} onChange={e => setLineForm(p => ({ ...p, orderedQty: +e.target.value }))} min={1} /></div>
                <div><label className="input-label">Unit Price</label>
                  <input type="number" className="input-field" value={lineForm.unitPrice} onChange={e => setLineForm(p => ({ ...p, unitPrice: +e.target.value }))} /></div>
                <div><label className="input-label">UOM</label>
                  <input className="input-field" value={lineForm.uom} onChange={e => setLineForm(p => ({ ...p, uom: e.target.value }))} /></div>
              </div>
              <div><label className="input-label">GL Account</label>
                <input className="input-field font-mono" value={lineForm.glAccount} onChange={e => setLineForm(p => ({ ...p, glAccount: e.target.value }))} placeholder="e.g. 5200-001" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddLine(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleAddLine} className="btn-primary">Add Line</button>
              </div>
            </div>
          </Modal>
        )}

        {showRelease && (
          <Modal title="Create Release Order" onClose={() => setShowRelease(false)}>
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                Blanket: <strong>{selected.poNumber}</strong> ·
                Cap: <strong>${Number(selected.blanketMaxAmount ?? 0).toLocaleString()}</strong> ·
                Remaining: <strong>${(Number(selected.blanketMaxAmount ?? 0) - Number(selected.blanketReleasedAmount ?? 0)).toLocaleString()}</strong>
              </div>
              <div>
                <label className="input-label">Release Amount *</label>
                <input type="number" className="input-field" placeholder="e.g. 5000"
                  value={releaseForm.amount} onChange={e => setReleaseForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Notes</label>
                <textarea className="input-field" rows={2} placeholder="Purpose of this release order…"
                  value={releaseForm.notes} onChange={e => setReleaseForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowRelease(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleCreateRelease} disabled={!releaseForm.amount}
                  className="btn-primary disabled:opacity-50">Create Release</button>
              </div>
            </div>
          </Modal>
        )}

        {showReceive && (
          <Modal title="Receive Goods" onClose={() => setShowReceive(false)} size="lg">
            <p className="text-sm text-gray-500 mb-4">Enter quantities received for each line:</p>
            <table className="w-full text-sm mb-4">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Item','Ordered','Already Received','Receiving Now'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(selected.lines ?? []).map((line: PurchaseOrderLine) => (
                  <tr key={line.id}>
                    <td className="table-cell">{line.item?.name ?? line.description}</td>
                    <td className="table-cell text-center">{line.orderedQty}</td>
                    <td className="table-cell text-center text-gray-500">{line.receivedQty ?? 0}</td>
                    <td className="table-cell text-center">
                      <input type="number" min="0" max={line.orderedQty - (line.receivedQty ?? 0)} className="input-field w-20 text-center"
                        value={line.id ? (receiveQtys[line.id] ?? 0) : 0}
                        onChange={e => line.id && setReceiveQtys(p => ({ ...p, [line.id!]: parseInt(e.target.value) || 0 }))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReceive(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleReceive} className="btn-primary flex items-center gap-2"><Truck className="w-4 h-4" /> Confirm Receipt</button>
            </div>
          </Modal>
        )}

        {showAcceptService && (
          <Modal title="Accept Service Delivery" onClose={() => setShowAcceptService(false)}>
            <div className="space-y-4">
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-sm text-cyan-700">
                Recording that the service described in <b>{selected.poNumber}</b> has been delivered and accepted.
              </div>
              <div><label className="input-label">Acceptance Date *</label>
                <input type="date" className="input-field" value={serviceAccept.date} onChange={e => setServiceAccept(p => ({ ...p, date: e.target.value }))} /></div>
              <div><label className="input-label">Accepted By *</label>
                <input className="input-field" placeholder="Full name of accepting manager" value={serviceAccept.acceptedBy} onChange={e => setServiceAccept(p => ({ ...p, acceptedBy: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAcceptService(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleServiceAccept} disabled={!serviceAccept.date || !serviceAccept.acceptedBy}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" /> Confirm Acceptance
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pos.length} total · {pos.filter(p => p.status === 'DRAFT').length} draft</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New PO
          </button>
        )}
      </div>

      {/* ── Type filter row ── */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setTypeFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${typeFilter === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
          All Types
        </button>
        {(Object.entries(ORDER_TYPES) as [PoOrderType, OrderTypeDef][]).map(([type, def]) => {
          const Icon = def.icon;
          return (
            <button key={type} onClick={() => setTypeFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                typeFilter === type ? `${def.color} border-current` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
              <Icon className="w-3.5 h-3.5" />{def.label}
            </button>
          );
        })}
      </div>

      {/* ── Status filter row ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['PO Number','Order Type','Vendor','From REQ','Status','Total','Delivery','Created',''].map(h =>
                    <th key={h} className="table-header">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(po => {
                  const def  = typeDef(po);
                  const Icon = def.icon;
                  return (
                    <tr key={po.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => po.id && openDetail(po.id)}>
                      <td className="table-cell">
                        <span className="font-mono font-semibold text-blue-600">{po.poNumber}</span>
                        {po.orderType === 'CONFIRMING' && (
                          <div className="text-xs text-orange-500 font-medium mt-0.5">Internal Only</div>
                        )}
                        {po.orderType === 'EMERGENCY' && (
                          <div className="text-xs text-red-500 font-medium mt-0.5">Emergency</div>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${def.color}`}>
                          <Icon className="w-3 h-3" />{def.label}
                        </span>
                      </td>
                      <td className="table-cell font-medium">{po.vendor?.name}</td>
                      <td className="table-cell text-gray-500">{po.requisition?.reqNumber ?? '—'}</td>
                      <td className="table-cell"><StatusBadge status={po.status} /></td>
                      <td className="table-cell font-semibold">{fmt(po.totalAmount)}</td>
                      <td className="table-cell text-gray-500">{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : '—'}</td>
                      <td className="table-cell text-gray-400 text-xs">{po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="table-cell"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">No purchase orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create PO Modal ── */}
      {showCreate && (
        <Modal title="New Purchase Order" onClose={() => setShowCreate(false)} size="lg">
          <div className="space-y-5">

            {/* Create from Approved Requisition shortcut */}
            {approvedReqs.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" /> Quick Create from Approved Requisition
                </p>
                <div className="flex gap-2 flex-wrap">
                  {approvedReqs.map(req => (
                    <button
                      key={req.id}
                      onClick={async () => {
                        if (!req.id) return;
                        try {
                          await createPOFromReq(req.id);
                          setShowCreate(false);
                          load();
                        } catch (err: any) {
                          alert(err?.response?.data?.message ?? 'Conversion failed — ensure all lines have a vendor.');
                        }
                      }}
                      className="text-xs px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                    >
                      {req.reqNumber} — {req.title}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-2">Or create a new PO manually below ↓</p>
              </div>
            )}

            <hr className={approvedReqs.length > 0 ? 'border-gray-100' : 'hidden'} />

            {/* Step 1 — Order Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Step 1 — Select Order Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(ORDER_TYPES) as [PoOrderType, OrderTypeDef][]).map(([type, def]) => {
                  const Icon = def.icon;
                  const active = selectedType === type;
                  return (
                    <label key={type} className={`flex items-start gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                      active ? `${def.borderColor} ${def.bgColor}` : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="orderType" value={type} checked={active}
                        onChange={() => setSelectedType(type)} className="sr-only" />
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? def.bgColor : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${active ? def.iconColor : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800">{def.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{def.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Selected type rules */}
            {selectedType && (
              <div className={`rounded-xl p-3.5 border ${ORDER_TYPES[selectedType].bgColor} ${ORDER_TYPES[selectedType].borderColor.replace('border-','border-').replace('500','200')}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Info className={`w-4 h-4 ${ORDER_TYPES[selectedType].iconColor}`} />
                  <span className={`text-xs font-semibold ${ORDER_TYPES[selectedType].iconColor}`}>Business Rules</span>
                </div>
                {ORDER_TYPES[selectedType].rules.map(r => (
                  <div key={r} className="flex items-start gap-1.5 text-xs text-gray-600 mb-0.5">
                    <span className="mt-0.5 flex-shrink-0">•</span>{r}
                  </div>
                ))}
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Step 2 — Common fields */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Step 2 — Order Details</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="input-label">Vendor *</label>
                  <select className="input-field" value={newPO.vendorId} onChange={e => setNewPO(p => ({ ...p, vendorId: e.target.value }))}>
                    <option value="">— Select Vendor —</option>
                    {vendors.filter(v => v.status === 'ACTIVE').map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Delivery Date</label>
                  <input type="date" className="input-field" value={newPO.deliveryDate} onChange={e => setNewPO(p => ({ ...p, deliveryDate: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Notes</label>
                  <input className="input-field" value={newPO.notes} onChange={e => setNewPO(p => ({ ...p, notes: e.target.value }))} placeholder="Optional internal notes" />
                </div>
              </div>
            </div>

            {/* Step 3 — Type-specific fields */}
            {selectedType !== 'STANDARD' && (
              <>
                <hr className="border-gray-100" />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Step 3 — {ORDER_TYPES[selectedType].label} Details
                  </label>

                  {/* BLANKET */}
                  {selectedType === 'BLANKET' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Maximum Spend Amount *</label>
                        <input type="number" className="input-field" value={newPO.blanketMaxAmount}
                          onChange={e => setNewPO(p => ({ ...p, blanketMaxAmount: e.target.value }))} placeholder="e.g. 50000" />
                        <p className="text-xs text-gray-400 mt-1">Total cap for all release orders against this blanket.</p>
                      </div>
                      <div>
                        <label className="input-label">Blanket Expiry Date *</label>
                        <input type="date" className="input-field" value={newPO.blanketExpiryDate}
                          onChange={e => setNewPO(p => ({ ...p, blanketExpiryDate: e.target.value }))} />
                        <p className="text-xs text-gray-400 mt-1">No new releases after this date.</p>
                      </div>
                    </div>
                  )}

                  {/* STOREROOM */}
                  {selectedType === 'STOREROOM' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Storeroom / Warehouse Location *</label>
                        <input className="input-field" value={newPO.storeroomLocation}
                          onChange={e => setNewPO(p => ({ ...p, storeroomLocation: e.target.value }))}
                          placeholder="e.g. Central Warehouse, Bay 4" />
                      </div>
                      <div>
                        <label className="input-label">Inventory Item Being Replenished</label>
                        <select className="input-field" value={newPO.storeroomItemId}
                          onChange={e => setNewPO(p => ({ ...p, storeroomItemId: e.target.value }))}>
                          <option value="">— Select item —</option>
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* CONFIRMING */}
                  {selectedType === 'CONFIRMING' && (
                    <div className="space-y-3">
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700 font-medium">
                        ⚠  This PO is for internal documentation only. It will NOT be sent to the vendor.
                        You must provide a reason and the date the original purchase occurred.
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="input-label">Original Purchase Date *</label>
                          <input type="date" className="input-field" value={newPO.confirmingOriginalDate}
                            onChange={e => setNewPO(p => ({ ...p, confirmingOriginalDate: e.target.value }))} />
                          <p className="text-xs text-gray-400 mt-1">Date the verbal/emergency purchase was made.</p>
                        </div>
                        <div className="col-span-2">
                          <label className="input-label">Reason for Confirming PO *</label>
                          <textarea className="input-field" rows={2} value={newPO.confirmingReason}
                            onChange={e => setNewPO(p => ({ ...p, confirmingReason: e.target.value }))}
                            placeholder="e.g. Emergency server replacement approved verbally by CTO on 14-May, pending formal PO documentation." />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PLANNED */}
                  {selectedType === 'PLANNED' && (
                    <div>
                      <label className="input-label">Planned Release Date *</label>
                      <input type="date" className="input-field w-56" value={newPO.plannedReleaseDate}
                        onChange={e => setNewPO(p => ({ ...p, plannedReleaseDate: e.target.value }))} />
                      <p className="text-xs text-gray-400 mt-1">Date this PO should be released to the vendor. It stays in DRAFT until then.</p>
                    </div>
                  )}

                  {/* EMERGENCY */}
                  {selectedType === 'EMERGENCY' && (
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
                        ⚡  Emergency POs bypass standard approval. Both fields below are mandatory
                        for audit compliance. A post-facto review is required within 5 business days.
                      </div>
                      <div>
                        <label className="input-label">Authorising Manager *</label>
                        <input className="input-field" value={newPO.emergencyAuthorisedBy}
                          onChange={e => setNewPO(p => ({ ...p, emergencyAuthorisedBy: e.target.value }))}
                          placeholder="Full name of manager who verbally authorised this purchase" />
                      </div>
                      <div>
                        <label className="input-label">Business Justification *</label>
                        <textarea className="input-field" rows={3} value={newPO.emergencyJustification}
                          onChange={e => setNewPO(p => ({ ...p, emergencyJustification: e.target.value }))}
                          placeholder="Describe why this purchase could not wait for standard approval. Include the business impact of delay." />
                      </div>
                    </div>
                  )}

                  {/* SERVICE */}
                  {selectedType === 'SERVICE' && (
                    <div>
                      <label className="input-label">Service Description *</label>
                      <textarea className="input-field" rows={2} value={newPO.serviceDescription}
                        onChange={e => setNewPO(p => ({ ...p, serviceDescription: e.target.value }))}
                        placeholder="e.g. Annual maintenance of HVAC systems across 3 building floors. Includes parts and labour." />
                      <p className="text-xs text-gray-400 mt-1">No goods receipt required — this PO is closed via service acceptance sign-off.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={!newPO.vendorId}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                  selectedType === 'CONFIRMING' ? 'bg-orange-500 hover:bg-orange-600' :
                  selectedType === 'EMERGENCY'  ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'}`}>
                <Plus className="w-4 h-4" /> Create {ORDER_TYPES[selectedType].label}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Type-specific metadata panel ──────────────────────────────────────────────

function OrderTypeMetadata({ po }: { po: PurchaseOrder }) {
  if (!po.orderType || po.orderType === 'STANDARD') return null;

  const rows: { label: string; value: string }[] = [];

  if (po.orderType === 'BLANKET') {
    if (po.blanketMaxAmount)     rows.push({ label: 'Max Blanket Amount', value: `$${po.blanketMaxAmount.toLocaleString()}` });
    if (po.blanketExpiryDate)    rows.push({ label: 'Expiry Date',        value: new Date(po.blanketExpiryDate).toLocaleDateString() });
    if (po.blanketReleasesCount !== undefined) rows.push({ label: 'Release Orders',  value: String(po.blanketReleasesCount) });
  }
  if (po.orderType === 'STOREROOM') {
    if (po.storeroomLocation)    rows.push({ label: 'Storeroom Location', value: po.storeroomLocation });
  }
  if (po.orderType === 'CONFIRMING') {
    if (po.confirmingOriginalDate) rows.push({ label: 'Original Purchase Date', value: new Date(po.confirmingOriginalDate).toLocaleDateString() });
    if (po.confirmingReason)     rows.push({ label: 'Reason', value: po.confirmingReason });
  }
  if (po.orderType === 'PLANNED') {
    if (po.plannedReleaseDate)   rows.push({ label: 'Planned Release Date', value: new Date(po.plannedReleaseDate).toLocaleDateString() });
  }
  if (po.orderType === 'EMERGENCY') {
    if (po.emergencyAuthorisedBy)   rows.push({ label: 'Authorised By',   value: po.emergencyAuthorisedBy });
    if (po.emergencyJustification)  rows.push({ label: 'Justification',   value: po.emergencyJustification });
  }
  if (po.orderType === 'SERVICE') {
    if (po.serviceDescription)      rows.push({ label: 'Service Scope',   value: po.serviceDescription });
    if (po.serviceAcceptanceDate)   rows.push({ label: 'Accepted Date',   value: new Date(po.serviceAcceptanceDate).toLocaleDateString() });
    if (po.serviceAcceptedBy)       rows.push({ label: 'Accepted By',     value: po.serviceAcceptedBy });
  }

  if (rows.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {rows.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-gray-400 font-medium">{label}</p>
          <p className="text-sm text-gray-700 mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  );
}
