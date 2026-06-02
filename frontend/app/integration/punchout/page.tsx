'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, ClipboardList, Package, Clock, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, ChevronRight, ExternalLink,
  DollarSign, Hash, ArrowRight, Plus, Pencil, Trash2,
  Settings2, Zap, Eye, EyeOff, Store, Globe, Key, Link2,
  Save,
  CheckCircle, Loader2, ShieldCheck, Image,
} from 'lucide-react';
import {
  getPunchOutRequisitions, getPunchOutOrders,
  getPunchOutVendorConfigs, createPunchOutVendorConfig,
  updatePunchOutVendorConfig, deletePunchOutVendorConfig,
  testPunchOutVendorConfig, getVendors, getCurrencies,
} from '@/lib/api';
import type {
  PunchOutRequisition, PunchOutOrder,
  PunchOutVendorConfig, PunchOutDeploymentMode,
  Vendor, CurrencyMaster,
} from '@/types';
import Modal from '@/components/Modal';

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'setup';

type ConfigForm = {
  vendorId:           string;
  displayName:        string;
  logoUrl:            string;
  active:             boolean;
  deploymentMode:     PunchOutDeploymentMode;
  fromDomain:         string;
  fromIdentity:       string;
  toDomain:           string;
  toIdentity:         string;
  sharedSecret:       string;
  punchoutSetupUrl:   string;
  ordersUrl:          string;
  returnUrl:          string;
  apssAccountNumber:  string;
  contractNumber:     string;
  defaultCurrency:    string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n?: number | string, currency = 'USD') {
  const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  return num.toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 2 });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const REQUISITION_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700' },
  CONVERTED: { label: 'Converted', color: 'bg-green-100 text-green-700'  },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600'    },
};

const ORDER_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  RECEIVED:   { label: 'Received',   color: 'bg-blue-100 text-blue-700',    icon: Clock       },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: RefreshCw   },
  CONFIRMED:  { label: 'Confirmed',  color: 'bg-green-100 text-green-700',   icon: CheckCircle2},
  CANCELLED:  { label: 'Cancelled',  color: 'bg-gray-100 text-gray-600',     icon: XCircle     },
  FAILED:     { label: 'Failed',     color: 'bg-red-100 text-red-700',       icon: AlertCircle },
};

function StatusBadge({
  status, map,
}: { status: string; map: Record<string, { label: string; color: string; icon?: React.ElementType }> }) {
  const cfg = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────────

function ProtocolFlow() {
  const steps = [
    { num: '①', title: 'Setup Request', sub: 'Buyer → POST /punchout/setup',         color: 'text-blue-500'   },
    { num: '②', title: 'Catalogue',     sub: 'Browser → /punchout?sid=TOKEN',         color: 'text-indigo-500' },
    { num: '③', title: 'Cart Return',   sub: 'Browser form-posts OrderMessage',       color: 'text-violet-500' },
    { num: '④', title: 'Order Request', sub: 'Buyer → POST /punchout/orders',         color: 'text-purple-500' },
  ];
  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">cXML PunchOut Protocol Flow</h3>
      <div className="flex items-center gap-1 flex-wrap">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1">
            <div className="flex flex-col items-center text-center">
              <span className={`text-lg font-bold ${s.color}`}>{s.num}</span>
              <span className="text-xs font-medium text-gray-700">{s.title}</span>
              <span className="text-xs text-gray-400 max-w-[120px]">{s.sub}</span>
            </div>
            {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 mx-1 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Vendor config card ─────────────────────────────────────────────────────────

function VendorConfigCard({
  cfg, onEdit, onDelete, onTest, testing,
}: {
  cfg: PunchOutVendorConfig;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  testing: boolean;
}) {
  return (
    <div className={`card flex flex-col gap-0 overflow-hidden ${!cfg.active ? 'opacity-70' : ''}`}>
      {/* Card header — logo + name + badges */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          {/* Logo / avatar */}
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center border border-gray-200">
            {cfg.logoUrl ? (
              <img src={cfg.logoUrl} alt={cfg.displayName ?? cfg.vendorName ?? 'logo'}
                className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-lg font-bold text-gray-400">
                {(cfg.displayName ?? cfg.vendorName ?? '?')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {cfg.displayName ?? cfg.vendorName ?? '—'}
            </p>
            {cfg.displayName && cfg.vendorName && cfg.displayName !== cfg.vendorName && (
              <p className="text-xs text-gray-400 truncate">{cfg.vendorName}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                cfg.deploymentMode === 'PRODUCTION' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>{cfg.deploymentMode}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                cfg.active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>{cfg.active ? 'Active' : 'Inactive'}</span>
              {cfg.testStatus === 'OK' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
              {cfg.testStatus === 'FAILED' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-1 font-medium">
                  <XCircle className="w-3 h-3" /> Test Failed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key details */}
      <div className="p-4 space-y-2 flex-1">
        {cfg.punchoutSetupUrl && (
          <div className="flex items-start gap-2">
            <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Setup URL</p>
              <p className="text-xs font-mono text-gray-700 truncate">{cfg.punchoutSetupUrl}</p>
            </div>
          </div>
        )}
        {cfg.ordersUrl && (
          <div className="flex items-start gap-2">
            <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Orders URL</p>
              <p className="text-xs font-mono text-gray-700 truncate">{cfg.ordersUrl}</p>
            </div>
          </div>
        )}
        {(cfg.fromIdentity || cfg.toIdentity) && (
          <div className="flex items-start gap-2">
            <Key className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Identity</p>
              <p className="text-xs text-gray-700 truncate">
                {cfg.fromIdentity && <span className="font-mono">{cfg.fromIdentity}</span>}
                {cfg.fromIdentity && cfg.toIdentity && <span className="text-gray-400 mx-1">→</span>}
                {cfg.toIdentity && <span className="font-mono">{cfg.toIdentity}</span>}
              </p>
            </div>
          </div>
        )}
        {cfg.apssAccountNumber && (
          <div className="flex items-start gap-2">
            <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">ANID / APSS Account</p>
              <p className="text-xs font-mono text-gray-700">{cfg.apssAccountNumber}</p>
            </div>
          </div>
        )}
        {cfg.contractNumber && (
          <div className="flex items-start gap-2">
            <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Contract</p>
              <p className="text-xs font-mono text-gray-700">{cfg.contractNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
        <button onClick={onTest} disabled={testing}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {testing ? 'Testing…' : 'Test'}
        </button>
        <button onClick={onEdit}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Configure
        </button>
        <button onClick={onDelete}
          className="ml-auto p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Section label helper ───────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-700">{title}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}

// ── Empty form factory ─────────────────────────────────────────────────────────

const EMPTY_FORM: ConfigForm = {
  vendorId: '', displayName: '', logoUrl: '', active: true,
  deploymentMode: 'TEST',
  fromDomain: 'AribaNetworkUserId', fromIdentity: '',
  toDomain: 'AribaNetworkUserId',   toIdentity: '',
  sharedSecret: '',
  punchoutSetupUrl: '', ordersUrl: '', returnUrl: '',
  apssAccountNumber: '', contractNumber: '', defaultCurrency: 'USD',
};

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PunchOutPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  // ── Dashboard state ────────────────────────────────────────────────────────
  const [requisitions, setRequisitions] = useState<PunchOutRequisition[]>([]);
  const [orders, setOrders]             = useState<PunchOutOrder[]>([]);
  const [dashLoading, setDashLoading]   = useState(true);

  // ── Vendor setup state ─────────────────────────────────────────────────────
  const [configs, setConfigs]           = useState<PunchOutVendorConfig[]>([]);
  const [cfgLoading, setCfgLoading]     = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [isEdit, setIsEdit]             = useState(false);
  const [editingId, setEditingId]       = useState<string | number | null>(null);
  const [form, setForm]                 = useState<ConfigForm>(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [secretVisible, setSecretVisible] = useState(false);
  const [testing, setTesting]           = useState<string | number | null>(null);

  // ── Reference data ─────────────────────────────────────────────────────────
  const [vendors, setVendors]           = useState<Vendor[]>([]);
  const [currencies, setCurrencies]     = useState<CurrencyMaster[]>([]);

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadDashboard = useCallback(() => {
    setDashLoading(true);
    Promise.all([getPunchOutRequisitions(), getPunchOutOrders()])
      .then(([req, ord]) => {
        setRequisitions(Array.isArray(req) ? req : []);
        setOrders(Array.isArray(ord) ? ord : []);
      })
      .catch(() => {})
      .finally(() => setDashLoading(false));
  }, []);

  const loadConfigs = useCallback(() => {
    setCfgLoading(true);
    getPunchOutVendorConfigs()
      .then(d => setConfigs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setCfgLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard();
    loadConfigs();
    getVendors().then(d => setVendors(Array.isArray(d) ? d : [])).catch(() => {});
    getCurrencies().then(d => setCurrencies(Array.isArray(d) ? d : [])).catch(() => {});
  }, [loadDashboard, loadConfigs]);

  // ── Dashboard derived ──────────────────────────────────────────────────────
  const pendingReqs     = requisitions.filter(r => r.status === 'PENDING');
  const receivedOrders  = orders.filter(o => o.status === 'RECEIVED');
  const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED');
  const totalOrderValue = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const recentReqs      = [...requisitions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentOrders    = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // ── Config handlers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setEditingId(null);
    setSecretVisible(false);
    setShowModal(true);
  };

  const openEdit = (cfg: PunchOutVendorConfig) => {
    setForm({
      vendorId:          String(cfg.vendorId ?? ''),
      displayName:       cfg.displayName ?? '',
      logoUrl:           cfg.logoUrl ?? '',
      active:            cfg.active,
      deploymentMode:    cfg.deploymentMode,
      fromDomain:        cfg.fromDomain ?? 'AribaNetworkUserId',
      fromIdentity:      cfg.fromIdentity ?? '',
      toDomain:          cfg.toDomain ?? 'AribaNetworkUserId',
      toIdentity:        cfg.toIdentity ?? '',
      sharedSecret:      cfg.sharedSecret ?? '',
      punchoutSetupUrl:  cfg.punchoutSetupUrl ?? '',
      ordersUrl:         cfg.ordersUrl ?? '',
      returnUrl:         cfg.returnUrl ?? '',
      apssAccountNumber: cfg.apssAccountNumber ?? '',
      contractNumber:    cfg.contractNumber ?? '',
      defaultCurrency:   cfg.defaultCurrency ?? 'USD',
    });
    setIsEdit(true);
    setEditingId(cfg.id ?? null);
    setSecretVisible(false);
    setShowModal(true);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const selectedVendor = vendors.find(v => String(v.id) === form.vendorId);
      const payload = {
        ...form,
        vendorId:   form.vendorId ? Number(form.vendorId) : undefined,
        vendorName: selectedVendor?.name,
        returnUrl:  form.returnUrl || undefined,
        contractNumber: form.contractNumber || undefined,
        sharedSecret:   form.sharedSecret || undefined,
      };
      if (isEdit && editingId != null) {
        await updatePunchOutVendorConfig(editingId, payload);
      } else {
        await createPunchOutVendorConfig(payload);
      }
      setShowModal(false);
      loadConfigs();
    } finally { setSaving(false); }
  };

  const deleteConfig = async (cfg: PunchOutVendorConfig) => {
    if (!confirm(`Remove PunchOut configuration for ${cfg.displayName ?? cfg.vendorName}?`)) return;
    await deletePunchOutVendorConfig(cfg.id!);
    setConfigs(c => c.filter(x => x.id !== cfg.id));
  };

  const testConfig = async (cfg: PunchOutVendorConfig) => {
    if (!cfg.id) return;
    setTesting(cfg.id);
    try {
      await testPunchOutVendorConfig(cfg.id);
      setConfigs(c => c.map(x => x.id === cfg.id ? { ...x, testStatus: 'OK', lastTestedAt: new Date().toISOString() } : x));
    } catch {
      setConfigs(c => c.map(x => x.id === cfg.id ? { ...x, testStatus: 'FAILED' } : x));
    } finally { setTesting(null); }
  };

  const f = (key: keyof ConfigForm, val: string | boolean) =>
    setForm(p => ({ ...p, [key]: val }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PunchOut Integration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            cXML Ariba-compatible supplier PunchOut — vendor setup, session management &amp; order tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'dashboard' && (
            <button onClick={loadDashboard} disabled={dashLoading} className="btn-secondary flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${dashLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          )}
          {tab === 'setup' && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add PunchOut Vendor
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 -mt-2">
        {([
          { key: 'dashboard', label: 'Dashboard',    icon: ShoppingBag },
          { key: 'setup',     label: 'Vendor Setup', icon: Settings2   },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <Icon className="w-4 h-4" />{label}
            {key === 'setup' && configs.length > 0 && (
              <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                {configs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════ DASHBOARD TAB ════════════════════ */}
      {tab === 'dashboard' && (
        <>
          <ProtocolFlow />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Pending Requisitions" value={dashLoading ? '…' : pendingReqs.length}
              sub="Awaiting conversion to PO" icon={ClipboardList} color="bg-yellow-100 text-yellow-600" />
            <StatCard label="New Orders" value={dashLoading ? '…' : receivedOrders.length}
              sub="OrderRequest received" icon={ShoppingBag} color="bg-blue-100 text-blue-600" />
            <StatCard label="Confirmed Orders" value={dashLoading ? '…' : confirmedOrders.length}
              sub="Supplier confirmed" icon={CheckCircle2} color="bg-green-100 text-green-600" />
            <StatCard label="Total Order Value" value={dashLoading ? '…' : fmt(totalOrderValue)}
              sub={`${orders.length} orders total`} icon={DollarSign} color="bg-purple-100 text-purple-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Requisitions */}
            <div className="card">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Recent Requisitions</h3>
                  {pendingReqs.length > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                      {pendingReqs.length} pending
                    </span>
                  )}
                </div>
                <Link href="/integration/punchout/requisitions" className="text-xs text-blue-600 flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {dashLoading ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">Loading…</div>
              ) : recentReqs.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No requisitions yet</p>
                  <p className="text-xs text-gray-400 mt-1">Carts arrive after buyers complete PunchOut checkout</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentReqs.map(req => (
                    <div key={req.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{req.buyerCookie.slice(0, 20)}…</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{req.lineItems?.length ?? 0} lines</span>
                            <span className="text-xs font-medium text-gray-700">{fmt(req.totalAmount, req.currency)}</span>
                            <span className="text-xs text-gray-400">{timeAgo(req.createdAt)}</span>
                          </div>
                        </div>
                        <StatusBadge status={req.status} map={REQUISITION_STATUS} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="card">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Recent Purchase Orders</h3>
                  {receivedOrders.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {receivedOrders.length} new
                    </span>
                  )}
                </div>
                <Link href="/integration/punchout/orders" className="text-xs text-blue-600 flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {dashLoading ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">Loading…</div>
              ) : recentOrders.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No purchase orders yet</p>
                  <p className="text-xs text-gray-400 mt-1">Orders arrive when buyer sends approved OrderRequest</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentOrders.map(po => (
                    <Link key={po.id} href={`/integration/punchout/orders/${po.orderId}`}
                      className="block px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              <Hash className="w-3 h-3 inline mr-0.5 text-gray-400" />{po.orderId}
                            </p>
                            {po.orderType !== 'new' && (
                              <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium uppercase">
                                {po.orderType}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 truncate">{po.buyerIdentity}</span>
                            <span className="text-xs font-medium text-gray-700">{fmt(po.totalAmount, po.currency)}</span>
                            <span className="text-xs text-gray-400">{timeAgo(po.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={po.status} map={ORDER_STATUS} />
                          <ExternalLink className="w-3 h-3 text-gray-300" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Endpoint reference */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">API Endpoint Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { method: 'POST', path: '/api/punchout/setup',           note: 'PunchOutSetupRequest → StartPage URL' },
                { method: 'GET',  path: '/api/punchout/session/{token}', note: 'Activate session token (catalogue)' },
                { method: 'POST', path: '/api/punchout/order-message',   note: 'Browser form-posts PunchOutOrderMessage' },
                { method: 'POST', path: '/api/punchout/orders',          note: 'Buyer final approved OrderRequest' },
                { method: 'POST', path: '/api/punchout/cart-build',      note: 'JSON cart → HTML auto-submit form' },
                { method: 'POST', path: '/api/punchout/cart-cxml',       note: 'JSON cart → raw cXML (debug)' },
              ].map(e => (
                <div key={e.path} className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded-lg">
                  <span className={`font-mono font-bold flex-shrink-0 ${e.method === 'POST' ? 'text-green-600' : 'text-blue-600'}`}>
                    {e.method}
                  </span>
                  <code className="text-gray-700 font-mono flex-shrink-0">{e.path}</code>
                  <span className="text-gray-400">{e.note}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════ VENDOR SETUP TAB ════════════════════ */}
      {tab === 'setup' && (
        <>
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-gray-500 max-w-2xl">
              Configure each supplier's cXML PunchOut credentials — logo, identity, shared secret,
              endpoint URLs, and APSS/ANID account number. Each record links to a registered vendor.
            </p>
            <button onClick={loadConfigs} disabled={cfgLoading}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 flex-shrink-0">
              <RefreshCw className={`w-4 h-4 ${cfgLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {cfgLoading ? (
            <div className="card p-12 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading configurations…
            </div>
          ) : configs.length === 0 ? (
            <div className="card p-14 text-center">
              <Store className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-600">No PunchOut vendors configured</p>
              <p className="text-xs text-gray-400 mt-1 mb-5">
                Add your first vendor to enable the cXML PunchOut flow for catalogue browsing and order routing.
              </p>
              <button onClick={openCreate} className="btn-primary flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Add PunchOut Vendor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {configs.map(cfg => (
                <VendorConfigCard
                  key={cfg.id}
                  cfg={cfg}
                  onEdit={() => openEdit(cfg)}
                  onDelete={() => deleteConfig(cfg)}
                  onTest={() => testConfig(cfg)}
                  testing={testing === cfg.id}
                />
              ))}
              {/* "Add another" ghost card */}
              <button onClick={openCreate}
                className="rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-2 p-8 transition-all text-gray-400 hover:text-blue-500 min-h-[200px]">
                <Plus className="w-6 h-6" />
                <span className="text-sm font-medium">Add Vendor</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ════════════════════ CONFIG MODAL ════════════════════ */}
      {showModal && (
        <Modal
          title={isEdit ? 'Edit PunchOut Vendor' : 'Add PunchOut Vendor'}
          subtitle="Configure cXML credentials and endpoints for this supplier"
          size="xl"
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-6">

            {/* ── Section 1: Vendor & Branding ── */}
            <div>
              <SectionLabel icon={Store} title="Vendor & Branding"
                hint="Link to a registered vendor and configure the catalogue display" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                  <select className="input-field" value={form.vendorId}
                    onChange={e => {
                      const vendor = vendors.find(v => String(v.id) === e.target.value);
                      f('vendorId', e.target.value);
                      if (vendor && !form.displayName) f('displayName', vendor.name);
                    }}>
                    <option value="">— Select vendor —</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input className="input-field" placeholder="Name shown in catalogue header"
                    value={form.displayName} onChange={e => f('displayName', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <div className="flex items-center gap-3">
                    <input className="input-field flex-1" placeholder="https://vendor.com/logo.png"
                      value={form.logoUrl} onChange={e => f('logoUrl', e.target.value)} />
                    {form.logoUrl && (
                      <img src={form.logoUrl} alt="preview"
                        className="w-10 h-10 rounded-lg object-contain border border-gray-200 bg-gray-50 p-0.5 flex-shrink-0" />
                    )}
                    {!form.logoUrl && (
                      <div className="w-10 h-10 rounded-lg border border-dashed border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Image className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deployment Mode</label>
                  <div className="flex gap-2">
                    {(['TEST', 'PRODUCTION'] as PunchOutDeploymentMode[]).map(mode => (
                      <button key={mode} onClick={() => f('deploymentMode', mode)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                          form.deploymentMode === mode
                            ? mode === 'PRODUCTION'
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>{mode}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.active}
                      onChange={e => f('active', e.target.checked)} />
                    <span className="text-sm text-gray-700">Active (enabled for PunchOut sessions)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ── Section 2: cXML Identity ── */}
            <div>
              <SectionLabel icon={Key} title="cXML Identity &amp; Authentication"
                hint="These values populate the cXML Sender / Receiver header blocks" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">From Domain (our qualifier)</label>
                  <input className="input-field font-mono text-sm"
                    placeholder="AribaNetworkUserId"
                    value={form.fromDomain} onChange={e => f('fromDomain', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">From Identity (our ID)</label>
                  <input className="input-field font-mono text-sm"
                    placeholder="buyer@yourcompany.com"
                    value={form.fromIdentity} onChange={e => f('fromIdentity', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">To Domain (vendor qualifier)</label>
                  <input className="input-field font-mono text-sm"
                    placeholder="AribaNetworkUserId"
                    value={form.toDomain} onChange={e => f('toDomain', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">To Identity (vendor ID)</label>
                  <input className="input-field font-mono text-sm"
                    placeholder="vendor@ariba.com"
                    value={form.toIdentity} onChange={e => f('toIdentity', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Shared Secret</label>
                  <div className="relative">
                    <input
                      className="input-field font-mono text-sm pr-10"
                      type={secretVisible ? 'text' : 'password'}
                      placeholder="cXML shared secret / password"
                      value={form.sharedSecret}
                      onChange={e => f('sharedSecret', e.target.value)}
                    />
                    <button type="button"
                      onClick={() => setSecretVisible(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {secretVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Used in the cXML &lt;SharedSecret&gt; element to authenticate setup requests.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section 3: Endpoints ── */}
            <div>
              <SectionLabel icon={Globe} title="Endpoint URLs"
                hint="Where requests are sent and where the browser returns after catalogue browsing" />
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">PunchOut Setup URL *</label>
                  <input className="input-field font-mono text-sm"
                    placeholder="https://vendor.com/cxml/punchout/setup"
                    value={form.punchoutSetupUrl} onChange={e => f('punchoutSetupUrl', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-0.5">Vendor's cXML endpoint that receives the PunchOutSetupRequest.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Orders Delivery URL</label>
                  <input className="input-field font-mono text-sm"
                    placeholder="https://vendor.com/cxml/orders"
                    value={form.ordersUrl} onChange={e => f('ordersUrl', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-0.5">Where approved OrderRequest documents are delivered to the vendor.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Browser Return URL (optional)</label>
                  <input className="input-field font-mono text-sm"
                    placeholder="https://yourapp.com/punchout/order-message  (auto-generated if blank)"
                    value={form.returnUrl} onChange={e => f('returnUrl', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-0.5">
                    Our URL that appears in the StartPage BrowserFormPost — where the vendor posts the cart back.
                    Leave blank to use the system default.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section 4: Account & Settings ── */}
            <div>
              <SectionLabel icon={Hash} title="Account &amp; Settings"
                hint="Ariba Network account binding and currency defaults" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">ANID / APSS Account Number</label>
                  <input className="input-field font-mono text-sm"
                    placeholder="AN01234567890123"
                    value={form.apssAccountNumber} onChange={e => f('apssAccountNumber', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-0.5">Ariba Network ID — binds this config to the supplier's APSS account.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Contract / Agreement Number</label>
                  <input className="input-field text-sm"
                    placeholder="Optional — e.g. CONTRACT-0042"
                    value={form.contractNumber} onChange={e => f('contractNumber', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Default Currency</label>
                  <select className="input-field text-sm" value={form.defaultCurrency}
                    onChange={e => f('defaultCurrency', e.target.value)}>
                    <option value="">— Select —</option>
                    {currencies.length > 0
                      ? currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)
                      : ['USD','EUR','GBP','AUD','NZD','SGD','CAD'].map(c => <option key={c} value={c}>{c}</option>)
                    }
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveConfig}
                disabled={saving || !form.vendorId || !form.punchoutSetupUrl}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? 'Update Vendor' : 'Add Vendor'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
