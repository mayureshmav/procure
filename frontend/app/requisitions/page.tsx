'use client';

import { useEffect, useState } from 'react';
import { getRequisitions, createRequisition, getRequisition, addRequisitionLine, submitRequisition, approveRequisition, rejectRequisition, getItems, getVendors } from '@/lib/api';
import { Requisition, RequisitionLine, Item, Vendor } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { Plus, ChevronRight, ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RequisitionsPage() {
  const { canAccess } = useAuth();
  const canCreate  = canAccess('requisitions', 'create');
  const canEdit    = canAccess('requisitions', 'edit');
  const canApprove = canAccess('requisitions', 'approve');
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [selected, setSelected] = useState<Requisition | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const [newReq, setNewReq] = useState({ title: '', requestedBy: '', department: '', notes: '' });
  const [lineForm, setLineForm] = useState({ itemId: '', vendorId: '', description: '', quantity: 1, unitPrice: 0, uom: 'EA', glAccount: '' });

  const load = () => {
    setLoading(true);
    Promise.all([getRequisitions(), getItems(), getVendors()])
      .then(([r, i, v]) => { setReqs(r); setItems(i); setVendors(v); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openDetail = async (id: number) => {
    const r = await getRequisition(id);
    setSelected(r);
  };

  const handleCreate = async () => {
    await createRequisition(newReq);
    setShowCreate(false);
    setNewReq({ title: '', requestedBy: '', department: '', notes: '' });
    load();
  };

  const handleAddLine = async () => {
    if (!selected?.id) return;
    const item = items.find(i => i.id === parseInt(lineForm.itemId));
    const vendor = vendors.find(v => v.id === parseInt(lineForm.vendorId));
    await addRequisitionLine(selected.id, {
      item: item ? { id: item.id } : undefined,
      vendor: vendor ? { id: vendor.id } : undefined,
      description: lineForm.description || item?.name || '',
      quantity: lineForm.quantity,
      unitPrice: lineForm.unitPrice,
      uom: lineForm.uom,
      glAccount: lineForm.glAccount,
    });
    setShowAddLine(false);
    setLineForm({ itemId: '', vendorId: '', description: '', quantity: 1, unitPrice: 0, uom: 'EA', glAccount: '' });
    const updated = await getRequisition(selected.id);
    setSelected(updated);
  };

  const handleSubmit = async () => {
    if (!selected?.id) return;
    const updated = await submitRequisition(selected.id);
    setSelected(updated);
    load();
  };

  const handleApprove = async () => {
    if (!selected?.id) return;
    const updated = await approveRequisition(selected.id, { approvedBy: 'Manager' });
    setSelected(updated);
    load();
  };

  const handleReject = async () => {
    const reason = prompt('Rejection reason:');
    if (!selected?.id) return;
    const updated = await rejectRequisition(selected.id, { notes: reason });
    setSelected(updated);
    load();
  };

  // Auto-fill price when item selected
  const onItemSelect = (itemId: string) => {
    const item = items.find(i => i.id === parseInt(itemId));
    setLineForm(p => ({
      ...p,
      itemId,
      description: item?.name ?? p.description,
      unitPrice: item?.unitPrice ?? p.unitPrice,
      uom: item?.uom ?? p.uom,
      vendorId: item?.vendor?.id?.toString() ?? p.vendorId,
    }));
  };

  const filtered = filter === 'ALL' ? reqs : reqs.filter(r => r.status === filter);
  const fmt = (n?: number) => n != null ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
  const statuses = ['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED'];

  // Detail view
  if (selected) {
    return (
      <div className="p-8">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Requisitions
        </button>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selected.reqNumber}</h1>
            <p className="text-gray-600 mt-1">{selected.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>By {selected.requestedBy ?? '—'}</span>
              <span>·</span>
              <span>Dept: {selected.department ?? '—'}</span>
              <span>·</span>
              <StatusBadge status={selected.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{fmt(selected.totalAmount)}</p>
            <p className="text-xs text-gray-500 mt-1">Total Amount</p>
          </div>
        </div>

        {/* Action buttons — gated by position */}
        <div className="flex gap-3 mb-6">
          {selected.status === 'DRAFT' && (
            <>
              {canEdit && <button onClick={() => setShowAddLine(true)} className="btn-secondary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Line</button>}
              {canEdit && <button onClick={handleSubmit} className="btn-primary">Submit for Approval</button>}
            </>
          )}
          {selected.status === 'SUBMITTED' && (
            <>
              {canApprove && <button onClick={handleApprove} className="btn-primary flex items-center gap-2"><Check className="w-4 h-4" /> Approve</button>}
              {canApprove && <button onClick={handleReject} className="btn-danger flex items-center gap-2"><X className="w-4 h-4" /> Reject</button>}
              {!canApprove && <span className="text-sm text-gray-400 italic self-center">Pending approval by an authorized user</span>}
            </>
          )}
        </div>

        {/* Lines */}
        <div className="card">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Line Items</div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#','Description','Vendor','Qty','UOM','Unit Price','Total','GL Account'].map(h => <th key={h} className="table-header">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(selected.lines ?? []).map((line, idx) => (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="table-cell text-gray-400">{idx + 1}</td>
                  <td className="table-cell font-medium">{line.description}</td>
                  <td className="table-cell text-gray-500">{line.vendor?.name ?? '—'}</td>
                  <td className="table-cell text-center">{line.quantity}</td>
                  <td className="table-cell">{line.uom ?? '—'}</td>
                  <td className="table-cell">{fmt(line.unitPrice)}</td>
                  <td className="table-cell font-semibold">{fmt(line.totalPrice)}</td>
                  <td className="table-cell text-gray-400 text-xs">{line.glAccount ?? '—'}</td>
                </tr>
              ))}
              {(selected.lines ?? []).length === 0 && (
                <tr><td colSpan={8} className="text-center py-6 text-gray-400">No line items yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showAddLine && (
          <Modal title="Add Line Item" onClose={() => setShowAddLine(false)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item from Catalog</label>
                <select className="input-field" value={lineForm.itemId} onChange={e => onItemSelect(e.target.value)}>
                  <option value="">— Select or type below —</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input className="input-field" value={lineForm.description} onChange={e => setLineForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select className="input-field" value={lineForm.vendorId} onChange={e => setLineForm(p => ({ ...p, vendorId: e.target.value }))}>
                  <option value="">— Select Vendor —</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty *</label>
                  <input className="input-field" type="number" min="1" value={lineForm.quantity} onChange={e => setLineForm(p => ({ ...p, quantity: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UOM</label>
                  <select className="input-field" value={lineForm.uom} onChange={e => setLineForm(p => ({ ...p, uom: e.target.value }))}>
                    {['EA','CS','KG','LB','LT','DZ','BOX','BAG','BTL','TIN','CAN','RM'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                  <input className="input-field" type="number" min="0" step="0.01" value={lineForm.unitPrice} onChange={e => setLineForm(p => ({ ...p, unitPrice: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GL Account</label>
                <input className="input-field" value={lineForm.glAccount} placeholder="e.g. 6100-001" onChange={e => setLineForm(p => ({ ...p, glAccount: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddLine(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleAddLine} className="btn-primary">Add Line</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{reqs.length} total requisitions</p>
        </div>
        {canCreate && <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Requisition</button>}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['REQ Number','Title','Requested By','Department','Status','Total','Created',''].map(h => <th key={h} className="table-header">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => req.id && openDetail(req.id)}>
                  <td className="table-cell font-mono font-semibold text-blue-600">{req.reqNumber}</td>
                  <td className="table-cell font-medium">{req.title}</td>
                  <td className="table-cell text-gray-600">{req.requestedBy ?? '—'}</td>
                  <td className="table-cell text-gray-600">{req.department ?? '—'}</td>
                  <td className="table-cell"><StatusBadge status={req.status} /></td>
                  <td className="table-cell font-semibold">{fmt(req.totalAmount)}</td>
                  <td className="table-cell text-gray-400 text-xs">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="table-cell"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No requisitions found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <Modal title="New Requisition" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input className="input-field" value={newReq.title} onChange={e => setNewReq(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Kitchen Supplies — Week 21" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
                <input className="input-field" value={newReq.requestedBy} onChange={e => setNewReq(p => ({ ...p, requestedBy: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input className="input-field" value={newReq.department} onChange={e => setNewReq(p => ({ ...p, department: e.target.value }))} placeholder="e.g. F&B, Housekeeping" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="input-field" rows={2} value={newReq.notes} onChange={e => setNewReq(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn-primary">Create Requisition</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
