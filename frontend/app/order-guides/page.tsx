'use client';

import { useEffect, useState } from 'react';
import { getOrderGuides, createOrderGuide, deleteOrderGuide, getOrderGuideItems, addOrderGuideItem, removeOrderGuideItem, getItems } from '@/lib/api';
import { OrderGuide, OrderGuideItem, Item } from '@/types';
import Modal from '@/components/Modal';
import { Plus, Trash2, ChevronDown, ChevronUp, BookOpen, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function OrderGuidesPage() {
  const { canAccess } = useAuth();
  const canCreate = canAccess('orderGuides', 'create');
  const canEdit   = canAccess('orderGuides', 'edit');
  const canDelete = canAccess('orderGuides', 'delete');
  const [guides, setGuides] = useState<OrderGuide[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [guideItems, setGuideItems] = useState<Record<number, OrderGuideItem[]>>({});
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddItem, setShowAddItem] = useState<number | null>(null);
  const [newGuide, setNewGuide] = useState({ name: '', description: '', isShared: false, createdBy: 'admin' });
  const [addItemForm, setAddItemForm] = useState({ itemId: '', defaultQty: 1, targetPrice: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([getOrderGuides(), getItems()])
      .then(([g, i]) => { setGuides(g); setAllItems(i); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleExpand = async (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!guideItems[id]) {
      const items = await getOrderGuideItems(id);
      setGuideItems(p => ({ ...p, [id]: items }));
    }
  };

  const handleCreate = async () => {
    await createOrderGuide(newGuide);
    setShowCreate(false);
    setNewGuide({ name: '', description: '', isShared: false, createdBy: 'admin' });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this order guide?')) return;
    await deleteOrderGuide(id); load();
  };

  const handleAddItem = async (guideId: number) => {
    await addOrderGuideItem(guideId, {
      itemId: parseInt(addItemForm.itemId),
      defaultQty: addItemForm.defaultQty,
      targetPrice: addItemForm.targetPrice ? parseFloat(addItemForm.targetPrice) : null,
    });
    const updated = await getOrderGuideItems(guideId);
    setGuideItems(p => ({ ...p, [guideId]: updated }));
    setShowAddItem(null);
    setAddItemForm({ itemId: '', defaultQty: 1, targetPrice: '' });
  };

  const handleRemoveItem = async (guideId: number, itemId: number) => {
    await removeOrderGuideItem(guideId, itemId);
    const updated = await getOrderGuideItems(guideId);
    setGuideItems(p => ({ ...p, [guideId]: updated }));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Guides</h1>
          <p className="text-gray-500 text-sm mt-0.5">Pre-configured item lists for recurring purchases</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create Order Guide</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {guides.map(guide => (
            <div key={guide.id} className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => guide.id && toggleExpand(guide.id)}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${guide.isShared ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    {guide.isShared ? <Users className="w-4 h-4 text-blue-600" /> : <BookOpen className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{guide.name}</p>
                    <p className="text-xs text-gray-500">{guide.description ?? ''} · By {guide.createdBy} {guide.isShared && <span className="text-blue-600 font-medium">· Shared</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canEdit && <button onClick={e => { e.stopPropagation(); guide.id && setShowAddItem(guide.id); }} className="text-blue-600 text-sm hover:underline">+ Add Item</button>}
                  {canDelete && <button onClick={e => { e.stopPropagation(); guide.id && handleDelete(guide.id); }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  {expanded === guide.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {expanded === guide.id && (
                <div className="border-t border-gray-100">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {['SKU','Item','Vendor','Unit Price','Default Qty','Target Price',''].map(h => <th key={h} className="table-header">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(guideItems[guide.id!] ?? []).map(ogi => (
                        <tr key={ogi.id} className="hover:bg-gray-50">
                          <td className="table-cell font-mono text-xs text-gray-500">{ogi.item.sku}</td>
                          <td className="table-cell font-medium">{ogi.item.name}</td>
                          <td className="table-cell text-gray-500">{ogi.item.vendor?.name ?? '—'}</td>
                          <td className="table-cell">₹{Number(ogi.item.unitPrice).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                          <td className="table-cell text-center">{ogi.defaultQty}</td>
                          <td className="table-cell">{ogi.targetPrice ? `₹${Number(ogi.targetPrice).toLocaleString('en-IN',{minimumFractionDigits:2})}` : '—'}</td>
                          <td className="table-cell">
                            <button onClick={() => guide.id && handleRemoveItem(guide.id, ogi.item.id!)} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                      {(guideItems[guide.id!] ?? []).length === 0 && (
                        <tr><td colSpan={7} className="text-center py-4 text-gray-400 text-sm">No items in this order guide yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {guides.length === 0 && <div className="text-center py-12 text-gray-400">No order guides yet. Create one to get started.</div>}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Order Guide" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className="input-field" value={newGuide.name} onChange={e => setNewGuide(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input-field" rows={2} value={newGuide.description} onChange={e => setNewGuide(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
              <input className="input-field" value={newGuide.createdBy} onChange={e => setNewGuide(p => ({ ...p, createdBy: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="shared" checked={newGuide.isShared} onChange={e => setNewGuide(p => ({ ...p, isShared: e.target.checked }))} />
              <label htmlFor="shared" className="text-sm text-gray-700">Shared with all users</label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn-primary">Create</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <Modal title="Add Item to Order Guide" onClose={() => setShowAddItem(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
              <select className="input-field" value={addItemForm.itemId} onChange={e => setAddItemForm(p => ({ ...p, itemId: e.target.value }))}>
                <option value="">— Select Item —</option>
                {allItems.map(i => <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Qty</label>
                <input className="input-field" type="number" min="1" value={addItemForm.defaultQty} onChange={e => setAddItemForm(p => ({ ...p, defaultQty: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Price (₹)</label>
                <input className="input-field" type="number" min="0" step="0.01" value={addItemForm.targetPrice} onChange={e => setAddItemForm(p => ({ ...p, targetPrice: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddItem(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleAddItem(showAddItem)} className="btn-primary">Add Item</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
