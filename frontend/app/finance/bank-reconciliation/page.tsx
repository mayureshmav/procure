'use client';
import { useState } from 'react';
import { CheckCircle, AlertTriangle, Download, Zap, Info } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const BANK_TXN = [
  { date: '2026-06-20', desc: 'DEP — Golf Revenue', amount: 14200, type: 'credit', status: 'matched' },
  { date: '2026-06-19', desc: 'CHQ #1041 — Sysco Foods', amount: -12400, type: 'debit', status: 'matched' },
  { date: '2026-06-18', desc: 'ACH — Office Depot', amount: -890, type: 'debit', status: 'matched' },
  { date: '2026-06-17', desc: 'CHQ #1042 — Maintenance Pro', amount: -3200, type: 'debit', status: 'suggested' },
  { date: '2026-06-15', desc: 'Bank Fees', amount: -45, type: 'debit', status: 'unmatched' },
  { date: '2026-06-14', desc: 'DEP — F&B Sales', amount: 8900, type: 'credit', status: 'matched' },
];

const GL_TXN = [
  { date: '2026-06-20', desc: 'Golf Revenue — daily deposit', amount: 14200, type: 'credit', status: 'matched' },
  { date: '2026-06-19', desc: 'AP Payment — Sysco Foods INV-1048', amount: -12400, type: 'debit', status: 'matched' },
  { date: '2026-06-18', desc: 'AP Payment — Office Depot INV-1042', amount: -890, type: 'debit', status: 'matched' },
  { date: '2026-06-17', desc: 'AP Payment — Maintenance Pro INV-1043', amount: -3100, type: 'debit', status: 'suggested' },
  { date: '2026-06-14', desc: 'F&B Revenue — daily deposit', amount: 8900, type: 'credit', status: 'matched' },
];

const HISTORY = [
  { period: 'May 2026', account: 'Checking #4521', open: 128940, close: 142380, variance: 0, by: 'J. Chen', date: '2026-06-01' },
  { period: 'Apr 2026', account: 'Checking #4521', open: 104200, close: 128940, variance: 0, by: 'J. Chen', date: '2026-05-02' },
  { period: 'Mar 2026', account: 'Checking #4521', open: 98500, close: 104200, variance: 12.5, by: 'K. Patel', date: '2026-04-01' },
  { period: 'Feb 2026', account: 'Checking #4521', open: 82000, close: 98500, variance: 0, by: 'J. Chen', date: '2026-03-01' },
  { period: 'Jan 2026', account: 'Savings #7893', open: 50000, close: 52400, variance: 0, by: 'J. Chen', date: '2026-02-02' },
  { period: 'Dec 2025', account: 'Checking #4521', open: 75000, close: 82000, variance: 0, by: 'K. Patel', date: '2026-01-03' },
];

const TABS = ['Reconciliation', 'History'];

export default function BankReconciliationPage() {
  const [tab, setTab] = useState(0);
  const [started, setStarted] = useState(false);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());

  const matchedCount = BANK_TXN.filter(t => t.status === 'matched').length;
  const variance = -430;

  const statusIcon = (s: string, confirmed: boolean) => {
    if (s === 'matched') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Matched</span>;
    if (s === 'suggested' && confirmed) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Confirmed</span>;
    if (s === 'suggested') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Suggested</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Unmatched</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Automated matching · Outstanding cheque tracking · Variance resolution</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {/* TAB 0 — Reconciliation */}
      {tab === 0 && (
        <>
          {/* Account + period selectors */}
          <div className="flex gap-3 items-center mb-5">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option>Checking Account #4521</option>
              <option>Savings Account #7893</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              {['June 2026','May 2026','April 2026'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Bank Balance', value: fmt(142380), color: 'blue', sub: 'via live feed' },
              { label: 'GL Balance', value: fmt(141950), color: 'blue', sub: 'last posting' },
              { label: 'Variance', value: fmt(430), color: 'amber', sub: '3 unmatched items' },
              { label: 'Unmatched', value: '3', color: 'red', sub: 'require action' },
              { label: 'Last Rec', value: 'Jun 15', color: 'green', sub: 'next due: Jun 30' },
            ].map(k => (
              <div key={k.label} className={`bg-white border rounded-xl p-3 border-${k.color}-200`}>
                <p className={`text-xl font-bold text-${k.color}-600`}>{k.value}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{k.label}</p>
                <p className="text-xs text-gray-400">{k.sub}</p>
              </div>
            ))}
          </div>

          {!started ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <Zap className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-1">Ready to reconcile June 2026</p>
              <p className="text-sm text-gray-500 mb-4">Bank feed updated automatically. {matchedCount} of {BANK_TXN.length} items auto-matched.</p>
              <button onClick={() => setStarted(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Start Reconciliation
              </button>
            </div>
          ) : (
            <>
              {/* AI explainer */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-800">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                <span><strong>AI Variance Explainer:</strong> 3 outstanding cheques not yet cleared: CHQ #1042 ($210), CHQ #1043 ($120), CHQ #1044 ($100). Total outstanding: $430. This is a normal timing difference — no action required if cheques were issued within the last 7 days.</span>
              </div>

              {/* Two panels */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Bank */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Bank Statement — Checking #4521
                  </div>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-gray-100">
                      {['Date','Description','Amount','Status'].map(h => <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {BANK_TXN.map((t, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-500">{t.date.slice(5)}</td>
                          <td className="px-3 py-2 text-gray-700">{t.desc}</td>
                          <td className={`px-3 py-2 font-semibold ${t.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>{fmt(Math.abs(t.amount))}</td>
                          <td className="px-3 py-2">
                            {t.status === 'suggested' ? (
                              <button onClick={() => setConfirmed(c => { const n = new Set(c); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${confirmed.has(i) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700 cursor-pointer hover:bg-yellow-200'}`}>
                                {confirmed.has(i) ? 'Confirmed ✓' : 'Suggest — Confirm'}
                              </button>
                            ) : statusIcon(t.status, false)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* GL */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> GL Transactions
                  </div>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-gray-100">
                      {['Date','Description','Amount','Status'].map(h => <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {GL_TXN.map((t, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-500">{t.date.slice(5)}</td>
                          <td className="px-3 py-2 text-gray-700">{t.desc}</td>
                          <td className={`px-3 py-2 font-semibold ${t.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>{fmt(Math.abs(t.amount))}</td>
                          <td className="px-3 py-2">{statusIcon(t.status, false)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary bar */}
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4">
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-500">Matched: <strong className="text-green-600">{fmt(44490)}</strong></span>
                  <span className="text-gray-500">Unmatched: <strong className="text-red-500">{fmt(3245)}</strong></span>
                  <span className="text-gray-500">Remaining variance: <strong className="text-amber-600">{fmt(Math.abs(variance))}</strong></span>
                </div>
                <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                  Complete Reconciliation (variance ≠ $0)
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* TAB 1 — History */}
      {tab === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Period', 'Account', 'Opening Balance', 'Closing Balance', 'Variance', 'Completed By', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {HISTORY.map((h, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{h.period}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{h.account}</td>
                  <td className="px-4 py-3">{fmt(h.open)}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(h.close)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.variance === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {h.variance === 0 ? '$0.00' : fmt(h.variance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{h.by}</td>
                  <td className="px-4 py-3 text-gray-500">{h.date}</td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                      <Download className="w-3 h-3" /> Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
