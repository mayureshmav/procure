'use client';

import { useEffect, useState } from 'react';
import { getUoms, createUom, updateUom, deleteUom, getCurrencies, createCurrency, updateCurrency, deleteCurrency } from '@/lib/api';
import { UomMaster, CurrencyMaster } from '@/types';
import Modal from '@/components/Modal';
import { Plus, Pencil, Trash2, Weight, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const UOM_TYPES = ['EACH','WEIGHT','VOLUME','LENGTH','AREA'] as const;

export default function SettingsPage() {
  const { canAccess } = useAuth();
  const canEdit = canAccess('settings', 'edit');
  const [tab, setTab]         = useState<'uom' | 'currency'>('uom');
  const [uoms, setUoms]       = useState<UomMaster[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyMaster[]>([]);
  const [loading, setLoading] = useState(true);

  // UOM modal
  const [showUomModal, setShowUomModal] = useState(false);
  const [uomEditing, setUomEditing]     = useState<Partial<UomMaster>>({});
  const [isUomEdit, setIsUomEdit]       = useState(false);

  // Currency modal
  const [showCurrModal, setShowCurrModal] = useState(false);
  const [currEditing, setCurrEditing]     = useState<Partial<CurrencyMaster>>({});
  const [isCurrEdit, setIsCurrEdit]       = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getUoms().catch(() => []), getCurrencies().catch(() => [])])
      .then(([u, c]) => { setUoms(u || []); setCurrencies(c || []); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // UOM handlers
  const openCreateUom = () => { setUomEditing({ uomType: 'EACH', catchWeightEligible: false }); setIsUomEdit(false); setShowUomModal(true); };
  const openEditUom   = (u: UomMaster) => { setUomEditing({ ...u }); setIsUomEdit(true); setShowUomModal(true); };
  const saveUom = async () => {
    if (isUomEdit && uomEditing.id) await updateUom(uomEditing.id, uomEditing);
    else await createUom(uomEditing);
    setShowUomModal(false);
    load();
  };
  const removeUom = async (id: number) => {
    if (!confirm('Delete this UOM?')) return;
    await deleteUom(id);
    load();
  };

  // Currency handlers
  const openCreateCurr = () => { setCurrEditing({ decimalPlaces: 2, active: true }); setIsCurrEdit(false); setShowCurrModal(true); };
  const openEditCurr   = (c: CurrencyMaster) => { setCurrEditing({ ...c }); setIsCurrEdit(true); setShowCurrModal(true); };
  const saveCurr = async () => {
    if (isCurrEdit && currEditing.id) await updateCurrency(currEditing.id, currEditing);
    else await createCurrency(currEditing);
    setShowCurrModal(false);
    load();
  };
  const removeCurr = async (id: number) => {
    if (!confirm('Delete this currency?')) return;
    await deleteCurrency(id);
    load();
  };

  const UOM_TYPE_COLORS: Record<string, string> = {
    EACH: 'bg-blue-50 text-blue-700', WEIGHT: 'bg-green-50 text-green-700',
    VOLUME: 'bg-cyan-50 text-cyan-700', LENGTH: 'bg-purple-50 text-purple-700',
    AREA: 'bg-orange-50 text-orange-700',
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage UOM master and currency master data</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {(['uom','currency'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'uom' ? <Weight className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
            {t === 'uom' ? 'Units of Measure' : 'Currencies'}
          </button>
        ))}
      </div>

      {/* UOM Tab */}
      {tab === 'uom' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{uoms.length} UOM codes</p>
            {canEdit && (<button onClick={openCreateUom} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add UOM</button>)}
          </div>
          <div className="card">
            {loading ? <div className="p-10 text-center text-gray-400">Loading…</div> : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Code','Description','Type','Catch Weight Eligible','Actions'].map(h =>
                    <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {uoms.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono font-bold text-gray-900">{u.code}</td>
                      <td className="table-cell text-gray-700">{u.description}</td>
                      <td className="table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${UOM_TYPE_COLORS[u.uomType] ?? 'bg-gray-100 text-gray-600'}`}>
                          {u.uomType}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded ${u.catchWeightEligible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.catchWeightEligible ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {canEdit && <button onClick={() => openEditUom(u)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>}
                          {canEdit && <button onClick={() => u.id && removeUom(u.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {uoms.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No UOM codes found.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Currency Tab */}
      {tab === 'currency' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{currencies.length} currencies</p>
            {canEdit && <button onClick={openCreateCurr} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Currency</button>}
          </div>
          <div className="card">
            {loading ? <div className="p-10 text-center text-gray-400">Loading…</div> : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Code','Name','Symbol','Decimal Places','Status','Actions'].map(h =>
                    <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currencies.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono font-bold text-gray-900">{c.code}</td>
                      <td className="table-cell text-gray-700">{c.name}</td>
                      <td className="table-cell text-lg">{c.symbol}</td>
                      <td className="table-cell text-center">{c.decimalPlaces}</td>
                      <td className="table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {canEdit && <button onClick={() => openEditCurr(c)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>}
                          {canEdit && <button onClick={() => c.id && removeCurr(c.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currencies.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No currencies found.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* UOM Modal */}
      {showUomModal && (
        <Modal title={isUomEdit ? 'Edit UOM' : 'Add UOM'} onClose={() => setShowUomModal(false)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input className="input-field uppercase" maxLength={20} value={uomEditing.code ?? ''}
                onChange={e => setUomEditing(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="input-field" value={uomEditing.uomType ?? 'EACH'}
                onChange={e => setUomEditing(p => ({ ...p, uomType: e.target.value as any }))}>
                {UOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <input className="input-field" value={uomEditing.description ?? ''}
                onChange={e => setUomEditing(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="col-span-2 flex items-center gap-2 pt-1">
              <input type="checkbox" id="cw" checked={uomEditing.catchWeightEligible ?? false}
                onChange={e => setUomEditing(p => ({ ...p, catchWeightEligible: e.target.checked }))} />
              <label htmlFor="cw" className="text-sm text-gray-700">Eligible for Catch Weight pricing</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            <button onClick={() => setShowUomModal(false)} className="btn-secondary">Cancel</button>
{canEdit && <button onClick={saveUom} className="btn-primary">{isUomEdit ? 'Update' : 'Create'}</button>}
          </div>
        </Modal>
      )}

      {/* Currency Modal */}
      {showCurrModal && (
        <Modal title={isCurrEdit ? 'Edit Currency' : 'Add Currency'} onClose={() => setShowCurrModal(false)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISO Code * (e.g. USD)</label>
              <input className="input-field uppercase" maxLength={10} value={currEditing.code ?? ''}
                onChange={e => setCurrEditing(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
              <input className="input-field" maxLength={10} value={currEditing.symbol ?? ''}
                onChange={e => setCurrEditing(p => ({ ...p, symbol: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className="input-field" value={currEditing.name ?? ''}
                onChange={e => setCurrEditing(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decimal Places</label>
              <input className="input-field" type="number" min="0" max="4" value={currEditing.decimalPlaces ?? 2}
                onChange={e => setCurrEditing(p => ({ ...p, decimalPlaces: parseInt(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="cactive" checked={currEditing.active ?? true}
                onChange={e => setCurrEditing(p => ({ ...p, active: e.target.checked }))} />
              <label htmlFor="cactive" className="text-sm text-gray-700">Active</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            <button onClick={() => setShowCurrModal(false)} className="btn-secondary">Cancel</button>
{canEdit && <button onClick={saveCurr} className="btn-primary">{isCurrEdit ? 'Update' : 'Create'}</button>}
          </div>
        </Modal>
      )}
    </div>
  );
}
