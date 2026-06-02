'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCustomers, createCustomer, updateCustomer,
  getCompanies, createCompany, updateCompany, deleteCompany,
  getCurrencies,
} from '@/lib/api';
import { Customer, Company, CurrencyMaster } from '@/types';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import {
  Building2, Plus, Pencil, Trash2, CheckCircle, AlertCircle,
  ArrowRight, Users, Shield, Network, Loader2, Globe, Save,
} from 'lucide-react';

// Full country list for the dropdown
const COUNTRIES: { code: string; name: string }[] = [
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SG', name: 'Singapore' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IE', name: 'Ireland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'CH', name: 'Switzerland' },
];

export default function OrganisationSetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === 'SYSTEM_ADMIN';

  // ── Customer ──────────────────────────────────────────────────────────────
  const [customers, setCustomers]       = useState<Customer[]>([]);
  const [custLoading, setCustLoading]   = useState(true);
  const [showCustModal, setShowCustModal] = useState(false);
  const [custEditing, setCustEditing]   = useState<Partial<Customer>>({});
  const [isCustEdit, setIsCustEdit]     = useState(false);
  const [custSaving, setCustSaving]     = useState(false);

  // ── Company ───────────────────────────────────────────────────────────────
  const [companies, setCompanies]       = useState<Company[]>([]);
  const [compLoading, setCompLoading]   = useState(false);
  const [showCompModal, setShowCompModal] = useState(false);
  const [compEditing, setCompEditing]   = useState<Partial<Company & { customerId?: number }>>({});
  const [isCompEdit, setIsCompEdit]     = useState(false);
  const [compSaving, setCompSaving]     = useState(false);

  // ── Currency list (for company form dropdown) ─────────────────────────────
  const [currencies, setCurrencies] = useState<CurrencyMaster[]>([]);

  // ── Redirect non-admins ───────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/unauthorized');
  }, [authLoading, isAdmin, router]);

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadCustomers = useCallback(() => {
    setCustLoading(true);
    getCustomers()
      .then(d => setCustomers(Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])))
      .catch(() => setCustomers([]))
      .finally(() => setCustLoading(false));
  }, []);

  const loadCompanies = useCallback((customerId?: number) => {
    setCompLoading(true);
    getCompanies(customerId)
      .then(d => setCompanies(Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])))
      .catch(() => setCompanies([]))
      .finally(() => setCompLoading(false));
  }, []);

  useEffect(() => {
    loadCustomers();
    loadCompanies();
    getCurrencies()
      .then(d => setCurrencies(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [loadCustomers, loadCompanies]);

  const primaryCustomer = customers[0] ?? null;

  // ── Customer handlers ─────────────────────────────────────────────────────
  const openCreateCustomer = () => {
    setCustEditing({ status: 'ACTIVE' });
    setIsCustEdit(false);
    setShowCustModal(true);
  };
  const openEditCustomer = (c: Customer) => {
    setCustEditing({ ...c });
    setIsCustEdit(true);
    setShowCustModal(true);
  };
  const saveCustomer = async () => {
    setCustSaving(true);
    try {
      if (isCustEdit && (custEditing as Customer).customerId) {
        await updateCustomer((custEditing as Customer).customerId, custEditing);
      } else {
        await createCustomer(custEditing);
      }
      setShowCustModal(false);
      loadCustomers();
    } finally { setCustSaving(false); }
  };

  // ── Company handlers ──────────────────────────────────────────────────────
  const openCreateCompany = () => {
    setCompEditing({ status: 'ACTIVE', customerId: primaryCustomer?.customerId });
    setIsCompEdit(false);
    setShowCompModal(true);
  };
  const openEditCompany = (c: Company) => {
    setCompEditing({ ...c, customerId: c.customer?.customerId });
    setIsCompEdit(true);
    setShowCompModal(true);
  };
  const saveCompany = async () => {
    setCompSaving(true);
    try {
      const { customerId, ...rest } = compEditing as any;
      const payload = { ...rest, customer: customerId ? { customerId } : undefined };
      if (isCompEdit && (compEditing as Company).companyId) {
        await updateCompany((compEditing as Company).companyId, payload);
      } else {
        await createCompany(payload);
      }
      setShowCompModal(false);
      loadCompanies(primaryCustomer?.customerId);
    } finally { setCompSaving(false); }
  };
  const removeCompany = async (id: number) => {
    if (!confirm('Remove this company? Positions, persons and org units linked to it will be affected.')) return;
    await deleteCompany(id);
    loadCompanies(primaryCustomer?.customerId);
  };

  // ── Setup progress steps ──────────────────────────────────────────────────
  const steps = [
    { label: 'Customer',      done: customers.length > 0,  href: null             },
    { label: 'Companies',     done: companies.length > 0,  href: null             },
    { label: 'Positions',     done: false,                  href: '/positions'     },
    { label: 'Org Structure', done: false,                  href: '/org/structure' },
    { label: 'Persons',       done: false,                  href: '/persons'       },
  ];

  if (authLoading || !isAdmin) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-5xl">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Organisation Setup</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Bootstrap your organisation — create the Customer entity, add Companies, then set up Positions and Persons.
        </p>
      </div>

      {/* ── Setup Progress ── */}
      <div className="card p-5 mb-8">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Setup Progress</p>
        <div className="flex items-center">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1 min-w-0">
              <button
                disabled={!step.href}
                onClick={() => step.href && router.push(step.href)}
                className={`flex items-center gap-2 min-w-0 ${step.href ? 'hover:opacity-75 transition-opacity' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 text-xs font-bold ${
                  step.done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step.done ? <CheckCircle className="w-4 h-4" /> : String(i + 1)}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${step.done ? 'text-green-700' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${step.done ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ CUSTOMER / TENANT ══════════════ */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Step 1 — Customer / Tenant</h2>
              <p className="text-xs text-gray-400">The root entity for this deployment. Everything else belongs to it.</p>
            </div>
          </div>
          {!primaryCustomer ? (
            <button onClick={openCreateCustomer} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Customer
            </button>
          ) : (
            <button onClick={() => openEditCustomer(primaryCustomer)}
              className="flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {custLoading ? (
          <div className="card p-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : !primaryCustomer ? (
          <div className="card p-5 flex items-center gap-4 border-2 border-dashed border-amber-200 bg-amber-50/40">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">No customer record found</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Create a Customer to begin. This is the root entity — companies, positions, and persons all sit under it.
              </p>
            </div>
          </div>
        ) : (
          <div className="card p-5 flex items-center gap-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Customer Name</p>
                <p className="text-sm font-semibold text-gray-900">{primaryCustomer.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Code</p>
                <p className="text-sm font-mono text-gray-700">{primaryCustomer.customerCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  primaryCustomer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{primaryCustomer.status}</span>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          </div>
        )}
      </section>

      {/* ══════════════ COMPANIES ══════════════ */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Step 2 — Companies</h2>
              <p className="text-xs text-gray-400">Legal entities and operating companies within this organisation.</p>
            </div>
          </div>
          {primaryCustomer && (
            <button onClick={openCreateCompany} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Company
            </button>
          )}
        </div>

        {!primaryCustomer ? (
          <div className="card p-5 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200">
            Complete Step 1 first — create a Customer before adding Companies.
          </div>
        ) : compLoading ? (
          <div className="card p-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : companies.length === 0 ? (
          <div className="card p-5 flex items-center gap-4 border-2 border-dashed border-gray-200">
            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-600">No companies yet</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Add at least one company. Positions, org units, and persons are all scoped to a company.
              </p>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Code','Company Name','Legal Entity','Country','Currency','Status',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map(c => (
                  <tr key={c.companyId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.companyCode}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{c.companyName}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.legalEntity ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.country ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs font-mono">{c.currency ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEditCompany(c)}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeCompany(c.companyId)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ══════════════ NEXT STEPS ══════════════ */}
      {primaryCustomer && companies.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Step 3 — Complete the Setup</h2>
              <p className="text-xs text-gray-400">Customer and Companies are ready. Continue with the following steps.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {([
              {
                icon: Shield, label: 'Positions & Access',
                desc: 'Define roles and access rights for users in each company',
                href: '/positions', color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: Network, label: 'Org Structure',
                desc: 'Create divisions, departments, business units and cost centres',
                href: '/org/structure', color: 'bg-cyan-50 text-cyan-600',
              },
              {
                icon: Users, label: 'Persons',
                desc: 'Add employees, assign them to companies, positions and org units',
                href: '/persons', color: 'bg-green-50 text-green-600',
              },
            ] as const).map(({ icon: Icon, label, desc, href, color }) => (
              <button key={href} onClick={() => router.push(href)}
                className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 text-left transition-all group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════ CUSTOMER MODAL ══════════════ */}
      {showCustModal && (
        <Modal
          title={isCustEdit ? 'Edit Customer' : 'Create Customer'}
          subtitle="The top-level tenant entity — one per deployment"
          onClose={() => setShowCustModal(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Code *</label>
                <input className="input-field font-mono" placeholder="e.g. ACME"
                  value={custEditing.customerCode ?? ''}
                  onChange={e => setCustEditing(p => ({ ...p, customerCode: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input className="input-field" placeholder="e.g. Acme Corporation"
                  value={custEditing.customerName ?? ''}
                  onChange={e => setCustEditing(p => ({ ...p, customerName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-2">
                {(['ACTIVE', 'INACTIVE'] as const).map(s => (
                  <button key={s} onClick={() => setCustEditing(p => ({ ...p, status: s }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      custEditing.status === s
                        ? s === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setShowCustModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={saveCustomer}
                disabled={custSaving || !custEditing.customerCode || !custEditing.customerName}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {custSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isCustEdit ? 'Update' : 'Create Customer'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════ COMPANY MODAL ══════════════ */}
      {showCompModal && (
        <Modal
          title={isCompEdit ? 'Edit Company' : 'Add Company'}
          subtitle="A legal entity or operating company within your organisation"
          size="lg"
          onClose={() => setShowCompModal(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Code *</label>
                <input className="input-field font-mono" placeholder="e.g. ACME-AU"
                  value={(compEditing as any).companyCode ?? ''}
                  onChange={e => setCompEditing(p => ({ ...p, companyCode: e.target.value.toUpperCase() }))} />
                <p className="text-xs text-gray-400 mt-0.5">Short unique identifier, e.g. ACME-AU</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input className="input-field" placeholder="e.g. Acme Australia Pty Ltd"
                  value={(compEditing as any).companyName ?? ''}
                  onChange={e => setCompEditing(p => ({ ...p, companyName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Entity Name</label>
                <input className="input-field" placeholder="Registered legal name"
                  value={(compEditing as any).legalEntity ?? ''}
                  onChange={e => setCompEditing(p => ({ ...p, legalEntity: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select className="input-field"
                  value={(compEditing as any).country ?? ''}
                  onChange={e => setCompEditing(p => ({ ...p, country: e.target.value }))}>
                  <option value="">— Select country —</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                <select className="input-field"
                  value={(compEditing as any).currency ?? ''}
                  onChange={e => setCompEditing(p => ({ ...p, currency: e.target.value }))}>
                  <option value="">— Select currency —</option>
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-2">
                  {(['ACTIVE', 'INACTIVE'] as const).map(s => (
                    <button key={s} onClick={() => setCompEditing(p => ({ ...p, status: s }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        (compEditing as any).status === s
                          ? s === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
              <textarea className="input-field resize-none" rows={2}
                placeholder="Street address, City, State/Province, Postcode"
                value={(compEditing as any).address ?? ''}
                onChange={e => setCompEditing(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setShowCompModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={saveCompany}
                disabled={compSaving || !(compEditing as any).companyCode || !(compEditing as any).companyName}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {compSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isCompEdit ? 'Update Company' : 'Add Company'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
