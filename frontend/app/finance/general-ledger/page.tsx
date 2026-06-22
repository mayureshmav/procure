'use client';
import { useState } from 'react';
import { Plus, XCircle, ChevronDown, ChevronRight, Info } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const COA = [
  { num: '1000', name: 'Cash & Bank', type: 'Asset', sub: 'Current Asset', report: 'Balance Sheet — Current Assets', balance: 'Debit', active: true },
  { num: '1100', name: 'Accounts Receivable', type: 'Asset', sub: 'Current Asset', report: 'Balance Sheet — Current Assets', balance: 'Debit', active: true },
  { num: '1200', name: 'Inventory', type: 'Asset', sub: 'Current Asset', report: 'Balance Sheet — Current Assets', balance: 'Debit', active: true },
  { num: '1500', name: 'Equipment', type: 'Asset', sub: 'Fixed Asset', report: 'Balance Sheet — Fixed Assets', balance: 'Debit', active: true },
  { num: '1600', name: 'Accumulated Depreciation', type: 'Asset', sub: 'Contra Asset', report: 'Balance Sheet — Fixed Assets', balance: 'Credit', active: true },
  { num: '2000', name: 'Accounts Payable', type: 'Liability', sub: 'Current Liability', report: 'Balance Sheet — Current Liabilities', balance: 'Credit', active: true },
  { num: '2100', name: 'GST / Tax Payable', type: 'Liability', sub: 'Current Liability', report: 'Balance Sheet — Current Liabilities', balance: 'Credit', active: true },
  { num: '3000', name: 'Retained Earnings', type: 'Equity', sub: 'Equity', report: 'Balance Sheet — Equity', balance: 'Credit', active: true },
  { num: '4000', name: 'Food & Beverage Revenue', type: 'Revenue', sub: 'Operating Revenue', report: 'P&L — Revenue', balance: 'Credit', active: true },
  { num: '4100', name: 'Golf Revenue', type: 'Revenue', sub: 'Operating Revenue', report: 'P&L — Revenue', balance: 'Credit', active: true },
  { num: '4200', name: 'Tennis Revenue', type: 'Revenue', sub: 'Operating Revenue', report: 'P&L — Revenue', balance: 'Credit', active: true },
  { num: '5000', name: 'Cost of Goods Sold', type: 'Expense', sub: 'COGS', report: 'P&L — Cost of Goods Sold', balance: 'Debit', active: true },
  { num: '6000', name: 'Salaries & Wages', type: 'Expense', sub: 'Operating', report: 'P&L — Operating Expenses', balance: 'Debit', active: true },
  { num: '6100', name: 'Utilities', type: 'Expense', sub: 'Operating', report: 'P&L — Operating Expenses', balance: 'Debit', active: true },
  { num: '6200', name: 'Rent & Occupancy', type: 'Expense', sub: 'Operating', report: 'P&L — Operating Expenses', balance: 'Debit', active: true },
  { num: '7000', name: 'Depreciation', type: 'Expense', sub: 'Non-Cash', report: 'P&L — Operating Expenses', balance: 'Debit', active: true },
];

const JOURNALS = [
  { id: 'JE-0061', date: '2026-06-30', desc: 'Month-end depreciation accrual', debit: 8200, credit: 8200, by: 'J. Chen', status: 'POSTED',
    lines: [{ acct: '7000 Depreciation', dept: 'Operations', dr: 8200, cr: 0 }, { acct: '1600 Accum. Depreciation', dept: 'Operations', dr: 0, cr: 8200 }] },
  { id: 'JE-0060', date: '2026-06-28', desc: 'Payroll June — Week 4', debit: 24500, credit: 24500, by: 'J. Chen', status: 'POSTED',
    lines: [{ acct: '6000 Salaries', dept: 'All', dr: 24500, cr: 0 }, { acct: '1000 Cash & Bank', dept: 'All', dr: 0, cr: 24500 }] },
  { id: 'JE-0059', date: '2026-06-25', desc: 'GST adjustment Q2', debit: 1840, credit: 1840, by: 'K. Patel', status: 'POSTED',
    lines: [{ acct: '2100 GST Payable', dept: '—', dr: 1840, cr: 0 }, { acct: '1000 Cash & Bank', dept: '—', dr: 0, cr: 1840 }] },
  { id: 'JE-0058', date: '2026-06-20', desc: 'Prepaid insurance amortization', debit: 3100, credit: 3100, by: 'J. Chen', status: 'REVERSED',
    lines: [] },
  { id: 'JE-0057', date: '2026-06-15', desc: 'Revenue accrual — tennis lessons', debit: 5600, credit: 5600, by: 'K. Patel', status: 'POSTED',
    lines: [] },
  { id: 'JE-0056', date: '2026-06-10', desc: 'Draft — utilities correction', debit: 410, credit: 410, by: 'J. Chen', status: 'DRAFT',
    lines: [] },
];

const RANGES = [
  { range: '1000–1999', type: 'Asset', section: 'Balance Sheet — Current Assets', sign: 'Debit +', examples: '1000 Cash, 1100 AR, 1200 Inventory' },
  { range: '2000–2499', type: 'Asset', section: 'Balance Sheet — Fixed Assets', sign: 'Debit +', examples: '2000 Equipment, 2100 Vehicles' },
  { range: '3000–3499', type: 'Liability', section: 'Balance Sheet — Current Liabilities', sign: 'Credit +', examples: '3000 AP, 3100 Tax Payable' },
  { range: '3500–3999', type: 'Liability', section: 'Balance Sheet — Long-term Liabilities', sign: 'Credit +', examples: '3500 Long-term Debt' },
  { range: '4000–4999', type: 'Equity', section: 'Balance Sheet — Equity', sign: 'Credit +', examples: '4000 Retained Earnings' },
  { range: '5000–5999', type: 'Revenue', section: 'P&L — Revenue', sign: 'Credit +', examples: '5000 F&B Revenue, 5100 Golf Revenue' },
  { range: '6000–7999', type: 'Expense', section: 'P&L — Operating Expenses', sign: 'Debit +', examples: '6000 Salaries, 6100 Utilities' },
  { range: '8000–8999', type: 'Expense', section: 'P&L — Other Expenses', sign: 'Debit +', examples: '8000 Interest, 8100 Depreciation' },
];

const typeColor = (t: string) => ({ Asset: 'bg-blue-100 text-blue-700', Liability: 'bg-red-100 text-red-700', Equity: 'bg-purple-100 text-purple-700', Revenue: 'bg-green-100 text-green-700', Expense: 'bg-amber-100 text-amber-700' }[t] ?? 'bg-gray-100 text-gray-600');
const statusColor = (s: string) => ({ POSTED: 'bg-green-100 text-green-700', DRAFT: 'bg-gray-100 text-gray-600', REVERSED: 'bg-red-100 text-red-700' }[s] ?? '');

const TABS = ['Chart of Accounts', 'Journal Entries', 'Range → Report Mapping'];

export default function GeneralLedgerPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showJE, setShowJE] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredCOA = COA.filter(a =>
    (typeFilter === 'All' || a.type === typeFilter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.num.includes(search))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
          <p className="text-sm text-gray-500 mt-0.5">Chart of accounts · Journal entries · Auto-populating report mapping</p>
        </div>
        {tab === 0 && <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><Plus className="w-4 h-4" /> Add Account</button>}
        {tab === 1 && <button onClick={() => setShowJE(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><Plus className="w-4 h-4" /> New Entry</button>}
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {/* TAB 0 — Chart of Accounts */}
      {tab === 0 && (
        <>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-500" />
            Account ranges auto-populate financial reports — adding a new account in range 5xxx–7xxx automatically appears in P&L Expenses. No manual report maintenance needed.
          </div>
          <div className="flex gap-3 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts…"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              {['All', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Acct #', 'Account Name', 'Type', 'Sub-Type', 'Report Section', 'Normal Balance', 'Active'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCOA.map(a => (
                  <tr key={a.num} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-700">{a.num}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColor(a.type)}`}>{a.type}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{a.sub}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{a.report}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.balance}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 1 — Journal Entries */}
      {tab === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['', 'Date', 'Ref #', 'Description', 'Debit', 'Credit', 'Posted By', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {JOURNALS.map(j => (
                <>
                  <tr key={j.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === j.id ? null : j.id)}>
                    <td className="px-4 py-3 text-gray-400">{expanded === j.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                    <td className="px-4 py-3 text-gray-600">{j.date}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{j.id}</td>
                    <td className="px-4 py-3 text-gray-800">{j.desc}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{fmt(j.debit)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{fmt(j.credit)}</td>
                    <td className="px-4 py-3 text-gray-500">{j.by}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(j.status)}`}>{j.status}</span></td>
                  </tr>
                  {expanded === j.id && j.lines.length > 0 && (
                    <tr key={j.id + '-exp'}>
                      <td colSpan={8} className="px-8 py-3 bg-blue-50">
                        <table className="w-full text-xs">
                          <thead><tr className="text-gray-500">{['Account', 'Department', 'Debit', 'Credit'].map(h => <th key={h} className="text-left py-1 font-medium">{h}</th>)}</tr></thead>
                          <tbody>{j.lines.map((l, i) => (
                            <tr key={i}><td className="py-1 font-mono text-blue-700">{l.acct}</td><td className="py-1 text-gray-600">{l.dept}</td><td className="py-1">{l.dr > 0 ? fmt(l.dr) : '—'}</td><td className="py-1">{l.cr > 0 ? fmt(l.cr) : '—'}</td></tr>
                          ))}</tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2 — Range Mapping */}
      {tab === 2 && (
        <>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-green-800">
            <Info className="w-4 h-4 flex-shrink-0 text-green-600" />
            This mapping drives Smart Financial Reporting. Every account created within a range auto-populates the correct statement section — no manual report editing.
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Account Range', 'Account Type', 'Report Section', 'Sign Convention', 'Example Accounts'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {RANGES.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{r.range}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColor(r.type)}`}>{r.type}</span></td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.section}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.sign}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 italic">{r.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Account Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add GL Account</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Account Number', 'text', '6300'],['Account Name', 'text', 'e.g. Maintenance & Repairs']].map(([l, t, p]) => (
                <div key={l as string} className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <input type={t as string} placeholder={p as string} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              ))}
              {[['Account Type', ['Asset','Liability','Equity','Revenue','Expense']], ['Sub-Type', ['Current Asset','Fixed Asset','Current Liability','Operating Revenue','COGS','Operating Expense']], ['Department', ['All','F&B','Golf','Tennis','Admin','Maintenance']], ['Currency', ['USD','CAD','GBP','EUR']]].map(([l, opts]) => (
                <div key={l as string}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input type="checkbox" id="active" defaultChecked className="rounded" />
              <label htmlFor="active" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
