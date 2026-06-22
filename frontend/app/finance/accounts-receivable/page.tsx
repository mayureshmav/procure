'use client';
import { useState } from 'react';
import { Plus, Send, XCircle, DollarSign, AlertTriangle } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const INVOICES = [
  { id: 'AR-2041', customer: 'Riverside Club', date: '2026-06-01', due: '2026-07-01', amount: 6000, tax: 300, status: 'SENT' },
  { id: 'AR-2042', customer: 'Greenway Partners', date: '2026-06-05', due: '2026-07-05', amount: 17500, tax: 875, status: 'PARTIAL' },
  { id: 'AR-2043', customer: 'Sunrise Hospitality', date: '2026-05-01', due: '2026-06-01', amount: 10200, tax: 510, status: 'OVERDUE' },
  { id: 'AR-2044', customer: 'Metro Events Co', date: '2026-06-10', due: '2026-07-10', amount: 4500, tax: 225, status: 'DRAFT' },
  { id: 'AR-2045', customer: 'Lakeview Resort', date: '2026-05-15', due: '2026-06-15', amount: 8200, tax: 410, status: 'PAID' },
  { id: 'AR-2046', customer: 'Pinnacle Golf', date: '2026-05-20', due: '2026-06-20', amount: 3100, tax: 155, status: 'OVERDUE' },
];

const AGING = [
  { customer: 'Riverside Club', current: 4200, d30: 1800, d60: 0, d90: 0, d90p: 0 },
  { customer: 'Greenway Partners', current: 12000, d30: 3400, d60: 2100, d90: 0, d90p: 0 },
  { customer: 'Sunrise Hospitality', current: 0, d30: 0, d60: 5600, d90: 3200, d90p: 1400 },
  { customer: 'Metro Events Co', current: 4500, d30: 0, d60: 0, d90: 0, d90p: 0 },
  { customer: 'Pinnacle Golf', current: 0, d30: 0, d60: 3100, d90: 0, d90p: 0 },
];

const REMINDERS = [
  { trigger: '3 days before due', action: 'Friendly reminder email', channel: 'Email', active: true },
  { trigger: 'On due date', action: 'Payment due notification + invoice PDF', channel: 'Email', active: true },
  { trigger: '7 days overdue', action: 'Follow-up email + in-app alert to AR team', channel: 'Email + In-App', active: true },
  { trigger: '30 days overdue', action: 'Formal demand notice; flag account on hold', channel: 'Email', active: false },
  { trigger: '60+ days overdue', action: 'Escalate to collections; suspend credit terms', channel: 'Email + SMS', active: false },
];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700', SENT: 'bg-blue-100 text-blue-700',
    PARTIAL: 'bg-yellow-100 text-yellow-700', OVERDUE: 'bg-red-100 text-red-700',
    DRAFT: 'bg-gray-100 text-gray-600',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] ?? ''}`}>{s}</span>;
};

const TABS = ['Customer Invoices', 'AR Aging', 'Reminder Schedule'];

export default function AccountsReceivablePage() {
  const [tab, setTab] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [toggles, setToggles] = useState(REMINDERS.map(r => r.active));

  const totals = { current: 20700, d30: 5200, d60: 10800, d90: 3200, d90p: 1400 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Receivable</h1>
          <p className="text-sm text-gray-500 mt-0.5">Customer invoicing · AR aging · Automated reminders</p>
        </div>
        {tab === 0 && (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* TAB 0 — Customer Invoices */}
      {tab === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Customer', 'Invoice #', 'Invoice Date', 'Due Date', 'Amount', 'Tax', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {INVOICES.map(inv => (
                <tr key={inv.id} className={`hover:bg-gray-50 ${inv.status === 'OVERDUE' ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.customer}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{inv.id}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.date}</td>
                  <td className={`px-4 py-3 ${inv.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{inv.due}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(inv.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(inv.tax)}</td>
                  <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {inv.status === 'DRAFT' && (
                        <button className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100">
                          <Send className="w-3 h-3" /> Send
                        </button>
                      )}
                      {['SENT', 'PARTIAL', 'OVERDUE'].includes(inv.status) && (
                        <button className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100">
                          <DollarSign className="w-3 h-3" /> Record
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

      {/* TAB 1 — AR Aging */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Current', value: totals.current, color: 'green' },
              { label: '1–30 Days', value: totals.d30, color: 'blue' },
              { label: '31–60 Days', value: totals.d60, color: 'yellow' },
              { label: '61–90 Days', value: totals.d90, color: 'orange' },
              { label: '>90 Days', value: totals.d90p, color: 'red' },
            ].map(k => (
              <div key={k.label} className={`bg-white border rounded-xl p-3 border-${k.color}-200`}>
                <p className={`text-xl font-bold text-${k.color}-600`}>{fmt(k.value)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Customer', 'Current', '1–30 Days', '31–60 Days', '61–90 Days', '>90 Days', 'Total', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {AGING.map((a, i) => {
                  const total = a.current + a.d30 + a.d60 + a.d90 + a.d90p;
                  const isLate = a.d60 > 0 || a.d90 > 0 || a.d90p > 0;
                  return (
                    <tr key={i} className={`hover:bg-gray-50 ${isLate ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{a.customer}</td>
                      <td className="px-4 py-3 text-green-700">{fmt(a.current)}</td>
                      <td className="px-4 py-3">{fmt(a.d30)}</td>
                      <td className={`px-4 py-3 ${a.d60 > 0 ? 'text-amber-600 font-semibold' : ''}`}>{fmt(a.d60)}</td>
                      <td className={`px-4 py-3 ${a.d90 > 0 ? 'text-orange-600 font-semibold' : ''}`}>{fmt(a.d90)}</td>
                      <td className={`px-4 py-3 ${a.d90p > 0 ? 'text-red-600 font-bold' : ''}`}>{fmt(a.d90p)}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(total)}</td>
                      <td className="px-4 py-3">
                        {isLate && (
                          <button className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded hover:bg-amber-100">
                            <Send className="w-3 h-3" /> Reminder
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-blue-50 font-semibold border-t-2 border-blue-200">
                  <td className="px-4 py-3 text-blue-900">Total</td>
                  {[totals.current, totals.d30, totals.d60, totals.d90, totals.d90p].map((v, i) => (
                    <td key={i} className="px-4 py-3 text-blue-900">{fmt(v)}</td>
                  ))}
                  <td className="px-4 py-3 text-blue-900">{fmt(totals.current + totals.d30 + totals.d60 + totals.d90 + totals.d90p)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Rows highlighted in amber have balances over 60 days. Balances over 90 days trigger automatic Finance Manager notification.
          </div>
        </div>
      )}

      {/* TAB 2 — Reminder Schedule */}
      {tab === 2 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Trigger', 'Action', 'Channel', 'Active', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {REMINDERS.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.trigger}</td>
                  <td className="px-4 py-3 text-gray-600">{r.action}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.channel}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setToggles(t => t.map((v, j) => j === i ? !v : v))}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${toggles[i] ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${toggles[i] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-blue-600 underline">Edit Template</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Invoice Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Customer Invoice</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[['Customer', 'text', 'Select customer…'],['Invoice Date', 'date', ''],['Due Date', 'date', ''],['Currency', 'text', 'USD']].map(([label, type, ph]) => (
                <div key={label as string}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type as string} placeholder={ph as string} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Line Items</label>
                <button className="text-xs text-blue-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Line</button>
              </div>
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>{['Description', 'Qty', 'Unit Price', 'Tax Code', 'Total'].map(h => <th key={h} className="text-left px-3 py-2 font-medium text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    {['Golf Course Usage — June', '1', '$4,500.00', 'GST', '$4,500.00'].map((v, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700">{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Send Method</label>
              <div className="flex gap-4">
                {['Email PDF', 'Portal', 'Print'].map(m => (
                  <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" defaultChecked={m === 'Email PDF'} className="rounded" /> {m}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Save Draft</button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create & Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
