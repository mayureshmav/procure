'use client';
import { useState } from 'react';
import { Download, Plus, XCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const pct = (v: number) => `${v.toFixed(1)}%`;

const PL = {
  revenue: [
    { name: 'Food & Beverage Revenue', curr: 184000, prev: 168000 },
    { name: 'Golf Revenue', curr: 92000, prev: 88500 },
    { name: 'Tennis Revenue', curr: 28000, prev: 24200 },
  ],
  cogs: [{ name: 'Cost of Goods Sold — F&B', curr: 73600, prev: 67200 }],
  opex: [
    { name: 'Salaries & Wages', curr: 98000, prev: 94000 },
    { name: 'Utilities', curr: 12400, prev: 11800 },
    { name: 'Rent & Occupancy', curr: 18000, prev: 18000 },
    { name: 'Depreciation', curr: 8200, prev: 8200 },
    { name: 'Marketing', curr: 6500, prev: 5900 },
    { name: 'Admin & General', curr: 14200, prev: 13100 },
  ],
  other: [{ name: 'Interest Expense', curr: 2400, prev: 2600 }],
};

const VENDORS = [
  { rank: 1, vendor: 'Sysco Foods', ytd: 142000, mtd: 24800, change: '+8%', invoices: 48 },
  { rank: 2, vendor: 'Maintenance Pro', ytd: 38400, mtd: 6200, change: '+3%', invoices: 24 },
  { rank: 3, vendor: 'Golf Supply Co', ytd: 29700, mtd: 5780, change: '-2%', invoices: 18 },
  { rank: 4, vendor: 'Office Depot', ytd: 12800, mtd: 890, change: '+1%', invoices: 32 },
  { rank: 5, vendor: 'Utilities Corp', ytd: 11200, mtd: 2410, change: '+5%', invoices: 12 },
];

const DEPTS = [
  { dept: 'Food & Beverage', budget: 180000, actual: 147600, pct: 82 },
  { dept: 'Golf Operations', budget: 95000, actual: 67450, pct: 71 },
  { dept: 'Administration', budget: 42000, actual: 39480, pct: 94 },
  { dept: 'Maintenance', budget: 38400, actual: 25730, pct: 67 },
  { dept: 'Tennis Program', budget: 22000, actual: 12100, pct: 55 },
];

const SCHEDULED = [
  { name: 'Monthly P&L', type: 'P&L', schedule: '1st of month, 7am', recipients: 'CFO, GM', last: '2026-06-01', next: '2026-07-01', status: 'ACTIVE' },
  { name: 'Weekly Spend Digest', type: 'Spend Analytics', schedule: 'Every Monday, 8am', recipients: 'Finance Team', last: '2026-06-17', next: '2026-06-24', status: 'ACTIVE' },
  { name: 'AP Aging', type: 'AP Aging', schedule: 'Daily, 8am', recipients: 'AP Manager', last: '2026-06-22', next: '2026-06-23', status: 'ACTIVE' },
  { name: 'Budget Variance', type: 'Budget Report', schedule: 'Every Friday, 5pm', recipients: 'GM, Dept Heads', last: '2026-06-20', next: '2026-06-27', status: 'PAUSED' },
];

const TABS = ['Report Builder', 'Spend Analytics', 'Scheduled Reports'];

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [reportType, setReportType] = useState('P&L');
  const [period, setPeriod] = useState('June');
  const [year, setYear] = useState('2026');
  const [comparison, setComparison] = useState('Prior Period');
  const [generated, setGenerated] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);

  const totalRevenue = PL.revenue.reduce((a, b) => a + b.curr, 0);
  const totalCOGS = PL.cogs.reduce((a, b) => a + b.curr, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalOpex = PL.opex.reduce((a, b) => a + b.curr, 0);
  const opIncome = grossProfit - totalOpex;
  const netIncome = opIncome - PL.other.reduce((a, b) => a + b.curr, 0);

  const variance = (curr: number, prev: number) => {
    const v = curr - prev;
    return <span className={`text-xs font-semibold ${v >= 0 ? 'text-green-600' : 'text-red-500'}`}>{v >= 0 ? '+' : ''}{fmt(v)}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Self-populating reports · Spend analytics · Scheduled delivery</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {/* TAB 0 — Report Builder */}
      {tab === 0 && (
        <div className="flex gap-5">
          {/* Config panel */}
          <div className="w-64 flex-shrink-0 space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Report Configuration</h3>
              {[
                ['Report Type', ['P&L', 'Balance Sheet', 'Trial Balance', 'Cash Flow'], reportType, setReportType],
                ['Period', ['January','February','March','April','May','June','July','August','September','October','November','December'], period, setPeriod],
                ['Year', ['2026','2025','2024'], year, setYear],
                ['Comparison', ['None','Prior Period','Prior Year','Budget'], comparison, setComparison],
              ].map(([label, opts, val, set]) => (
                <div key={label as string}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <select value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {[['Department', ['All Departments','Food & Beverage','Golf','Tennis','Admin']], ['Format', ['On-screen','PDF','Excel']]].map(([l, opts]) => (
                <div key={l as string}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <button onClick={() => setGenerated(true)} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Generate Report</button>
            </div>
          </div>

          {/* Report output */}
          <div className="flex-1">
            {generated && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Profit & Loss Statement</h3>
                    <p className="text-sm text-gray-500">{period} {year} vs Prior Period</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"><Download className="w-3 h-3" /> PDF</button>
                    <button className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"><Download className="w-3 h-3" /> Excel</button>
                  </div>
                </div>
                <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4">
                  New accounts auto-populate here based on account number range — no manual report editing needed.
                </div>

                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 font-semibold text-gray-700">Account</th>
                    <th className="text-right py-2 font-semibold text-gray-700">{period} {year}</th>
                    {comparison !== 'None' && <>
                      <th className="text-right py-2 font-semibold text-gray-500">Prior Period</th>
                      <th className="text-right py-2 font-semibold text-gray-500">Variance</th>
                    </>}
                  </tr></thead>
                  <tbody>
                    {/* Revenue */}
                    <tr><td colSpan={4} className="py-2 font-bold text-gray-800 bg-gray-50 px-2 uppercase text-xs tracking-wide">Revenue</td></tr>
                    {PL.revenue.map(r => (
                      <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 pl-4 text-gray-700">{r.name}</td>
                        <td className="py-1.5 text-right font-semibold">{fmt(r.curr)}</td>
                        {comparison !== 'None' && <><td className="py-1.5 text-right text-gray-500">{fmt(r.prev)}</td><td className="py-1.5 text-right">{variance(r.curr, r.prev)}</td></>}
                      </tr>
                    ))}
                    <tr className="font-semibold border-b-2 border-gray-300"><td className="py-2 pl-4">Total Revenue</td><td className="py-2 text-right text-green-700">{fmt(totalRevenue)}</td>{comparison !== 'None' && <><td className="py-2 text-right text-gray-500">{fmt(304700)}</td><td className="py-2 text-right">{variance(totalRevenue, 304700)}</td></>}</tr>

                    {/* COGS */}
                    <tr><td colSpan={4} className="py-2 font-bold text-gray-800 bg-gray-50 px-2 uppercase text-xs tracking-wide">Cost of Goods Sold</td></tr>
                    {PL.cogs.map(r => (
                      <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 pl-4 text-gray-700">{r.name}</td>
                        <td className="py-1.5 text-right">{fmt(r.curr)}</td>
                        {comparison !== 'None' && <><td className="py-1.5 text-right text-gray-500">{fmt(r.prev)}</td><td className="py-1.5 text-right">{variance(r.curr, r.prev)}</td></>}
                      </tr>
                    ))}
                    <tr className="font-semibold border-b border-green-200 bg-green-50">
                      <td className="py-2 pl-4">Gross Profit <span className="text-gray-400 font-normal text-xs">({pct((grossProfit/totalRevenue)*100)})</span></td>
                      <td className="py-2 text-right text-green-700">{fmt(grossProfit)}</td>
                      {comparison !== 'None' && <><td className="py-2 text-right text-gray-500">{fmt(237500)}</td><td /></>}
                    </tr>

                    {/* OpEx */}
                    <tr><td colSpan={4} className="py-2 font-bold text-gray-800 bg-gray-50 px-2 uppercase text-xs tracking-wide">Operating Expenses</td></tr>
                    {PL.opex.map(r => (
                      <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 pl-4 text-gray-700">{r.name}</td>
                        <td className="py-1.5 text-right">{fmt(r.curr)}</td>
                        {comparison !== 'None' && <><td className="py-1.5 text-right text-gray-500">{fmt(r.prev)}</td><td className="py-1.5 text-right">{variance(r.curr, r.prev)}</td></>}
                      </tr>
                    ))}
                    <tr className="font-semibold border-b-2 border-gray-300"><td className="py-2 pl-4">Total OpEx</td><td className="py-2 text-right">{fmt(totalOpex)}</td>{comparison !== 'None' && <><td className="py-2 text-right text-gray-500">{fmt(151000)}</td><td /></>}</tr>
                    <tr className="font-bold border-b border-blue-200 bg-blue-50"><td className="py-2 pl-4">Operating Income</td><td className="py-2 text-right text-blue-700">{fmt(opIncome)}</td>{comparison !== 'None' && <><td className="py-2 text-right text-gray-500">{fmt(86500)}</td><td /></>}</tr>

                    {/* Other */}
                    {PL.other.map(r => (
                      <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 pl-4 text-gray-700">{r.name}</td>
                        <td className="py-1.5 text-right text-red-500">({fmt(r.curr)})</td>
                        {comparison !== 'None' && <><td className="py-1.5 text-right text-gray-500">({fmt(r.prev)})</td><td /></>}
                      </tr>
                    ))}
                    <tr className="font-bold text-base bg-gray-800 text-white">
                      <td className="py-3 pl-4">Net Income</td>
                      <td className="py-3 text-right">{fmt(netIncome)}</td>
                      {comparison !== 'None' && <><td className="py-3 text-right text-gray-300">{fmt(83900)}</td><td /></>}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1 — Spend Analytics */}
      {tab === 1 && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Spend YTD', value: '$1.2M', trend: '+6%', up: true },
              { label: 'Budget Consumed', value: '78%', trend: '4 depts over 70%', up: false },
              { label: 'Open PO Commitments', value: '$142K', trend: 'encumbered', up: false },
              { label: 'Savings Achieved', value: '$18.4K', trend: 'early pay + negotiated', up: true },
            ].map(k => (
              <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">{k.label}</p>
                <p className={`text-xs mt-0.5 flex items-center gap-1 ${k.up ? 'text-green-600' : 'text-gray-400'}`}>
                  {k.up ? <TrendingUp className="w-3 h-3" /> : null}{k.trend}
                </p>
              </div>
            ))}
          </div>

          {/* Budget vs Actual */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Budget vs Actual — By Department</h3>
            <div className="space-y-3">
              {DEPTS.map(d => (
                <div key={d.dept}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{d.dept}</span>
                    <span className="text-gray-500">{fmt(d.actual)} / {fmt(d.budget)} ({d.pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.pct >= 90 ? 'bg-red-400' : d.pct >= 75 ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 font-semibold text-gray-700">Top Vendors by Spend</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{['#','Vendor','YTD Spend','MTD','vs Prior','Invoices'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {VENDORS.map(v => (
                  <tr key={v.rank} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-400">{v.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{v.vendor}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(v.ytd)}</td>
                    <td className="px-4 py-3">{fmt(v.mtd)}</td>
                    <td className={`px-4 py-3 font-semibold ${v.change.startsWith('+') ? 'text-amber-600' : 'text-green-600'}`}>{v.change}</td>
                    <td className="px-4 py-3 text-gray-500">{v.invoices}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Anomalies */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">AI Anomaly Alerts</h3>
            {[
              'Food & Bev spend 23% above weekly baseline this week — review recent F&B invoices.',
              'Maintenance Pro: 3 invoices submitted in 7 days — verify no duplicates.',
            ].map((msg, i) => (
              <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2 — Scheduled Reports */}
      {tab === 2 && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowSchedule(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Schedule
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr>{['Report Name','Type','Schedule','Recipients','Last Run','Next Run','Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {SCHEDULED.map(s => (
                  <tr key={s.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.schedule}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.recipients}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.last}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{s.next}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showSchedule && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Report Schedule</h2>
              <button onClick={() => setShowSchedule(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {[['Report Name','text'],['Report Type','select'],['Schedule','select'],['Recipients (emails)','text']].map(([l, t]) => (
                <div key={l}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  {t === 'select' ? (
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                      <option>Select…</option>
                    </select>
                  ) : <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder={l as string} />}
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowSchedule(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
