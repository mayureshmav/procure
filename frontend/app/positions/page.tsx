'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPositions, getCompanies, createPosition, updatePosition, deletePosition } from '@/lib/api';
import { Position, Company, AccessMatrix, ModulePermission } from '@/types';
import Modal from '@/components/Modal';
import {
  Plus, Pencil, Trash2, Shield, ChevronDown, ChevronUp,
  CheckCircle, Loader2, Lock, Unlock,
} from 'lucide-react';

// ── Access Matrix Definition ──────────────────────────────────────────────────

type PermKey = keyof ModulePermission;

interface ModuleDef {
  key: keyof AccessMatrix;
  label: string;
  group: string;
  permissions: PermKey[];
}

const MODULE_DEFS: ModuleDef[] = [
  // ── Core Procurement ──────────────────────────────────────────────────────
  { key: 'dashboard',      label: 'Dashboard',        group: 'Procurement', permissions: ['view'] },
  { key: 'vendors',        label: 'Vendors',           group: 'Procurement', permissions: ['view','create','edit','delete'] },
  { key: 'catalog',        label: 'Item Catalog',      group: 'Procurement', permissions: ['view','create','edit','delete','import'] },
  { key: 'orderGuides',    label: 'Order Guides',      group: 'Procurement', permissions: ['view','create','edit','delete'] },
  { key: 'requisitions',   label: 'Requisitions',      group: 'Procurement', permissions: ['view','create','edit','delete','approve'] },
  { key: 'purchaseOrders', label: 'Purchase Orders',   group: 'Procurement', permissions: ['view','create','edit','delete','approve'] },
  { key: 'inventory',      label: 'Inventory',         group: 'Procurement', permissions: ['view','adjust'] },
  { key: 'integration',    label: 'Vendor Integration',group: 'Procurement', permissions: ['view','manage'] },
  { key: 'logs',           label: 'Import Logs',       group: 'Procurement', permissions: ['view'] },
  { key: 'settings',       label: 'Settings',          group: 'Procurement', permissions: ['view','edit'] },
  // ── Organization Management ───────────────────────────────────────────────
  { key: 'orgStructure',   label: 'Org Structure',     group: 'Organization', permissions: ['view','edit','delete'] },
  { key: 'orgDocuments',   label: 'Org Documents & Policies', group: 'Organization', permissions: ['view','upload','approve','delete'] },
  { key: 'orgAnalytics',   label: 'Org Analytics',     group: 'Organization', permissions: ['view'] },
  // ── People Management ─────────────────────────────────────────────────────
  { key: 'persons',        label: 'Persons',           group: 'People', permissions: ['view','create','edit','delete'] },
  { key: 'positions',      label: 'Positions',         group: 'People', permissions: ['view','create','edit','delete'] },
];

const GROUPS = ['Procurement', 'Organization', 'People'];

const PERM_LABEL: Record<PermKey, string> = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete',
  approve: 'Approve', import: 'Import', adjust: 'Adjust', manage: 'Manage', upload: 'Upload',
};

const DEFAULT_MATRIX: AccessMatrix = Object.fromEntries(
  MODULE_DEFS.map(m => [m.key, Object.fromEntries(m.permissions.map(p => [p, false]))])
) as AccessMatrix;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMatrix(json: string): AccessMatrix {
  try { return { ...DEFAULT_MATRIX, ...JSON.parse(json) }; }
  catch { return { ...DEFAULT_MATRIX }; }
}

function matrixPerm(matrix: AccessMatrix, moduleKey: keyof AccessMatrix, perm: PermKey): boolean {
  return !!(matrix[moduleKey] as any)?.[perm];
}

function setMatrixPerm(matrix: AccessMatrix, moduleKey: keyof AccessMatrix, perm: PermKey, val: boolean): AccessMatrix {
  return {
    ...matrix,
    [moduleKey]: { ...(matrix[moduleKey] as object ?? {}), [perm]: val },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterCompany, setFilterCompany] = useState<number | ''>('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Position | null>(null);
  const [saving, setSaving]       = useState(false);

  // Form state
  const [form, setForm] = useState({
    positionCode: '', positionName: '', description: '', companyId: '',
  });
  const [matrix, setMatrix] = useState<AccessMatrix>({ ...DEFAULT_MATRIX });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.map(g => [g, true]))
  );

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getPositions(filterCompany || undefined),
      getCompanies(),
    ]).then(([pos, comps]) => {
      setPositions(Array.isArray(pos) ? pos : []);
      setCompanies(Array.isArray(comps) ? comps : (comps as any).content ?? []);
    }).finally(() => setLoading(false));
  }, [filterCompany]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ positionCode: '', positionName: '', description: '', companyId: String(companies[0]?.companyId ?? '') });
    setMatrix({ ...DEFAULT_MATRIX });
    setModalOpen(true);
  };

  const openEdit = (pos: Position) => {
    setEditing(pos);
    setForm({
      positionCode: pos.positionCode,
      positionName: pos.positionName,
      description:  pos.description ?? '',
      companyId:    String(pos.company?.companyId ?? ''),
    });
    setMatrix(parseMatrix(pos.accessMatrix));
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        companyId:    Number(form.companyId),
        accessMatrix: JSON.stringify(matrix),
      };
      if (editing) {
        await updatePosition(editing.positionId, payload);
      } else {
        await createPosition(payload);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      alert(err?.response?.data ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pos: Position) => {
    if (pos.isSystemRole) { alert('System roles cannot be deleted.'); return; }
    if (!confirm(`Delete position "${pos.positionName}"?`)) return;
    await deletePosition(pos.positionId);
    load();
  };

  const toggleGroup = (g: string) =>
    setExpandedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const setAllInGroup = (group: string, val: boolean) => {
    let m = { ...matrix };
    MODULE_DEFS.filter(d => d.group === group).forEach(d => {
      d.permissions.forEach(p => { m = setMatrixPerm(m, d.key, p, val); });
    });
    setMatrix(m);
  };

  const grouped = GROUPS.map(g => ({
    group: g,
    modules: MODULE_DEFS.filter(m => m.group === g),
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" /> Position Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define roles and their access matrix across all modules
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Position
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select value={filterCompany} onChange={e => setFilterCompany(e.target.value ? Number(e.target.value) : '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.companyName}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Position</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {positions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No positions found</td></tr>
              ) : positions.map(pos => (
                <tr key={pos.positionId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{pos.positionName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{pos.positionCode}</td>
                  <td className="px-4 py-3 text-gray-600">{pos.company?.companyName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{pos.description ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {pos.isSystemRole
                      ? <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" /> System</span>
                      : <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"><Unlock className="w-3 h-3" /> Custom</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pos.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {pos.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(pos)} title="Edit"
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!pos.isSystemRole && (
                        <button onClick={() => handleDelete(pos)} title="Delete"
                          className="p-1.5 rounded hover:bg-red-50 text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <Modal title={editing ? `Edit Position: ${editing.positionName}` : 'Create Position'} onClose={() => setModalOpen(false)}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {editing ? `Edit Position: ${editing.positionName}` : 'Create Position'}
            </h2>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company *</label>
                <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!editing}>
                  <option value="">Select company…</option>
                  {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Position Code *</label>
                <input value={form.positionCode} onChange={e => setForm(f => ({ ...f, positionCode: e.target.value }))}
                  placeholder="e.g. BUYER_L1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!editing} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Position Name *</label>
                <input value={form.positionName} onChange={e => setForm(f => ({ ...f, positionName: e.target.value }))}
                  placeholder="e.g. Senior Buyer"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Access Matrix */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Access Matrix</span>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => { let m = { ...DEFAULT_MATRIX }; MODULE_DEFS.forEach(d => d.permissions.forEach(p => { m = setMatrixPerm(m, d.key, p, true); })); setMatrix(m); }}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Grant All</button>
                  <button onClick={() => setMatrix({ ...DEFAULT_MATRIX })}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Revoke All</button>
                </div>
              </div>

              {grouped.map(({ group, modules }) => (
                <div key={group}>
                  {/* Group Header */}
                  <button onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      {expandedGroups[group] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {group}
                    </div>
                    <div className="flex gap-2 text-xs font-normal normal-case" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setAllInGroup(group, true)}
                        className="px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">All</button>
                      <button onClick={() => setAllInGroup(group, false)}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">None</button>
                    </div>
                  </button>

                  {expandedGroups[group] && (
                    <table className="w-full text-xs border-b border-gray-200">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-2 text-left w-48">Module</th>
                          {['view','create','edit','delete','approve','import','adjust','manage','upload'].map(p => (
                            <th key={p} className="px-2 py-2 text-center capitalize w-16">{p}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {modules.map(mod => (
                          <tr key={mod.key} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-700">{mod.label}</td>
                            {(['view','create','edit','delete','approve','import','adjust','manage','upload'] as PermKey[]).map(p => (
                              <td key={p} className="px-2 py-2 text-center">
                                {mod.permissions.includes(p) ? (
                                  <input type="checkbox"
                                    checked={matrixPerm(matrix, mod.key, p)}
                                    onChange={e => setMatrix(prev => setMatrixPerm(prev, mod.key, p, e.target.checked))}
                                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                  />
                                ) : (
                                  <span className="text-gray-200">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.positionName || !form.companyId}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editing ? 'Save Changes' : 'Create Position'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
