'use client';
import { useState } from 'react';
import { Plus, XCircle, CheckCircle, Shield, Lock, Info } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const INVOICES_READY = [
  { vendor: 'Sysco Foods', invoice: 'INV-1041', amount: 12400, due: '2026-06-25', discount: '$124 if paid today' },
  { vendor: 'Office Depot', invoice: 'INV-1042', amount: 890, due: '2026-06-28', discount: null },
  { vendor: 'Maintenance Pro', invoice: 'INV-1043', amount: 3200, due: '2026-07-01', discount: null },
  { vendor: 'Golf Supply Co', invoice: 'INV-1044', amount: 5780, due: '2026-07-05', discount: '$86.70 if paid today' },
  { vendor: 'Utilities Corp', invoice: 'INV-1045', amount: 2410, due: '2026-06-30', discount: null },
];

const RUNS = [
  { id: 'PR-0021', date: '2026-06-20', account: 'Checking #4521', invoices: 5, total: 24680, method: 'ACH', status: 'COMPLETED', sigs: ['J. Chen ✓', 'M. Davis ✓'] },
  { id: 'PR-0020', date: '2026-06-13', account: 'Checking #4521', invoices: 3, total: 11200, method: 'Cheque', status: 'COMPLETED', sigs: ['J. Chen ✓', 'M. Davis ✓'] },
  { id: 'PR-0019', date: '2026-06-06', account: 'Checking #4521', invoices: 7, total: 38900, method: 'ACH', status: 'COMPLETED', sigs: ['J. Chen ✓', 'M. Davis ✓'] },
  { id: 'PR-0022', date: '2026-06-22', account: 'Checking #4521', invoices: 4, total: 18270, method: 'ACH', status: 'PENDING_APPROVAL', sigs: ['J. Chen ✓', 'M. Davis — Pending'] },
  { id: 'PR-0023', date: '2026-06-23', account: 'Checking #4521', invoices: 2, total: 6100, method: 'EFT', status: 'DRAFT', sigs: [] },
];

const AUDIT = [
  { ts: '2026-06-22 09:14', action: 'Payment Created', run: 'PR-0022', user: 'J. Chen', amount: 18270, detail: 'Created with 4 invoices', device: 'Chrome/macOS' },
  { ts: '2026-06-22 09:45', action: 'Step 1 Approved', run: 'PR-0022', user: 'J. Chen', amount: 18270, detail: 'Finance Manager signature', device: 'Mobile/iOS' },
  { ts: '2026-06-20 11:02', action: 'Payment Released', run: 'PR-0021', user: 'System', amount: 24680, detail: 'ACH batch submitted', device: 'System' },
  { ts: '2026-06-20 10:55', action: 'Step 2 Approved', run: 'PR-0021', user: 'M. Davis', amount: 24680, detail: 'GM signature — biometric', device: 'Mobile/iOS' },
  { ts: '2026-06-20 10:30', action: 'Step 1 Approved', run: 'PR-0021', user: 'J. Chen', amount: 24680, detail: 'Finance Manager signature', device: 'Chrome/macOS' },
  { ts: '2026-06-20 09:00', action: 'Payment Created', run: 'PR-0021', user: 'J. Chen', amount: 24680, detail: 'Created with 5 invoices', device: 'Chrome/macOS' },
  { ts: '2026-06-13 14:22', action: 'Payment Released', run: 'PR-0020', user: 'System', amount: 11200, detail: 'Cheques printed & mailed', device: 'System' },
  { ts: '2026-06-13 14:15', action: 'Step 2 Approved', run: 'PR-0020', user: 'M. Davis', amount: 11200, detail: 'GM signature', device: 'Mobile/iOS' },
];

const actionColor = (a: string) => {
  if (a.includes('Created')) return 'bg-blue-100 text-blue-700';
  if (a.includes('Approved') || a.includes('Released')) return 'bg-green-100 text-green-700';
  if (a.includes('Rejected') || a.includes('Reversed')) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};

const statusColor = (s: string) => ({
  COMPLETED: 'bg-green-100 text-green-700', PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  DRAFT: 'bg-gray-100 text-gray-600', RELEASED: 'bg-blue-100 text-blue-700',
}[s] ?? 'bg-gray-100 text-gray-600');

const TABS = ['Payment Run', 'Digital Signatures', 'Audit Trail'];

export default function PaymentsPage() {
  const [tab, setTab] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set([0, 1, 2]));
  const [signed, setSigned] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const total = INVOICES_READY.filter((_, i) => selected.has(i)).reduce((a, b) => a + b.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Payment runs · 2-step digital signatures · Immutable audit trail</p>
        </div>
        {tab === 0 && (
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Payment Run
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {/* TAB 0 — Payment Run */}
      {tab === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Run #', 'Date', 'Bank Account', '# Invoices', 'Total Amount', 'Method', 'Status', 'Authorisations'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RUNS.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{r.id}</td>
                  <td className="px-4 py-3 text-gray-600">{r.date}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.account}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{r.invoices}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(r.total)}</td>
                  <td className="px-4 py-3 text-gray-500">{r.method}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(r.status)}`}>{r.status.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {r.sigs.map((s, i) => <span key={i} className={`text-xs ${s.includes('✓') ? 'text-green-600' : 'text-amber-600'}`}>{s}</span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 1 — Digital Signatures */}
      {tab === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Pending Your Signature</h3>
          <div className="bg-white border border-yellow-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">PR-0022 — {fmt(18270)}</p>
                <p className="text-sm text-gray-500">4 invoices · ACH · Checking #4521 · Jun 22, 2026</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Pending Step 2</span>
            </div>

            {/* 2-step progress */}
            <div className="flex items-center gap-0 mb-5">
              {[{ label: 'Step 1\nFinance Manager', done: true, who: 'J. Chen' }, { label: 'Step 2\nGM / Director', done: signed, who: signed ? 'M. Davis' : 'Awaiting' }].map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className={`flex flex-col items-center ${s.done ? 'text-green-600' : 'text-blue-600'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${s.done ? 'bg-green-100 border-green-500' : 'bg-blue-50 border-blue-400'}`}>
                      {s.done ? <CheckCircle className="w-6 h-6 text-green-600" /> : <Shield className="w-6 h-6 text-blue-500" />}
                    </div>
                    <p className="text-xs text-center mt-1 whitespace-pre-line font-medium leading-tight">{s.label}</p>
                    <p className="text-xs text-gray-400">{s.who}</p>
                  </div>
                  {i < 1 && <div className={`h-0.5 w-16 mx-2 mt-[-20px] ${s.done ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {!signed && (
              <button onClick={() => setShowAuth(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                <Lock className="w-4 h-4" /> Sign & Approve as GM
              </button>
            )}
            {signed && <p className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Fully approved — payment will be released</p>}
          </div>

          <h3 className="font-semibold text-gray-700 mt-6">Completed Approvals</h3>
          {RUNS.filter(r => r.status === 'COMPLETED').map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{r.id} — {fmt(r.total)}</p>
                <p className="text-xs text-gray-500">{r.date} · {r.invoices} invoices · {r.method}</p>
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-green-600">
                {r.sigs.map((s, i) => <span key={i}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2 — Audit Trail */}
      {tab === 2 && (
        <>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-500" />
            All payment records are immutable. Entries cannot be deleted or modified. Any reversal creates a new counterpart record with a full audit reference.
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Timestamp', 'Action', 'Run #', 'User', 'Amount', 'Detail', 'Device'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {AUDIT.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.ts}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actionColor(a.action)}`}>{a.action}</span></td>
                    <td className="px-4 py-3 text-blue-600 font-mono text-xs">{a.run}</td>
                    <td className="px-4 py-3 text-gray-700">{a.user}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{fmt(a.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.detail}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{a.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Lock className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-1">Authenticate to Sign</h2>
            <p className="text-sm text-gray-500 mb-4">Confirm your identity to approve payment run PR-0022 for {fmt(18270)}</p>
            <button onClick={() => { setSigned(true); setShowAuth(false); setTab(1); }}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 mb-2">
              ✓ Confirm & Sign
            </button>
            <button onClick={() => setShowAuth(false)} className="w-full text-gray-500 text-sm hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {/* New Run Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Payment Run</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[['Payment Date','date'],['Bank Account','select']].map(([l, t]) => (
                <div key={l}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  {t === 'select' ? (
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                      <option>Checking #4521</option><option>Savings #7893</option>
                    </select>
                  ) : <input type={t} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />}
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
              <div className="flex gap-4">
                {['ACH', 'EFT', 'Cheque', 'Wire'].map(m => (
                  <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="method" defaultChecked={m === 'ACH'} /> {m}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Select Invoices</label>
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50"><tr>{['', 'Vendor', 'Invoice', 'Amount', 'Due', 'Early Pay'].map(h => <th key={h} className="text-left px-3 py-2 font-medium text-gray-500">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {INVOICES_READY.map((inv, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2"><input type="checkbox" checked={selected.has(i)} onChange={() => setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })} /></td>
                      <td className="px-3 py-2 font-medium text-gray-800">{inv.vendor}</td>
                      <td className="px-3 py-2 text-blue-600 font-mono">{inv.invoice}</td>
                      <td className="px-3 py-2 font-semibold">{fmt(inv.amount)}</td>
                      <td className="px-3 py-2 text-gray-500">{inv.due}</td>
                      <td className="px-3 py-2 text-green-600">{inv.discount ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-right text-sm font-semibold mt-2 text-gray-700">Total: {fmt(total)}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Proceed to Authorise</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
