'use client';
import { useState, useEffect } from 'react';
import { Upload, CheckCircle, Clock, AlertTriangle, XCircle, ChevronDown, Plus, FileText, Eye, Filter } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

type ApInvoice = {
  id: string; invoiceNo: string; poNumber: string; vendor: string;
  date: string; dueDate: string; amount: number; tax: number;
  currency: string; status: string; poStatus: string;
};

type ApSummary = {
  totalOutstanding: number; totalPaid: number; overdueCount: number; invoiceCount: number;
};

const EXCEPTIONS = [
  { type: 'Price Variance', desc: 'Invoice amount differs from PO by >5%', count: 7, color: 'red' },
  { type: 'Duplicate Invoice', desc: 'Same vendor + amount + date already in system', count: 2, color: 'orange' },
  { type: 'No PO Reference', desc: 'Invoice arrived without a matching PO', count: 11, color: 'red' },
  { type: 'Unrecognised Vendor', desc: 'Vendor not in approved vendor master', count: 3, color: 'orange' },
  { type: 'Low AI Confidence', desc: 'AI confidence <70%; GL coding uncertain', count: 5, color: 'yellow' },
  { type: 'Overdue Approval', desc: 'Pending approval >48h with no action', count: 4, color: 'yellow' },
];

const RULES = [
  { name: 'Standard AP', trigger: 'All invoices ≤$5,000', tier1: 'Dept Manager', tier2: '—', final: 'Accounting', threshold: '$5,000', active: true },
  { name: 'High Value', trigger: 'Invoices >$5,000', tier1: 'Dept Manager', tier2: 'GM', final: 'Accounting', threshold: '$5,000', active: true },
  { name: 'Emergency Purchase', trigger: 'Emergency PO type', tier1: 'GM', tier2: 'Director', final: 'Accounting', threshold: '$500', active: false },
];

const PIPELINE = [
  { id: 'INV-1041', vendor: 'Sysco Foods', received: '✓', ocr: '✓', gl: '✓', match: '⚠', routed: '—', status: 'MATCHING' },
  { id: 'INV-1043', vendor: 'Maintenance Pro', received: '✓', ocr: '✓', gl: '✗', match: '—', routed: '—', status: 'GL_ERROR' },
  { id: 'INV-1044', vendor: 'Golf Supply Co', received: '✓', ocr: '✓', gl: '✓', match: '✓', routed: '✓', status: 'COMPLETE' },
  { id: 'INV-1046', vendor: 'Greenscape Ltd', received: '✓', ocr: '✓', gl: '✓', match: '✓', routed: '✓', status: 'COMPLETE' },
];

const TABS = ['Invoice Portal', 'Approval Workflow', 'Exception Dashboard', 'AI Processing'];

const confidenceBadge = (v: number) => {
  if (v >= 90) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{v}%</span>;
  if (v >= 70) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">{v}%</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{v}%</span>;
};

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-700', PAID: 'bg-blue-100 text-blue-700',
    NEEDS_REVIEW: 'bg-red-100 text-red-700', PENDING_AI: 'bg-yellow-100 text-yellow-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] ?? 'bg-gray-100 text-gray-600'}`}>{s.replace('_', ' ')}</span>;
};

export default function AccountsPayablePage() {
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<ApInvoice[]>([]);
  const [summary, setSummary] = useState<ApSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch('/api/finance/ap/invoices', { headers }).then(r => r.json()),
      fetch('/api/finance/ap/summary',  { headers }).then(r => r.json()),
    ]).then(([inv, sum]) => {
      setInvoices(Array.isArray(inv) ? inv : []);
      setSummary(sum);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const INVOICES = invoices; // alias for existing code below
  const filtered = filter === 'All' ? INVOICES
    : filter === 'Pending AI' ? INVOICES.filter(i => i.status === 'PENDING_AI')
    : filter === 'Needs Review' ? INVOICES.filter(i => i.status === 'NEEDS_REVIEW')
    : filter === 'Approved' ? INVOICES.filter(i => i.status === 'APPROVED')
    : INVOICES.filter(i => i.status === 'PAID');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Payable</h1>
          <p className="text-sm text-gray-500 mt-0.5">Centralized invoice portal · AI processing · Approval workflows</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Upload className="w-4 h-4" /> Upload Invoice
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* TAB 0 — Invoice Portal */}
      {tab === 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Outstanding', value: summary ? fmt(summary.totalOutstanding) : '—', sub: 'unpaid AP balance', icon: Clock, color: 'blue' },
              { label: 'Total Paid', value: summary ? fmt(summary.totalPaid) : '—', sub: 'closed invoices', icon: CheckCircle, color: 'green' },
              { label: 'Overdue', value: summary ? String(summary.overdueCount) : '—', sub: 'past due date', icon: AlertTriangle, color: 'red' },
              { label: 'Invoice Count', value: summary ? String(summary.invoiceCount) : '—', sub: 'AP invoices from POs', icon: FileText, color: 'purple' },
            ].map(k => (
              <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className={`text-2xl font-bold text-${k.color}-600`}>{k.value}</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">{k.label}</p>
                <p className="text-xs text-gray-400">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {['All', 'Pending AI', 'Needs Review', 'Approved', 'Paid'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Invoice table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading invoices…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No AP invoices yet. Submit and receive a PO to generate an invoice.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Vendor', 'Invoice #', 'Date', 'Due Date', 'Amount', 'Tax', 'PO #', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{inv.vendor}</td>
                      <td className="px-4 py-3 text-blue-600 font-mono text-xs">{inv.invoiceNo}</td>
                      <td className="px-4 py-3 text-gray-500">{inv.date}</td>
                      <td className="px-4 py-3 text-gray-500">{inv.dueDate}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(Number(inv.amount))}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(Number(inv.tax))}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-green-600 font-medium">{inv.poNumber}</span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {inv.status === 'PENDING' && (
                            <button className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100">Pay</button>
                          )}
                          <button className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2 py-1 rounded hover:bg-gray-100">
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* TAB 1 — Approval Workflow */}
      {tab === 1 && (
        <div className="space-y-6">
          {/* Stepper example */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Active Approval — INV-1041 (Sysco Foods, {fmt(12400)})</h3>
            <div className="flex items-center gap-0">
              {['Ordered By\nJ. Martinez', 'Dept Manager\nS. Thompson ✓', 'GM\nPending', 'Accounting\nWaiting'].map((step, i) => (
                <div key={i} className="flex items-center">
                  <div className={`flex flex-col items-center ${i < 2 ? 'text-green-600' : i === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i < 2 ? 'bg-green-100 border-green-500' : i === 2 ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'}`}>
                      {i < 2 ? '✓' : i + 1}
                    </div>
                    <p className="text-xs text-center mt-1 whitespace-pre-line leading-tight">{step}</p>
                  </div>
                  {i < 3 && <div className={`h-0.5 w-16 mx-1 mt-[-12px] ${i < 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Rules config */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Approval Rules</h3>
              <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="w-4 h-4" /> Add Rule
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Rule Name', 'Trigger', 'Tier 1', 'Tier 2', 'Final (Accounting)', 'Threshold', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {RULES.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.trigger}</td>
                    <td className="px-4 py-3 text-gray-700">{r.tier1}</td>
                    <td className="px-4 py-3 text-gray-500">{r.tier2}</td>
                    <td className="px-4 py-3 text-gray-700">Accounting</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.threshold}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2 — Exception Dashboard */}
      {tab === 2 && (
        <div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
            <strong>32 exceptions</strong> require attention — review and resolve to keep the AP queue clean.
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Exception Type', 'Description', 'Count', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {EXCEPTIONS.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{e.type}</td>
                    <td className="px-4 py-3 text-gray-600">{e.desc}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                        ${e.color === 'red' ? 'bg-red-100 text-red-700' : e.color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {e.count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100">
                        Review Queue
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3 — AI Processing */}
      {tab === 3 && (
        <div className="space-y-6">
          {/* Pipeline viz */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-4">AI Processing Pipeline</h3>
            <div className="flex items-center justify-between">
              {['Receive', 'OCR Extract', 'GL Code', 'PO Match', 'Route', 'Complete'].map((step, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2
                      ${i === 5 ? 'bg-green-100 border-green-500 text-green-700' : 'bg-blue-100 border-blue-400 text-blue-700'}`}>
                      {i + 1}
                    </div>
                    <p className="text-xs text-center text-gray-600 mt-1 w-16">{step}</p>
                  </div>
                  {i < 5 && <div className="h-0.5 w-8 bg-blue-200 mx-1 mt-[-16px]" />}
                </div>
              ))}
            </div>
          </div>

          {/* Processing log */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-700">Recent Processing Log</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Invoice #', 'Vendor', 'Received', 'OCR', 'GL Code', 'PO Match', 'Routed', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {PIPELINE.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{p.id}</td>
                    <td className="px-4 py-3 text-gray-800">{p.vendor}</td>
                    {[p.received, p.ocr, p.gl, p.match, p.routed].map((v, j) => (
                      <td key={j} className={`px-4 py-3 font-bold ${v === '✓' ? 'text-green-600' : v === '✗' ? 'text-red-500' : v === '⚠' ? 'text-yellow-500' : 'text-gray-300'}`}>{v}</td>
                    ))}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                        ${p.status === 'COMPLETE' ? 'bg-green-100 text-green-700' : p.status === 'GL_ERROR' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upload Invoice</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center bg-blue-50 mb-4">
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Drag & drop invoice PDF here</p>
              <p className="text-xs text-gray-400 mt-1">or</p>
              <button className="mt-2 text-sm text-blue-600 font-medium underline">Browse files</button>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Or forward vendor email to:</label>
              <div className="bg-gray-100 rounded-lg px-3 py-2 font-mono text-sm text-gray-700 select-all">
                ap-inbox@procurex.io
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Upload & Process</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
