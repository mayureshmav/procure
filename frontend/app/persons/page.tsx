'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getPersons, getCompanies, getPositions, getOrgUnits,
  createPerson, updatePerson, deletePerson,
} from '@/lib/api';
import { Person, Company, Position, OrgUnit } from '@/types';
import Modal from '@/components/Modal';
import {
  Plus, Pencil, Trash2, Users, Search, Loader2,
  CheckCircle, UserCircle2, Shield, Building2,
} from 'lucide-react';

export default function PersonsPage() {
  const [persons, setPersons]     = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orgUnits, setOrgUnits]   = useState<OrgUnit[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterCompany, setFilterCompany] = useState<number | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Person | null>(null);
  const [saving, setSaving]       = useState(false);

  const [form, setForm] = useState({
    employeeCode: '', firstName: '', lastName: '', email: '',
    phone: '', companyId: '', positionId: '', orgUnitId: '',
    managerId: '', hireDate: '', status: 'ACTIVE',
  });

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      getPersons({ companyId: filterCompany || undefined, search: search || undefined }),
      getCompanies(),
    ]).then(([ppl, comps]) => {
      const personList = (ppl as any).content ?? (Array.isArray(ppl) ? ppl : []);
      setPersons(personList);
      const compList = (comps as any).content ?? (Array.isArray(comps) ? comps : []);
      setCompanies(compList);
    }).finally(() => setLoading(false));
  }, [filterCompany, search]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Load positions + org units when company filter changes
  useEffect(() => {
    if (filterCompany) {
      getPositions(filterCompany).then(p => setPositions(Array.isArray(p) ? p : [])).catch(() => {});
      getOrgUnits({ companyId: filterCompany }).then(u => setOrgUnits(Array.isArray(u) ? u : [])).catch(() => {});
    }
  }, [filterCompany]);

  const openCreate = () => {
    setEditing(null);
    setForm({ employeeCode: '', firstName: '', lastName: '', email: '',
      phone: '', companyId: String(filterCompany || companies[0]?.companyId || ''),
      positionId: '', orgUnitId: '', managerId: '', hireDate: '', status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEdit = (p: Person) => {
    setEditing(p);
    setForm({
      employeeCode: p.employeeCode,
      firstName:    p.firstName,
      lastName:     p.lastName,
      email:        p.email,
      phone:        p.phone ?? '',
      companyId:    String(p.company?.companyId ?? ''),
      positionId:   String(p.position?.positionId ?? ''),
      orgUnitId:    String(p.orgUnit?.orgUnitId ?? ''),
      managerId:    String(p.manager?.personId ?? ''),
      hireDate:     p.hireDate ?? '',
      status:       p.status,
    });
    // Load positions/org-units for their company
    if (p.company?.companyId) {
      getPositions(p.company.companyId).then(x => setPositions(Array.isArray(x) ? x : [])).catch(() => {});
      getOrgUnits({ companyId: p.company.companyId }).then(x => setOrgUnits(Array.isArray(x) ? x : [])).catch(() => {});
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        companyId:  Number(form.companyId) || undefined,
        positionId: Number(form.positionId) || undefined,
        orgUnitId:  Number(form.orgUnitId)  || undefined,
        managerId:  Number(form.managerId)  || undefined,
        hireDate:   form.hireDate || undefined,
      };
      editing ? await updatePerson(editing.personId, payload) : await createPerson(payload);
      setModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Person) => {
    if (!confirm(`Delete person "${p.firstName} ${p.lastName}"?`)) return;
    await deletePerson(p.personId);
    loadAll();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Person Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage people, their positions, and org unit assignments</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadAll()}
            placeholder="Search name, email…"
            className="pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
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
                <th className="px-4 py-3 text-left">Person</th>
                <th className="px-4 py-3 text-left">Employee Code</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Position</th>
                <th className="px-4 py-3 text-left">Org Unit</th>
                <th className="px-4 py-3 text-left">Manager</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {persons.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No persons found</td></tr>
              ) : persons.map((p: Person) => (
                <tr key={p.personId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <UserCircle2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{p.firstName} {p.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.employeeCode}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email}</td>
                  <td className="px-4 py-3 text-gray-600">{p.company?.companyName ?? '—'}</td>
                  <td className="px-4 py-3">
                    {p.position ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" />{p.position.positionName}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.orgUnit ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        <Building2 className="w-3 h-3" />{p.orgUnit.unitName}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <Modal title={editing ? `Edit: ${editing.firstName} ${editing.lastName}` : 'Add Person'} onClose={() => setModalOpen(false)}>
          <div className="w-full max-w-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {editing ? `Edit: ${editing.firstName} ${editing.lastName}` : 'Add Person'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'employeeCode', label: 'Employee Code *', type: 'text', placeholder: 'EMP-001' },
                { key: 'firstName',    label: 'First Name *',    type: 'text', placeholder: 'First name' },
                { key: 'lastName',     label: 'Last Name *',     type: 'text', placeholder: 'Last name' },
                { key: 'email',        label: 'Email *',          type: 'email',placeholder: 'user@company.com' },
                { key: 'phone',        label: 'Phone',            type: 'tel', placeholder: '+1 555 0100' },
                { key: 'hireDate',     label: 'Hire Date',        type: 'date', placeholder: '' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type={type} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}

              {/* Company */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company *</label>
                <select value={form.companyId} onChange={e => {
                  setForm(f => ({ ...f, companyId: e.target.value, positionId: '', orgUnitId: '' }));
                  const cid = Number(e.target.value);
                  if (cid) {
                    getPositions(cid).then(x => setPositions(Array.isArray(x) ? x : [])).catch(() => {});
                    getOrgUnits({ companyId: cid }).then(x => setOrgUnits(Array.isArray(x) ? x : [])).catch(() => {});
                  }
                }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select company…</option>
                  {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.companyName}</option>)}
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Position</label>
                <select value={form.positionId} onChange={e => setForm(f => ({ ...f, positionId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No position</option>
                  {positions.map(p => <option key={p.positionId} value={p.positionId}>{p.positionName}</option>)}
                </select>
              </div>

              {/* Org Unit */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Org Unit</label>
                <select value={form.orgUnitId} onChange={e => setForm(f => ({ ...f, orgUnitId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No org unit</option>
                  {orgUnits.map(u => <option key={u.orgUnitId} value={u.orgUnitId}>{u.unitName}</option>)}
                </select>
              </div>

              {/* Manager */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Manager</label>
                <select value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No manager</option>
                  {persons.filter(p => p.personId !== editing?.personId).map(p => (
                    <option key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Status (edit only) */}
              {editing && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave}
                disabled={saving || !form.firstName || !form.lastName || !form.email || !form.companyId}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editing ? 'Save Changes' : 'Add Person'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
