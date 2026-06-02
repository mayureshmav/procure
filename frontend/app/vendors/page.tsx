'use client';

import { useEffect, useState } from 'react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '@/lib/api';
import { Vendor, PoDeliveryPreferences } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import {
  Plus, Search, Pencil, Trash2, Building2,
  Mail, Globe, Cpu, FileText, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const EMPTY_VENDOR: Partial<Vendor> = {
  name: '', contactName: '', email: '', phone: '',
  address: '', paymentTerms: 'NET30', category: '', status: 'ACTIVE',
  poDelivery: {
    emailEnabled: true,
    emailFormat: 'PDF',
    emailTo: '',
    portalEnabled: false,
    integrationEnabled: false,
  },
};

const DEFAULT_PO_DELIVERY: PoDeliveryPreferences = {
  emailEnabled: true,
  emailFormat: 'PDF',
  emailTo: '',
  portalEnabled: false,
  integrationEnabled: false,
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${on ? 'bg-primary-600' : 'bg-neutral-200'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

type ModalTab = 'profile' | 'po-delivery';

export default function VendorsPage() {
  const { canAccess } = useAuth();
  const canCreate = canAccess('vendors', 'create');
  const canEdit   = canAccess('vendors', 'edit');
  const canDelete = canAccess('vendors', 'delete');

  const [vendors, setVendors]   = useState<Vendor[]>([]);
  const [filtered, setFiltered] = useState<Vendor[]>([]);
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<Partial<Vendor>>(EMPTY_VENDOR);
  const [isEdit, setIsEdit]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [modalTab, setModalTab] = useState<ModalTab>('profile');

  const load = () => {
    setLoading(true);
    getVendors().then((d: Vendor[]) => { setVendors(d); setFiltered(d); }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(vendors.filter(v =>
      v.name.toLowerCase().includes(q) || (v.category ?? '').toLowerCase().includes(q)
    ));
  }, [search, vendors]);

  const openCreate = () => {
    setEditing(EMPTY_VENDOR);
    setIsEdit(false);
    setModalTab('profile');
    setShowModal(true);
  };

  const openEdit = (v: Vendor) => {
    setEditing({
      ...v,
      poDelivery: v.poDelivery ?? { ...DEFAULT_PO_DELIVERY, emailTo: v.email ?? '' },
    });
    setIsEdit(true);
    setModalTab('profile');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (isEdit && editing.id) await updateVendor(editing.id, editing);
    else await createVendor(editing);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this vendor?')) return;
    await deleteVendor(id);
    load();
  };

  const set = (k: keyof Vendor, v: string) => setEditing(p => ({ ...p, [k]: v }));

  const setDelivery = (patch: Partial<PoDeliveryPreferences>) =>
    setEditing(p => ({
      ...p,
      poDelivery: { ...(p.poDelivery ?? DEFAULT_PO_DELIVERY), ...patch },
    }));

  const pd = editing.poDelivery ?? DEFAULT_PO_DELIVERY;

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-neutral-900">Vendors</h1>
          </div>
          <p className="text-neutral-500 text-sm">
            {vendors.length} supplier {vendors.length === 1 ? 'company' : 'companies'} registered
          </p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Register Vendor
          </button>
        )}
      </div>

      {/* Content Card */}
      <div className="card">
        {/* Search */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center gap-3 bg-neutral-25">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder-neutral-400"
            placeholder="Search by company name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-400 text-sm">Loading vendors…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  {['Company','Category','Contact','Email','Payment Terms','PO Delivery','Status',''].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(v => {
                  const pd = v.poDelivery;
                  return (
                    <tr key={v.id} className="table-row-hover">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 text-sm">{v.name}</p>
                            {v.code && <p className="text-xs text-neutral-400">{v.code}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-neutral">{v.category ?? '—'}</span>
                      </td>
                      <td className="table-cell text-sm text-neutral-700">{v.contactName ?? '—'}</td>
                      <td className="table-cell">
                        {v.email
                          ? <a href={`mailto:${v.email}`} className="text-primary-600 hover:underline text-sm">{v.email}</a>
                          : '—'}
                      </td>
                      <td className="table-cell text-sm font-medium text-neutral-700">{v.paymentTerms ?? '—'}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pd?.emailEnabled && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              <Mail className="w-3 h-3" />{pd.emailFormat}
                            </span>
                          )}
                          {pd?.portalEnabled && (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              <Globe className="w-3 h-3" />Portal
                            </span>
                          )}
                          {pd?.integrationEnabled && (
                            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                              <Cpu className="w-3 h-3" />Integration
                            </span>
                          )}
                          {!pd && <span className="text-xs text-neutral-400 italic">Not configured</span>}
                        </div>
                      </td>
                      <td className="table-cell"><StatusBadge status={v.status} /></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button onClick={() => openEdit(v)}
                              className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors" title="Edit vendor">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => v.id && handleDelete(v.id)}
                              className="p-1.5 hover:bg-error-50 rounded-lg text-error-600 transition-colors" title="Delete vendor">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
            <p className="text-neutral-400 text-sm">No vendors found.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={isEdit ? `Edit Vendor — ${editing.name}` : 'Register New Vendor'}
          subtitle={isEdit ? 'Update company profile and delivery preferences' : 'Register a supplier company and configure PO delivery'}
          onClose={() => setShowModal(false)}
          size="lg"
        >
          {/* Modal tab bar */}
          <div className="flex border-b border-neutral-200 -mx-6 px-6 mb-5">
            {([
              { key: 'profile',     label: 'Company Profile', icon: Building2 },
              { key: 'po-delivery', label: 'PO Delivery',     icon: FileText  },
            ] as { key: ModalTab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setModalTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  modalTab === key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {/* ── Profile Tab ── */}
          {modalTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <label className="input-label">Company Name *</label>
                <input className="input-field" value={editing.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g., Acme Supply Co." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Vendor Code</label>
                  <input className="input-field font-mono" value={editing.code ?? ''} onChange={e => set('code', e.target.value)} placeholder="e.g., VND-001" />
                </div>
                <div>
                  <label className="input-label">Category</label>
                  <input className="input-field" value={editing.category ?? ''} onChange={e => set('category', e.target.value)} placeholder="e.g., Office Supplies" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Primary Contact Name</label>
                  <input className="input-field" value={editing.contactName ?? ''} onChange={e => set('contactName', e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="input-label">Contact Email</label>
                  <input className="input-field" type="email" value={editing.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="vendor@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Phone</label>
                  <input className="input-field" value={editing.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="input-label">Payment Terms</label>
                  <select className="select-field" value={editing.paymentTerms ?? 'NET30'} onChange={e => set('paymentTerms', e.target.value)}>
                    {['COD','NET15','NET30','NET45','NET60'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Status</label>
                  <select className="select-field" value={editing.status ?? 'ACTIVE'} onChange={e => set('status', e.target.value)}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Address</label>
                <textarea className="textarea-field" rows={3} value={editing.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="Street, City, State, Postal Code" />
              </div>
            </div>
          )}

          {/* ── PO Delivery Tab ── */}
          {modalTab === 'po-delivery' && (
            <div className="space-y-5">
              <p className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5">
                Configure how this vendor receives Purchase Orders. You can enable one or multiple channels.
                For automated file delivery, configure the connection details in <strong>Vendor Integrations → PO Delivery</strong>.
              </p>

              {/* Email Channel */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-neutral-50">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-neutral-800">Email Delivery</span>
                    <span className="text-xs text-neutral-400">Send PO as email attachment</span>
                  </div>
                  <Toggle on={pd.emailEnabled} onChange={v => setDelivery({ emailEnabled: v })} />
                </div>
                {pd.emailEnabled && (
                  <div className="px-4 py-4 space-y-4 border-t border-neutral-100">
                    <div>
                      <label className="input-label">PO Recipients Email</label>
                      <input className="input-field" type="email" value={pd.emailTo ?? ''}
                        onChange={e => setDelivery({ emailTo: e.target.value })}
                        placeholder="orders@vendor.com (use comma for multiple)" />
                    </div>
                    <div>
                      <label className="input-label mb-2 block">Attachment Format</label>
                      <div className="flex gap-2">
                        {(['PDF','HTML'] as const).map(fmt => (
                          <button key={fmt} type="button" onClick={() => setDelivery({ emailFormat: fmt })}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                              pd.emailFormat === fmt
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-blue-300'
                            }`}>
                            {fmt === 'PDF' ? '📄 PDF' : '🌐 HTML'}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-400 mt-1.5">
                        {pd.emailFormat === 'PDF'
                          ? 'PO will be attached as a formatted PDF document.'
                          : 'PO will be included as an inline HTML email body.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Portal Channel */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-neutral-50">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-neutral-800">Vendor Portal Inbox</span>
                    <span className="text-xs text-neutral-400">Available in-app under PO Inbox</span>
                  </div>
                  <Toggle on={pd.portalEnabled} onChange={v => setDelivery({ portalEnabled: v })} />
                </div>
                {pd.portalEnabled && (
                  <div className="px-4 py-3 border-t border-neutral-100">
                    <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        Vendor users with <strong>VENDOR_USER</strong> or <strong>VENDOR_ADMIN</strong> roles
                        will see new POs in their <strong>PO Inbox</strong> when they log into the portal.
                        They can acknowledge receipt from there.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Automated Integration Channel */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-neutral-50">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-neutral-800">Automated File Delivery</span>
                    <span className="text-xs text-neutral-400">Push PO file to vendor's SFTP/FTP server</span>
                  </div>
                  <Toggle on={pd.integrationEnabled} onChange={v => setDelivery({ integrationEnabled: v })} />
                </div>
                {pd.integrationEnabled && (
                  <div className="px-4 py-3 border-t border-neutral-100">
                    <div className="flex items-start gap-2 text-xs text-purple-700 bg-purple-50 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        Configure the vendor's SFTP/FTP connection details and file format (CSV, cXML, JSON, EDI)
                        in <strong>Vendor Integrations → PO Delivery</strong> after saving this vendor.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!pd.emailEnabled && !pd.portalEnabled && !pd.integrationEnabled && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  No delivery channel enabled — this vendor will not receive POs automatically.
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-neutral-200">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">
              {isEdit ? 'Update Vendor' : 'Register Vendor'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
