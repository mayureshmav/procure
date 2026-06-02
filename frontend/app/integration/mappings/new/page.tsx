'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, GitBranch, Info } from 'lucide-react';
import { createEdiMappingProfile, getEdiProcessingIntegrations } from '@/lib/api';
import type {
  EdiProcessingIntegration, EdiFormatType, EdiMappingDirection, EdiFileType,
} from '@/types';

// ── Static options ─────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: { value: EdiFormatType; label: string; txCodes: string[] }[] = [
  { value: 'EDI_X12',   label: 'ANSI X12',        txCodes: ['810', '812', '850', '855', '856', '832', '997'] },
  { value: 'EDIFACT',   label: 'UN/EDIFACT',       txCodes: ['INVOIC', 'ORDERS', 'ORDRSP', 'DESADV', 'PRICAT', 'CONTRL'] },
  { value: 'XRECHNUNG', label: 'XRechnung (UBL)',  txCodes: ['Invoice', 'CreditNote'] },
  { value: 'CXML',      label: 'cXML',             txCodes: ['Invoice', 'PunchOutOrderMessage', 'OrderRequest'] },
  { value: 'JSON',      label: 'JSON',             txCodes: ['invoice', 'credit_memo', 'order'] },
  { value: 'CSV',       label: 'CSV',              txCodes: ['invoice', 'catalog', 'order'] },
];

const VERSION_HINTS: Record<EdiFormatType, string> = {
  EDI_X12:   '005010 or 004010',
  EDIFACT:   'D96A, D01B, D16A …',
  XRECHNUNG: '3.0 or 2.0',
  CXML:      '1.2.037',
  JSON:      'v1, v2 …',
  CSV:       '(optional)',
};

const DIR_OPTIONS: { value: EdiMappingDirection; label: string; desc: string }[] = [
  { value: 'INBOUND',  label: 'Inbound',  desc: 'Partner → Your DB (parse & persist)' },
  { value: 'OUTBOUND', label: 'Outbound', desc: 'Your DB → Partner file (generate & deliver)' },
  { value: 'BOTH',     label: 'Both',     desc: 'Profile covers both directions' },
];

const DOC_OPTIONS: { value: EdiFileType; label: string }[] = [
  { value: 'INVOICE',     label: 'Invoice' },
  { value: 'CREDIT_MEMO', label: 'Credit Memo' },
];

// ── Profile ID suggester ──────────────────────────────────────────────────────

function suggestProfileId(
  integrations: EdiProcessingIntegration[],
  integrationId: string,
  format: EdiFormatType,
  txCode: string,
  direction: EdiMappingDirection,
): string {
  const int = integrations.find(i => i.id === integrationId);
  const prefix = int
    ? int.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()
    : 'TP000';
  const fmt = format.replace('_', '').slice(0, 6);
  const tx  = txCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const dir = direction === 'INBOUND' ? 'IN' : direction === 'OUTBOUND' ? 'OUT' : 'BOTH';
  return `${prefix}_${fmt}_${tx}_${dir}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewMappingProfilePage() {
  const router = useRouter();

  // form state
  const [integrations, setIntegrations] = useState<EdiProcessingIntegration[]>([]);
  const [loadingInts, setLoadingInts]   = useState(true);

  const [profileId,    setProfileId]    = useState('');
  const [profileIdTouched, setProfileIdTouched] = useState(false);
  const [integrationId, setIntegrationId] = useState('');
  const [formatType,   setFormatType]   = useState<EdiFormatType>('EDI_X12');
  const [txCode,       setTxCode]       = useState('810');
  const [txCodeCustom, setTxCodeCustom] = useState('');
  const [direction,    setDirection]    = useState<EdiMappingDirection>('INBOUND');
  const [docType,      setDocType]      = useState<EdiFileType>('INVOICE');
  const [version,      setVersion]      = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate,   setExpiryDate]   = useState('');
  const [enabled,      setEnabled]      = useState(true);

  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  // load integrations
  useEffect(() => {
    getEdiProcessingIntegrations()
      .then((d: EdiProcessingIntegration[]) => setIntegrations(Array.isArray(d) ? d : []))
      .finally(() => setLoadingInts(false));
  }, []);

  // auto-suggest profile ID when key fields change (unless user has typed their own)
  useEffect(() => {
    if (profileIdTouched) return;
    const tx = txCode === '__custom__' ? txCodeCustom : txCode;
    if (!tx) return;
    setProfileId(suggestProfileId(integrations, integrationId, formatType, tx, direction));
  }, [integrationId, formatType, txCode, txCodeCustom, direction, integrations, profileIdTouched]);

  // reset tx code suggestion when format changes
  useEffect(() => {
    const opts = FORMAT_OPTIONS.find(f => f.value === formatType)?.txCodes ?? [];
    setTxCode(opts[0] ?? '');
    setTxCodeCustom('');
  }, [formatType]);

  const currentTxOptions = FORMAT_OPTIONS.find(f => f.value === formatType)?.txCodes ?? [];
  const resolvedTxCode   = txCode === '__custom__' ? txCodeCustom.trim() : txCode;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!profileId.trim())         e.profileId       = 'Required — must be unique across all profiles';
    if (!/^[A-Z0-9_\-]+$/i.test(profileId)) e.profileId = 'Only letters, numbers, underscores and hyphens';
    if (!integrationId)            e.integrationId   = 'Select an integration';
    if (!resolvedTxCode)           e.txCode          = 'Transaction code is required';
    if (!effectiveDate)            e.effectiveDate   = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setApiError('');
    try {
      const payload = {
        mappingProfileId: profileId.trim().toUpperCase(),
        integrationId,
        formatType,
        transactionCode: resolvedTxCode,
        direction,
        documentType: docType,
        version:      version.trim() || undefined,
        effectiveDate,
        expiryDate:   expiryDate || undefined,
        enabled,
        segments: [],
      };
      const created = await createEdiMappingProfile(payload);
      // redirect to the detail/edit page to start adding segments
      const newId = created?.mappingProfileId ?? payload.mappingProfileId;
      router.push(`/integration/mappings/${encodeURIComponent(newId)}`);
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? err?.message ?? 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  }

  function FE({ name }: { name: string }) {
    return errors[name]
      ? <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>
      : null;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/integration" className="hover:text-blue-600">Vendor Integrations</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/integration/mappings" className="hover:text-blue-600">Integration Mapping</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium">New Mapping Profile</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">New Mapping Profile</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1 ml-12">
          Define the document processing scenario. After saving, add Segment and Element definitions
          to wire up field-level mappings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Identity ── */}
        <Section title="Identity" subtitle="Unique key and human context for this profile.">
          <div className="space-y-4">

            {/* Profile ID */}
            <div>
              <label className="field-label-sm">
                Mapping Profile ID <span className="text-red-500">*</span>
              </label>
              <input
                className={`field-in font-mono uppercase ${errors.profileId ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={profileId}
                onChange={e => { setProfileId(e.target.value.toUpperCase()); setProfileIdTouched(true); }}
                placeholder="e.g. ACME_EDIFACT_INVOIC_IN"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Primary key — unique, immutable after creation. Auto-suggested from the fields below.
              </p>
              <FE name="profileId" />
            </div>

            {/* Integration */}
            <div>
              <label className="field-label-sm">
                Integration <span className="text-red-500">*</span>
              </label>
              {loadingInts ? (
                <p className="text-sm text-gray-400 py-2">Loading integrations…</p>
              ) : integrations.length === 0 ? (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    No integrations found.{' '}
                    <Link href="/integration/settings/new" className="font-medium underline hover:text-amber-900">
                      Create one first
                    </Link>
                    , then come back here.
                  </span>
                </div>
              ) : (
                <select
                  className={`field-in ${errors.integrationId ? 'border-red-400' : ''}`}
                  value={integrationId}
                  onChange={e => setIntegrationId(e.target.value)}
                >
                  <option value="">— Select integration —</option>
                  {integrations.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.integrationType})
                    </option>
                  ))}
                </select>
              )}
              <FE name="integrationId" />
            </div>
          </div>
        </Section>

        {/* ── Document Scenario ── */}
        <Section title="Document Scenario" subtitle="What kind of document this profile handles.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Format type */}
            <div>
              <label className="field-label-sm">Format Type <span className="text-red-500">*</span></label>
              <select className="field-in" value={formatType}
                onChange={e => setFormatType(e.target.value as EdiFormatType)}>
                {FORMAT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="field-label-sm">Direction <span className="text-red-500">*</span></label>
              <select className="field-in" value={direction}
                onChange={e => setDirection(e.target.value as EdiMappingDirection)}>
                {DIR_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label} — {d.desc}</option>
                ))}
              </select>
            </div>

            {/* Transaction code */}
            <div>
              <label className="field-label-sm">Transaction Code <span className="text-red-500">*</span></label>
              <select className="field-in" value={txCode}
                onChange={e => setTxCode(e.target.value)}>
                {currentTxOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__custom__">Other (type below)…</option>
              </select>
              {txCode === '__custom__' && (
                <input
                  className={`field-in font-mono mt-1.5 ${errors.txCode ? 'border-red-400' : ''}`}
                  value={txCodeCustom}
                  onChange={e => setTxCodeCustom(e.target.value)}
                  placeholder="Enter transaction code"
                  autoFocus
                />
              )}
              <FE name="txCode" />
            </div>

            {/* Document type */}
            <div>
              <label className="field-label-sm">Document Type <span className="text-red-500">*</span></label>
              <div className="flex gap-3 mt-1">
                {DOC_OPTIONS.map(d => (
                  <label key={d.value}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition text-sm font-medium ${
                      docType === d.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <input type="radio" className="sr-only" value={d.value}
                      checked={docType === d.value}
                      onChange={() => setDocType(d.value)} />
                    {d.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Auto-detected per file from content — this configures the default/expected type.
              </p>
            </div>

            {/* Version */}
            <div>
              <label className="field-label-sm">Version</label>
              <input className="field-in font-mono" value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder={VERSION_HINTS[formatType]} />
              <p className="text-xs text-gray-400 mt-0.5">
                Used alongside format type to select this profile at runtime.
              </p>
            </div>

          </div>
        </Section>

        {/* ── Lifecycle ── */}
        <Section title="Lifecycle" subtitle="Active date range and enabled flag.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>
              <label className="field-label-sm">Effective Date <span className="text-red-500">*</span></label>
              <input className={`field-in ${errors.effectiveDate ? 'border-red-400' : ''}`}
                type="date" value={effectiveDate}
                onChange={e => setEffectiveDate(e.target.value)} />
              <FE name="effectiveDate" />
            </div>

            <div>
              <label className="field-label-sm">Expiry Date</label>
              <input className="field-in" type="date" value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)} />
              <p className="text-xs text-gray-400 mt-0.5">Leave blank for perpetual.</p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="field-label-sm mb-2">Status</label>
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEnabled(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {enabled ? 'Active' : 'Disabled'}
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Only enabled profiles are matched at runtime.
              </p>
            </div>

          </div>
        </Section>

        {/* ── What happens next callout ── */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">After saving you will be taken to the Segment &amp; Element editor.</p>
            <p className="text-blue-600 text-xs">
              Add Segment Definitions (one per logical field group / DB table), then add Element Definitions
              to each segment to map EDI positions → DB columns with transformation and validation rules.
            </p>
          </div>
        </div>

        {apiError && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {apiError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/integration/mappings"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || (integrations.length === 0 && !loadingInts)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <GitBranch className="w-4 h-4" />
            {saving ? 'Creating…' : 'Create profile & add segments →'}
          </button>
        </div>

      </form>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}
