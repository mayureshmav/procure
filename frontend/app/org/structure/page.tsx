'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getOrgUnits, getCompanies, getPersons,
  createOrgUnit, updateOrgUnit, deleteOrgUnit,
} from '@/lib/api';
import { OrgUnit, OrgUnitType, Company, Person } from '@/types';
import Modal from '@/components/Modal';
import {
  Plus, Pencil, Trash2, Network, ChevronRight, ChevronDown,
  Loader2, CheckCircle, Building2, Users, Layers,
} from 'lucide-react';

const UNIT_TYPES: OrgUnitType[] = ['DIVISION','LEGAL_ENTITY','BU','OU','DEPARTMENT','SUB_DEPARTMENT'];

const UNIT_TYPE_COLORS: Record<OrgUnitType, string> = {
  DIVISION:       'bg-purple-100 text-purple-700',
  LEGAL_ENTITY:   'bg-blue-100 text-blue-700',
  BU:             'bg-indigo-100 text-indigo-700',
  OU:             'bg-cyan-100 text-cyan-700',
  DEPARTMENT:     'bg-teal-100 text-teal-700',
  SUB_DEPARTMENT: 'bg-green-100 text-green-700',
};

// ── Tree renderer ─────────────────────────────────────────────────────────────

interface TreeNodeProps {
  unit: OrgUnit;
  all: OrgUnit[];
  depth: number;
  onEdit: (u: OrgUnit) => void;
  onDelete: (u: OrgUnit) => void;
  onAddChild: (parentId: number) => void;
}

function TreeNode({ unit, all, depth, onEdit, onDelete, onAddChild }: TreeNodeProps) {
  const [open, setOpen] = useState(depth < 2);
  const children = all.filter(u => u.parent?.orgUnitId === unit.orgUnitId);

  return (
    <div>
      <div className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}>
        {/* Expand / leaf */}
        {children.length > 0 ? (
          <button onClick={() => setOpen(o => !o)} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <Network className="w-4 h-4 text-gray-400 flex-shrink-0" />

        <span className="flex-1 text-sm font-medium text-gray-800">{unit.unitName}</span>

        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${UNIT_TYPE_COLORS[unit.unitType]}`}>
          {unit.unitType.replace(/_/g, ' ')}
        </span>

        {unit.costCenter && (
          <span className="text-xs text-gray-400 font-mono">{unit.costCenter}</span>
        )}

        {unit.manager && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {unit.manager.firstName} {unit.manager.lastName}
          </span>
        )}

        {/* Actions — visible on hover */}
        <div className="hidden group-hover:flex items-center gap-1 ml-2">
          <button onClick={() => onAddChild(unit.orgUnitId)}
            title="Add child unit"
            className="p-1 rounded hover:bg-blue-50 text-blue-500">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onEdit(unit)}
            className="p-1 rounded hover:bg-blue-50 text-blue-600">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {children.length === 0 && (
            <button onClick={() => onDelete(unit)}
              className="p-1 rounded hover:bg-red-50 text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {open && children.sort((a, b) => a.sortOrder - b.sortOrder).map(child => (
        <TreeNode key={child.orgUnitId} unit={child} all={all}
          depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrgStructurePage() {
  const [units, setUnits]         = useState<OrgUnit[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [persons, setPersons]     = useState<Person[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterCompany, setFilterCompany] = useState<number | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<OrgUnit | null>(null);
  const [saving, setSaving]       = useState(false);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);

  const [form, setForm] = useState({
    unitCode: '', unitName: '', unitType: 'DEPARTMENT' as OrgUnitType,
    companyId: '', parentId: '', managerId: '', costCenter: '', description: '', sortOrder: '0',
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getOrgUnits({ companyId: filterCompany || undefined }),
      getCompanies(),
    ]).then(([units, comps]) => {
      setUnits(Array.isArray(units) ? units : []);
      const compList = (comps as any).content ?? (Array.isArray(comps) ? comps : []);
      setCompanies(compList);
    }).finally(() => setLoading(false));
  }, [filterCompany]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (filterCompany)
      getPersons({ companyId: filterCompany, size: 200 })
        .then(p => setPersons((p as any).content ?? (Array.isArray(p) ? p : [])))
        .catch(() => {});
  }, [filterCompany]);

  const openCreate = (parentId?: number) => {
    setEditing(null);
    setDefaultParentId(parentId ?? null);
    setForm({
      unitCode: '', unitName: '', unitType: 'DEPARTMENT',
      companyId: String(filterCompany || companies[0]?.companyId || ''),
      parentId: parentId ? String(parentId) : '',
      managerId: '', costCenter: '', description: '', sortOrder: '0',
    });
    setModalOpen(true);
  };

  const openEdit = (u: OrgUnit) => {
    setEditing(u);
    setDefaultParentId(null);
    setForm({
      unitCode:    u.unitCode,
      unitName:    u.unitName,
      unitType:    u.unitType,
      companyId:   String(u.company?.companyId ?? filterCompany ?? ''),
      parentId:    String(u.parent?.orgUnitId ?? ''),
      managerId:   String(u.manager?.personId ?? ''),
      costCenter:  u.costCenter ?? '',
      description: u.description ?? '',
      sortOrder:   String(u.sortOrder),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        companyId:  Number(form.companyId) || undefined,
        parentId:   Number(form.parentId)  || undefined,
        managerId:  Number(form.managerId) || undefined,
        sortOrder:  Number(form.sortOrder),
      };
      editing ? await updateOrgUnit(editing.orgUnitId, payload) : await createOrgUnit(payload);
      setModalOpen(false);
      load();
    } catch (err: any) {
      alert(err?.response?.data ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: OrgUnit) => {
    if (!confirm(`Delete "${u.unitName}"?`)) return;
    await deleteOrgUnit(u.orgUnitId);
    load();
  };

  const roots = units.filter(u => !u.parent);

  // Stats
  const stats = UNIT_TYPES.map(t => ({ type: t, count: units.filter(u => u.unitType === t).length })).filter(s => s.count > 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> Organizational Structure
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define divisions, legal entities, business units, departments and more
          </p>
        </div>
        <div className="flex gap-2">
          <select value={filterCompany} onChange={e => setFilterCompany(e.target.value ? Number(e.target.value) : '')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.companyName}</option>)}
          </select>
          <button onClick={() => openCreate()} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Unit
          </button>
        </div>
      </div>

      {/* Stats chips */}
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {stats.map(({ type, count }) => (
            <span key={type} className={`text-xs px-3 py-1 rounded-full font-medium ${UNIT_TYPE_COLORS[type]}`}>
              {type.replace(/_/g, ' ')}: {count}
            </span>
          ))}
          <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
            Total: {units.length}
          </span>
        </div>
      )}

      {/* Tree */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No org units found.</p>
          <button onClick={() => openCreate()} className="mt-3 text-sm text-blue-600 hover:underline">
            Add the first unit
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          {roots.sort((a, b) => a.sortOrder - b.sortOrder).map(root => (
            <TreeNode key={root.orgUnitId} unit={root} all={units}
              depth={0} onEdit={openEdit} onDelete={handleDelete}
              onAddChild={id => openCreate(id)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <Modal title={editing ? `Edit: ${editing.unitName}` : 'Add Org Unit'} onClose={() => setModalOpen(false)}>
          <div className="w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              {editing ? `Edit: ${editing.unitName}` : 'Add Org Unit'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-xs text-gray-500 mb-1">Unit Code *</label>
                <input value={form.unitCode} onChange={e => setForm(f => ({ ...f, unitCode: e.target.value }))}
                  placeholder="e.g. DEPT-FIN"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Unit Name *</label>
                <input value={form.unitName} onChange={e => setForm(f => ({ ...f, unitName: e.target.value }))}
                  placeholder="e.g. Finance Department"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unit Type *</label>
                <select value={form.unitType} onChange={e => setForm(f => ({ ...f, unitType: e.target.value as OrgUnitType }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {UNIT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cost Center</label>
                <input value={form.costCenter} onChange={e => setForm(f => ({ ...f, costCenter: e.target.value }))}
                  placeholder="e.g. CC-1001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Parent Unit</label>
                <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Root (no parent)</option>
                  {units.filter(u => u.orgUnitId !== editing?.orgUnitId).map(u => (
                    <option key={u.orgUnitId} value={u.orgUnitId}>{u.unitName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Manager</label>
                <select value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No manager</option>
                  {persons.map(p => (
                    <option key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Optional description…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave}
                disabled={saving || !form.unitName || !form.companyId || !form.unitCode}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editing ? 'Save Changes' : 'Create Unit'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
