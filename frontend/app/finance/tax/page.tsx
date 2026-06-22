'use client';
import { useState } from 'react';
import { Plus, XCircle, Info, Calculator, CheckCircle, AlertTriangle } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const RATES = [
  { code: 'GST', name: 'Goods & Services Tax', rate: 5, type: 'Standard', from: '2024-01-01', status: 'ACTIVE' },
  { code: 'HST', name: 'Harmonized Sales Tax', rate: 13, type: 'Combined', from: '2024-01-01', status: 'ACTIVE' },
  { code: 'PST', name: 'Provincial Sales Tax', rate: 8, type: 'Provincial', from: '2024-01-01', status: 'ACTIVE' },
  { code: 'EX', name: 'Exempt', rate: 0, type: 'Exempt', from: '2024-01-01', status: 'ACTIVE' },
  { code: 'ZR', name: 'Zero-Rated', rate: 0, type: 'Zero-Rated', from: '2024-01-01', status: 'ACTIVE' },
];

const MAPPINGS = [
  { code: 'GST', input: '2100 — GST Input Tax', output: '2110 — GST Output Tax', desc: '5% federal tax' },
  { code: 'HST', input: '2101 — HST Input Tax', output: '2111 — HST Output Tax', desc: '13% combined (ON/NS/NB)' },
  { code: 'PST', input: '2102 — PST Input Tax', output: '2112 — PST Output Tax', desc: '8% provincial (BC/SK)' },
  { code: 'EX', input: 'N/A', output: 'N/A', desc: 'Tax-exempt transactions' },
];

const EXCEPTIONS = [
  { id: 'EX-041', invoice: 'INV-1043', type: 'Mixed Supply', desc: 'Invoice contains standard and exempt lines', raised: '2026-06-16', status: 'OPEN' },
  { id: 'EX-040', invoice: 'INV-1040', type: 'Missing Tax ID', desc: 'Vendor tax registration number not on file', raised: '2026-06-15', status: 'OPEN' },
  { id: 'EX-039', invoice: 'INV-1038', type: 'Low AI Confidence', desc: 'AI tax code confidence 58% — manual review required', raised: '2026-06-14', status: 'OPEN' },
  { id: 'EX-038', invoice: 'INV-1036', type: 'Tax-Exempt Vendor', desc: 'Vendor marked exempt — exemption cert due for renewal', raised: '2026-06-12', status: 'RESOLVED' },
  { id: 'EX-037', invoice: 'INV-1031', type: 'Rate Change Period', desc: 'Invoice date straddles HST rate change period', raised: '2026-06-10', status: 'RESOLVED' },
];

const FILING = [
  { type: 'GST', period: 'Q1 2026 (Mar)', due: '2026-04-30', status: 'FILED', payable: 8420 },
  { type: 'GST', period: 'Q2 2026 (Apr)', due: '2026-05-31', status: 'FILED', payable: 7890 },
  { type: 'GST', period: 'Q2 2026 (May)', due: '2026-06-30', status: 'OVERDUE', payable: 9200 },
  { type: 'HST', period: 'Q1 2026 (Mar)', due: '2026-04-30', status: 'FILED', payable: 4100 },
  { type: 'PST', period: 'May 2026', due: '2026-06-20', status: 'PENDING', payable: 3640 },
];

const ITC = [
  { invoice: 'INV-1048', vendor: 'Sysco Foods', date: '2026-06-08', taxAmount: 460, claimed: true, status: 'APPROVED' },
  { invoice: 'INV-1045', vendor: 'Utilities Corp', date: '2026-06-14', taxAmount: 120.5, claimed: true, status: 'APPROVED' },
  { invoice: 'INV-1042', vendor: 'Office Depot', date: '2026-06-17', taxAmount: 44.5, claimed: false, status: 'PENDING' },
  { invoice: 'INV-1041', vendor: 'Sysco Foods', date: '2026-06-18', taxAmount: 620, claimed: false, status: 'PENDING' },
];

const CALC_LINES = [
  { desc: 'Golf Course Usage', category: 'Services', qty: 1, price: 4500, taxClass: 'GST', taxAmt: 225 },
  { desc: 'F&B Supplies', category: 'Food', qty: 50, price: 24.5, taxClass: 'ZR', taxAmt: 0 },
  { desc: 'Equipment Rental', category: 'Equipment', qty: 2, price: 890, taxClass: 'HST', taxAmt: 231.4 },
];

const TABS = ['Tax Configuration', 'Tax Calculator', 'Exception Handling', 'Tax Filing'];

export default function TaxPage() {
  const [tab, setTab] = useState(0);
  const [showRate, setShowRate] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [filingOpen, setFilingOpen] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);

  const totalNet = CALC_LINES.reduce((a, l) => a + l.qty * l.price, 0);
  const totalTax = CALC_LINES.reduce((a, l) => a + l.taxAmt, 0);

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700', OPEN: 'bg-red-100 text-red-700',
      RESOLVED: 'bg-gray-100 text-gray-500', FILED: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700', PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m[s] ?? 'bg-gray-100 text-gray-600'}`}>{s}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">GST/VAT configuration · Exception handling · Tax filing</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> Tax Engine connected
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {/* TAB 0 — Tax Configuration */}
      {tab === 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Active Tax Regime</label>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none min-w-[220px]">
                <option>GST — Canada</option><option>VAT — United Kingdom</option><option>Sales Tax — US</option>
              </select>
            </div>
          </div>

          {/* Tax Rates */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Tax Rates</h3>
              <button onClick={() => setShowRate(true)} className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-700"><Plus className="w-4 h-4" /> Add Rate</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{['Code','Name','Rate %','Type','Effective From','Status',''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {RATES.map(r => (
                  <tr key={r.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{r.code}</td>
                    <td className="px-4 py-3 text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 font-semibold">{r.rate}%</td>
                    <td className="px-4 py-3 text-gray-500">{r.type}</td>
                    <td className="px-4 py-3 text-gray-400">{r.from}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3"><button className="text-xs text-gray-400 hover:text-blue-600">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GL Mapping */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 font-semibold text-gray-800">Tax Code → GL Account Mapping</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{['Code','Input Tax Account','Output Tax Account','Description'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {MAPPINGS.map(m => (
                  <tr key={m.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{m.code}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{m.input}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{m.output}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 1 — Tax Calculator */}
      {tab === 1 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-800">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            Connected to Tax Engine — all calculations are audit-logged with a unique audit ID.
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[['Transaction Type',['Purchase','Sale']],['Supplier Country',['CA','US','GB','AU']],['Customer Country',['CA','US','GB','AU']],['Currency',['CAD','USD','GBP']]].map(([l, opts]) => (
              <div key={l as string}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Line Items</h3>
              <button className="flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" /> Add Line</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{['Description','Category','Qty','Unit Price','Tax Class','Tax Amount'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {CALC_LINES.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{l.desc}</td>
                    <td className="px-4 py-3 text-gray-500">{l.category}</td>
                    <td className="px-4 py-3">{l.qty}</td>
                    <td className="px-4 py-3">{fmt(l.price)}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{l.taxClass}</span></td>
                    <td className={`px-4 py-3 font-semibold ${calculated ? 'text-blue-700' : 'text-gray-300'}`}>{calculated ? fmt(l.taxAmt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setCalculated(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
              <Calculator className="w-4 h-4" /> Calculate Tax
            </button>
            {calculated && (
              <div className="flex gap-6 text-sm bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                <span className="text-gray-600">Net: <strong>{fmt(totalNet)}</strong></span>
                <span className="text-blue-700">Tax: <strong>{fmt(totalTax)}</strong></span>
                <span className="text-gray-900 font-bold">Gross: <strong>{fmt(totalNet + totalTax)}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2 — Exception Handling */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 font-semibold text-gray-800">Active Tax Exceptions</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{['ID','Invoice #','Exception Type','Description','Raised','Status',''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {EXCEPTIONS.map(e => (
                  <tr key={e.id} className={`hover:bg-gray-50 ${e.status === 'OPEN' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{e.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{e.invoice}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{e.type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{e.desc}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{e.raised}</td>
                    <td className="px-4 py-3">{statusBadge(e.status)}</td>
                    <td className="px-4 py-3">
                      {e.status === 'OPEN' && (
                        <button onClick={() => setResolveId(e.id)} className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3 — Tax Filing */}
      {tab === 3 && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Filing Calendar</h3>
              <button onClick={() => setFilingOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700">Prepare Return</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{['Tax Type','Period','Due Date','Status','Amount Payable','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {FILING.map((f, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${f.status === 'OVERDUE' ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 font-bold text-gray-700">{f.type}</td>
                    <td className="px-4 py-3 text-gray-600">{f.period}</td>
                    <td className={`px-4 py-3 ${f.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{f.due}</td>
                    <td className="px-4 py-3">{statusBadge(f.status)}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(f.payable)}</td>
                    <td className="px-4 py-3">
                      {f.status !== 'FILED' && (
                        <button className="text-xs text-blue-600 underline" onClick={() => setFilingOpen(true)}>Prepare Return</button>
                      )}
                      {f.status === 'FILED' && <span className="text-xs text-gray-400">Filed ✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ITC Log */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 font-semibold text-gray-800">Input Tax Credit (ITC) Log</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>{['Invoice #','Vendor','Date','Tax Amount','Claimed','Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {ITC.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{r.invoice}</td>
                    <td className="px-4 py-3 text-gray-700">{r.vendor}</td>
                    <td className="px-4 py-3 text-gray-500">{r.date}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(r.taxAmount)}</td>
                    <td className="px-4 py-3">{r.claimed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filing modal */}
      {filingOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">GST Return — Q2 May 2026</h2>
              <button onClick={() => setFilingOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {[['Total Sales (Line 101)','$184,000.00'],['Tax Collected (Line 103)','$9,200.00'],['Total Purchases','$96,800.00'],['Input Tax Credits (Line 106)','$3,840.00'],['Net Tax Payable','$5,360.00']].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">{l}</span>
                  <span className={`font-semibold ${l.includes('Payable') ? 'text-blue-700 text-base' : 'text-gray-800'}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setFilingOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Export PDF</button>
              <button className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Mark as Filed</button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve modal */}
      {resolveId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Resolve Exception {resolveId}</h2>
              <button onClick={() => setResolveId(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Resolution Action</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option>Accept as-is — apply correct tax code</option>
                  <option>Return to vendor for correction</option>
                  <option>Override tax code manually</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" rows={3} placeholder="Explain the resolution…" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setResolveId(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => setResolveId(null)} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Mark Resolved</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rate modal */}
      {showRate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Tax Rate</h2>
              <button onClick={() => setShowRate(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {[['Tax Code','text','e.g. QST'],['Tax Name','text','e.g. Quebec Sales Tax'],['Rate %','number','e.g. 9.975'],['Type','text','Standard / Reduced / Zero-Rated / Exempt'],['Effective From','date','']].map(([l,t,p]) => (
                <div key={l as string}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <input type={t as string} placeholder={p as string} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowRate(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Rate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
