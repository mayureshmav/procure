'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import {
  Building2, Plus, Pencil, Trash2, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Globe, Users, Package,
  ShieldAlert, RefreshCw, Search, Loader2,
} from 'lucide-react';

const COUNTRIES = [
  { code: 'AU', name: 'Australia' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' }, { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'JP', name: 'Japan' }, { code: 'CN', name: 'China' },
];

const CURRENCIES = ['USD', 'AUD', 'NZD', 'GBP', 'EUR', 'CAD', 'SGD', 'INR', 'JPY', 'AED'];

type Tenant = {
  customerId: number;
  customerCode: string;
  customerName: string;
  status: string;
  createdAt: string;
  companies: Company[];
};

type Company = {
  companyId: number;
  companyCode: string;
  companyName: string;
  country: string;
  currency: string;
  legalEntity: string;
  address: string;
  status: string;
};

const apiHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export default function SuperAdminTenantsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // ── State ────────────────────────────────────────────────────────────────
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Tenant (Customer) modal
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantEdit, setTenantEdit] = useState<Partial<Tenant>>({});
  const [tenantSaving, setTenantSaving] = useState(false);
  const [isTenantEdit, setIsTenantEdit] = useState(false);

  // Company modal
  const [showCompModal, setShowCompModal] = useState(false);
  const [compEdit, setCompEdit] = useState<Partial<Company & { customerId?: number }>>({});
  const [compSaving, setCompSaving] = useState(false);
  const [isCompEdit, setIsCompEdit] = useState(false);

  // Redirect non-super-admins
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) router.replace('/unauthorized');
  }, [authLoading, isSuperAdmin, router]);

  // ── Data loaders ──────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/customers', { headers: apiHeaders() })
      .then(r => r.json())
      .then(async (customers: Tenant[]) => {
        // Fetch companies for each customer
        const withCompanies = await Promise.all(
          (Array.isArray(customers) ? customers : []).map(async (c) => {
            try {
              const comps = await fetch(`/api/companies?customerId=${c.customerId}`, { headers: apiHeaders() }).then(r => r.json());
              return { ...c, companies: Array.isArray(comps) ? comps : [] };
            } catch { return { ...c, companies: [] }; }
          })
        );
        setTenants(withCompanies);
      })
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (isSuperAdmin) load(); }, [isSuperAdmin, load]);

  // ── Tenant (Customer) CRUD ────────────────────────────────────────────────
  const openNewTenant = () => {
    setTenantEdit({ status: 'ACTIVE' });
    setIsTenantEdit(false);
    setShowTenantModal(true);
  };

  const openEditTenant = (t: Tenant) => {
    setTenantEdit(t);
    setIsTenantEdit(true);
    setShowTenantModal(true);
  };

  const saveTenant = async () => {
    if (!tenantEdit.customerCode || !tenantEdit.customerName) return;
    setTenantSaving(true);
    try {
      if (isTenantEdit && tenantEdit.customerId) {
        await fetch(`/api/customers/${tenantEdit.customerId}`, {
          method: 'PUT', headers: apiHeaders(), body: JSON.stringify(tenantEdit),
        });
      } else {
        await fetch('/api/customers', {
          method: 'POST', headers: apiHeaders(), body: JSON.stringify(tenantEdit),
        });
      }
      setShowTenantModal(false);
      load();
    } finally { setTenantSaving(false); }
  };

  const toggleTenantStatus = async (t: Tenant) => {
    const next = t.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await fetch(`/api/customers/${t.customerId}`, {
      method: 'PUT', headers: apiHeaders(),
      body: JSON.stringify({ ...t, status: next }),
    });
    load();
  };

  // ── Company CRUD ──────────────────────────────────────────────────────────
  const openNewCompany = (customerId: number) => {
    setCompEdit({ customerId, status: 'ACTIVE', currency: 'USD' });
    setIsCompEdit(false);
    setShowCompModal(true);
  };

  const openEditCompany = (comp: Company, customerId: number) => {
    setCompEdit({ ...comp, customerId });
    setIsCompEdit(true);
    setShowCompModal(true);
  };

  const saveCompany = async () => {
    if (!compEdit.companyCode || !compEdit.companyName || !compEdit.customerId) return;
    setCompSaving(true);
    try {
      if (isCompEdit && compEdit.companyId) {
        await fetch(`/api/companies/${compEdit.companyId}`, {
          method: 'PUT', headers: apiHeaders(),
          body: JSON.stringify({
            companyName: compEdit.companyName,
            legalEntity: compEdit.legalEntity ?? '',
            country:     compEdit.country ?? '',
            currency:    compEdit.currency ?? 'USD',
            address:     compEdit.address ?? '',
            status:      compEdit.status ?? 'ACTIVE',
          }),
        });
      } else {
        await fetch('/api/companies', {
          method: 'POST', headers: apiHeaders(),
          body: JSON.stringify({
            customerId:   compEdit.customerId,
            companyCode:  compEdit.companyCode,
            companyName:  compEdit.companyName,
            legalEntity:  compEdit.legalEntity ?? '',
            country:      compEdit.country ?? '',
            currency:     compEdit.currency ?? 'USD',
            address:      compEdit.address ?? '',
            status:       compEdit.status ?? 'ACTIVE',
          }),
        });
      }
      setShowCompModal(false);
      load();
    } finally { setCompSaving(false); }
  };

  const deleteCompany = async (id: number) => {
    if (!confirm('Delete this company? This cannot be undone.')) return;
    await fetch(`/api/companies/${id}`, { method: 'DELETE', headers: apiHeaders() });
    load();
  };

  // ── Filtered tenants ──────────────────────────────────────────────────────
  const filtered = tenants.filter(t =>
    !search ||
    t.customerName.toLowerCase().includes(search.toLowerCase()) ||
    t.customerCode.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || (!isSuperAdmin && !authLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="text-xs font-semibold text-red-600 uppercase tracking-widest">Super Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create and manage organisations (tenants). Each tenant is an isolated customer with its own companies, users, and data.
          </p>
        </div>
        <button onClick={openNewTenant}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 shadow-sm">
          <Plus className="w-4 h-4" /> New Tenant
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Tenants', value: tenants.length, icon: Building2, color: 'blue' },
          { label: 'Active', value: tenants.filter(t => t.status === 'ACTIVE').length, icon: CheckCircle, color: 'green' },
          { label: 'Total Companies', value: tenants.reduce((s, t) => s + (t.companies?.length ?? 0), 0), icon: Package, color: 'purple' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 bg-${k.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <k.icon className={`w-5 h-5 text-${k.color}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + refresh ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tenants…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
        </div>
        <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tenant list ── */}
      {loading ? (
        <div className="text-center py-16 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading tenants…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tenants yet</p>
          <p className="text-sm">Click "New Tenant" to create the first organisation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(tenant => {
            const isOpen = expanded[tenant.customerId] ?? false;
            return (
              <div key={tenant.customerId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Tenant header row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <button onClick={() => setExpanded(p => ({ ...p, [tenant.customerId]: !isOpen }))}
                    className="text-gray-400 hover:text-gray-700 flex-shrink-0">
                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>

                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{tenant.customerName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {tenant.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs font-mono text-primary-600">{tenant.customerCode}</span>
                      <span className="text-xs text-gray-400">{tenant.companies?.length ?? 0} companies</span>
                      <span className="text-xs text-gray-400">Created {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => openNewCompany(tenant.customerId)}
                      className="flex items-center gap-1.5 text-xs border border-primary-200 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50">
                      <Plus className="w-3.5 h-3.5" /> Add Company
                    </button>
                    <button onClick={() => openEditTenant(tenant)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleTenantStatus(tenant)}
                      title={tenant.status === 'ACTIVE' ? 'Deactivate tenant' : 'Activate tenant'}
                      className={`p-1.5 rounded-lg hover:bg-gray-100 ${tenant.status === 'ACTIVE' ? 'text-green-500 hover:text-red-500' : 'text-gray-400 hover:text-green-500'}`}>
                      {tenant.status === 'ACTIVE' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Companies panel */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    {(tenant.companies ?? []).length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">No companies yet. Add the first company for this tenant.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-500 uppercase tracking-wide">
                            {['Code', 'Company Name', 'Country', 'Currency', 'Legal Entity', 'Status', ''].map(h => (
                              <th key={h} className="text-left pb-2 pr-4 font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {tenant.companies.map(comp => (
                            <tr key={comp.companyId} className="hover:bg-white transition-colors">
                              <td className="py-2.5 pr-4 font-mono text-xs text-primary-600 font-semibold">{comp.companyCode}</td>
                              <td className="py-2.5 pr-4 font-medium text-gray-900">{comp.companyName}</td>
                              <td className="py-2.5 pr-4 text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                                  {comp.country ?? '—'}
                                </div>
                              </td>
                              <td className="py-2.5 pr-4 text-gray-600">{comp.currency ?? '—'}</td>
                              <td className="py-2.5 pr-4 text-gray-500 text-xs">{comp.legalEntity ?? '—'}</td>
                              <td className="py-2.5 pr-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${comp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {comp.status}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEditCompany(comp, tenant.customerId)}
                                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => deleteCompany(comp.companyId)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <button onClick={() => openNewCompany(tenant.customerId)}
                      className="mt-3 flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium">
                      <Plus className="w-3.5 h-3.5" /> Add Company
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── New / Edit Tenant Modal ── */}
      {showTenantModal && (
        <Modal title={isTenantEdit ? 'Edit Tenant' : 'Create New Tenant'} onClose={() => setShowTenantModal(false)}>
          <div className="space-y-4">
            {!isTenantEdit && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                <span>A new tenant creates an isolated organisation. Users and data are scoped to this tenant.</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tenant Code *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="e.g. ACME" value={tenantEdit.customerCode ?? ''}
                  onChange={e => setTenantEdit(p => ({ ...p, customerCode: e.target.value.toUpperCase() }))}
                  disabled={isTenantEdit} />
                {!isTenantEdit && <p className="text-xs text-gray-400 mt-1">Unique code, cannot be changed later.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Organisation Name *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="e.g. Acme Corp" value={tenantEdit.customerName ?? ''}
                  onChange={e => setTenantEdit(p => ({ ...p, customerName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={tenantEdit.status ?? 'ACTIVE'}
                onChange={e => setTenantEdit(p => ({ ...p, status: e.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setShowTenantModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveTenant} disabled={tenantSaving || !tenantEdit.customerCode || !tenantEdit.customerName}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {tenantSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isTenantEdit ? 'Save Changes' : 'Create Tenant'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── New / Edit Company Modal ── */}
      {showCompModal && (
        <Modal title={isCompEdit ? 'Edit Company' : 'Add Company'} onClose={() => setShowCompModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Company Code *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="e.g. ACME-AU" value={compEdit.companyCode ?? ''}
                  onChange={e => setCompEdit(p => ({ ...p, companyCode: e.target.value.toUpperCase() }))}
                  disabled={isCompEdit} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="e.g. Acme Corp Australia" value={compEdit.companyName ?? ''}
                  onChange={e => setCompEdit(p => ({ ...p, companyName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={compEdit.country ?? ''}
                  onChange={e => setCompEdit(p => ({ ...p, country: e.target.value }))}>
                  <option value="">— Select —</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Currency</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={compEdit.currency ?? 'USD'}
                  onChange={e => setCompEdit(p => ({ ...p, currency: e.target.value }))}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Legal Entity</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="e.g. Acme Corporation Pty Ltd" value={compEdit.legalEntity ?? ''}
                  onChange={e => setCompEdit(p => ({ ...p, legalEntity: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="Street, City, State, Country" value={compEdit.address ?? ''}
                  onChange={e => setCompEdit(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={compEdit.status ?? 'ACTIVE'}
                  onChange={e => setCompEdit(p => ({ ...p, status: e.target.value }))}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setShowCompModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveCompany} disabled={compSaving || !compEdit.companyCode || !compEdit.companyName}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {compSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isCompEdit ? 'Save Changes' : 'Add Company'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
