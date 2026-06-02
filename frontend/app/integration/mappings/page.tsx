'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ChevronRight, GitBranch } from 'lucide-react';
import { getEdiMappingProfiles, getEdiProcessingIntegrations } from '@/lib/api';
import type {
  EdiMappingProfile, EdiProcessingIntegration,
  EdiFormatType, EdiMappingDirection, EdiFileType,
} from '@/types';

const FORMAT_LABELS: Record<EdiFormatType, string> = {
  EDI_X12: 'EDI X12', EDIFACT: 'UN/EDIFACT', XRECHNUNG: 'XRechnung',
  CXML: 'cXML', JSON: 'JSON', CSV: 'CSV',
};
const DIR_LABELS: Record<EdiMappingDirection, string> = {
  INBOUND: 'Inbound', OUTBOUND: 'Outbound', BOTH: 'Both',
};
const DIR_COLOR: Record<EdiMappingDirection, string> = {
  INBOUND:  'bg-blue-100 text-blue-700',
  OUTBOUND: 'bg-orange-100 text-orange-700',
  BOTH:     'bg-purple-100 text-purple-700',
};
const DOC_LABELS: Record<EdiFileType, string> = {
  INVOICE: 'Invoice', CREDIT_MEMO: 'Credit Memo',
};

export default function MappingProfilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles]     = useState<EdiMappingProfile[]>([]);
  const [integrations, setIntegrations] = useState<EdiProcessingIntegration[]>([]);
  const [loading, setLoading]       = useState(true);

  const integrationId = searchParams.get('integrationId') ?? '';
  const formatType    = searchParams.get('formatType')    ?? '';
  const direction     = searchParams.get('direction')     ?? '';
  const documentType  = searchParams.get('documentType')  ?? '';

  useEffect(() => {
    const params: Record<string, string> = {};
    if (integrationId) params.integrationId = integrationId;
    if (formatType)    params.formatType    = formatType;
    if (direction)     params.direction     = direction;
    if (documentType)  params.documentType  = documentType;

    Promise.all([
      getEdiMappingProfiles(params),
      getEdiProcessingIntegrations(),
    ]).then(([p, i]) => {
      setProfiles(Array.isArray(p) ? p : []);
      setIntegrations(Array.isArray(i) ? i : []);
    }).finally(() => setLoading(false));
  }, [integrationId, formatType, direction, documentType]);

  function applyFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    fd.forEach((v, k) => { if (v) params.set(k, String(v)); });
    router.push(`/integration/mappings?${params.toString()}`);
  }

  const totalSegments = profiles.reduce((s, m) => s + m.segments.length, 0);
  const totalElements = profiles.reduce(
    (s, m) => s + m.segments.reduce((s2, seg) => s2 + seg.elements.length, 0), 0
  );
  const hasFilter = integrationId || formatType || direction || documentType;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/integration" className="hover:text-blue-600">Vendor Integrations</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium">Integration Mapping</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Integration Mapping</h1>
          <p className="text-sm text-gray-500 mt-1">
            Config-driven field-level mappings: Mapping Profile → Segment → Element.
            Define how EDI segments map to database columns without code changes.
          </p>
        </div>
        <Link
          href="/integration/mappings/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> New Mapping
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Mapping Profiles"    count={profiles.length}  color="border-purple-200 bg-purple-50 text-purple-700" />
        <StatCard label="Segment Definitions" count={totalSegments}    color="border-blue-200 bg-blue-50 text-blue-700" />
        <StatCard label="Element Definitions" count={totalElements}    color="border-green-200 bg-green-50 text-green-700" />
      </div>

      {/* Filter bar */}
      <form onSubmit={applyFilter} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Integration</label>
            <select name="integrationId" defaultValue={integrationId}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[15rem]">
              <option value="">All integrations</option>
              {integrations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Format</label>
            <select name="formatType" defaultValue={formatType}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All formats</option>
              {(Object.entries(FORMAT_LABELS) as [EdiFormatType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Direction</label>
            <select name="direction" defaultValue={direction}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All directions</option>
              {(Object.entries(DIR_LABELS) as [EdiMappingDirection, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Type</label>
            <select name="documentType" defaultValue={documentType}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All types</option>
              <option value="INVOICE">Invoice</option>
              <option value="CREDIT_MEMO">Credit Memo</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Apply filter
            </button>
            {hasFilter && (
              <Link href="/integration/mappings"
                className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Clear
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Mapping Profiles</h2>
          <span className="text-xs text-gray-400">{profiles.length} profiles</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading mapping profiles…</div>
        ) : profiles.length === 0 ? (
          <div className="py-16 text-center">
            <GitBranch className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {hasFilter ? 'No profiles match the current filters.' : 'No mapping profiles yet.'}
            </p>
            {!hasFilter && (
              <Link href="/integration/mappings/new"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" /> Create a mapping profile
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mapping ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Format</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Doc Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Direction</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tx Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Integration</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Coverage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Effective</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profiles.map(m => {
                  const elemCount = m.segments.reduce((s, seg) => s + seg.elements.length, 0);
                  return (
                    <tr key={m.mappingProfileId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <Link href={`/integration/mappings/${m.mappingProfileId}`}
                          className="font-mono text-xs font-semibold text-blue-700 hover:underline">
                          {m.mappingProfileId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                          {FORMAT_LABELS[m.formatType] ?? m.formatType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {DOC_LABELS[m.documentType] ?? m.documentType}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIR_COLOR[m.direction]}`}>
                          {DIR_LABELS[m.direction] ?? m.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.transactionCode}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.version ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{m.integrationName}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-xs text-gray-600 tabular-nums">{m.segments.length} seg</div>
                        <div className="text-xs text-gray-400 tabular-nums">{elemCount} elem</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{m.effectiveDate}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {m.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/integration/mappings/${m.mappingProfileId}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hierarchy legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-blue-800 mb-2">Mapping Hierarchy</p>
        <div className="flex flex-wrap gap-6 text-xs text-blue-700">
          <LegendItem chip="Mapping Profile" desc="identifies one partner + document type + direction scenario" />
          <LegendItem chip="Segment Definition" desc="one logical field group mapped to a DB table" />
          <LegendItem chip="Element Definition" desc="EDI position / XPath / JSON path → DB column with type, transform & validation rules" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-xl border p-5 flex items-center justify-between ${color}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{count}</p>
    </div>
  );
}

function LegendItem({ chip, desc }: { chip: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">{chip}</span>
      <span className="text-gray-500">{desc}</span>
    </div>
  );
}
