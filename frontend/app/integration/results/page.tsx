'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, FileText, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getEdiProcessingResults, getEdiProcessingIntegrations } from '@/lib/api';
import type {
  EdiProcessingResult, EdiProcessingIntegration,
  EdiResultStatus, EdiIntegrationType, EdiFileType,
} from '@/types';

const TYPE_LABELS: Record<EdiIntegrationType, string> = {
  EDI_X12: 'EDI X12', EDIFACT: 'UN/EDIFACT', XRECHNUNG: 'XRechnung', CXML: 'cXML',
};
const FILE_TYPE_LABELS: Record<EdiFileType, string> = {
  INVOICE: 'Invoice', CREDIT_MEMO: 'Credit Memo',
};
const STATUS_CONFIG: Record<EdiResultStatus, { label: string; color: string; icon: React.ReactNode }> = {
  SUCCESS: { label: 'Success', color: 'bg-green-100 text-green-700',  icon: <CheckCircle className="w-3 h-3" /> },
  PARTIAL: { label: 'Partial', color: 'bg-amber-100 text-amber-700',  icon: <AlertTriangle className="w-3 h-3" /> },
  FAILED:  { label: 'Failed',  color: 'bg-red-100 text-red-700',      icon: <XCircle className="w-3 h-3" /> },
};

function formatDate(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatMoney(amount?: number, currency?: string) {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency', currency: currency ?? 'USD', minimumFractionDigits: 2,
  }).format(amount);
}

export default function ProcessingResultsPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();

  const [results, setResults]         = useState<EdiProcessingResult[]>([]);
  const [allResults, setAllResults]   = useState<EdiProcessingResult[]>([]);
  const [integrations, setIntegrations] = useState<EdiProcessingIntegration[]>([]);
  const [loading, setLoading]         = useState(true);

  const integrationId = searchParams.get('integrationId') ?? '';
  const status        = searchParams.get('status')        ?? '';

  useEffect(() => {
    const params: Record<string, string> = {};
    if (integrationId) params.integrationId = integrationId;
    if (status)        params.status        = status;

    Promise.all([
      getEdiProcessingResults(params),
      getEdiProcessingResults(),
      getEdiProcessingIntegrations(),
    ]).then(([filtered, all, ints]) => {
      setResults(Array.isArray(filtered) ? filtered : []);
      setAllResults(Array.isArray(all) ? all : []);
      setIntegrations(Array.isArray(ints) ? ints : []);
    }).finally(() => setLoading(false));
  }, [integrationId, status]);

  function applyFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    fd.forEach((v, k) => { if (v) params.set(k, String(v)); });
    router.push(`/integration/results?${params.toString()}`);
  }

  const counts = {
    SUCCESS: allResults.filter(r => r.status === 'SUCCESS').length,
    PARTIAL: allResults.filter(r => r.status === 'PARTIAL').length,
    FAILED:  allResults.filter(r => r.status === 'FAILED').length,
  };
  const hasFilter = integrationId || status;
  const sorted = results.slice().sort((a, b) => b.pickedUpAt.localeCompare(a.pickedUpAt));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/integration" className="hover:text-blue-600">Vendor Integrations</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Processing Results</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Processing Results</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every file the engine has picked up and parsed. Click a row to inspect the full document and processing log.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <ResultStatCard label="Successful" count={counts.SUCCESS} icon={<CheckCircle className="w-6 h-6 text-green-400" />} color="border-green-200 bg-green-50" />
        <ResultStatCard label="Partial"    count={counts.PARTIAL} icon={<AlertTriangle className="w-6 h-6 text-amber-400" />} color="border-amber-200 bg-amber-50" />
        <ResultStatCard label="Failed"     count={counts.FAILED}  icon={<XCircle className="w-6 h-6 text-red-400" />}        color="border-red-200 bg-red-50" />
      </div>

      {/* Filter bar */}
      <form onSubmit={applyFilter} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Integration</label>
            <select name="integrationId" defaultValue={integrationId}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[16rem]">
              <option value="">All integrations</option>
              {integrations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select name="status" defaultValue={status}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PARTIAL">Partial</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Apply filter
            </button>
            {hasFilter && (
              <Link href="/integration/results"
                className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Clear
              </Link>
            )}
          </div>
          {hasFilter && (
            <span className="text-xs text-gray-400 ml-auto self-center">
              Showing {results.length} of {allResults.length} records
            </span>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">File Results</h2>
          <span className="text-xs text-gray-400">{sorted.length} records</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading results…</div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {hasFilter ? 'No results match the current filters.' : 'No processing results yet.'}
            </p>
            {hasFilter && (
              <Link href="/integration/results"
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50">
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source File</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Integration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Format / Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Doc #</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Picked Up</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(r => {
                  const sc = STATUS_CONFIG[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <Link href={`/integration/results/${r.id}`}
                          className="font-mono text-xs font-semibold text-blue-700 hover:underline">
                          {r.sourceFileName}
                        </Link>
                        {r.renamedTo && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">→ {r.renamedTo}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.integrationName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                          {TYPE_LABELS[r.integrationType] ?? r.integrationType}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">{FILE_TYPE_LABELS[r.fileType] ?? r.fileType}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {r.document?.documentNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                        {r.document ? formatMoney(r.document.totalAmount, r.document.currency) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.pickedUpAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                        {r.issues.length > 0 && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {r.issues.length} issue{r.issues.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultStatCard({ label, count, icon, color }: {
  label: string; count: number; icon: React.ReactNode; color: string;
}) {
  return (
    <div className={`rounded-xl border p-5 flex items-center justify-between ${color}`}>
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">{count}</div>
      </div>
      {icon}
    </div>
  );
}
