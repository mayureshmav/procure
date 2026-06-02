'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { getEdiMappingProfile, patchEdiMappingProfile, getEdiSegmentsLibrary } from '@/lib/api';
import type {
  EdiMappingProfile, EdiSegmentDefinition, EdiElementDefinition,
  EdiDataType, EdiMappingDirection, EdiTransformationType,
} from '@/types';

// ── Label maps ────────────────────────────────────────────────────────────────
const FORMAT_LABELS: Record<string, string> = {
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
const DATA_TYPE_LABELS: Record<EdiDataType, string> = {
  STRING: 'String', NUMERIC: 'Numeric', DATE: 'Date',
  DATETIME: 'DateTime', BOOLEAN: 'Boolean', CODE: 'Code',
};
const DATA_TYPE_COLOR: Record<EdiDataType, string> = {
  STRING:   'bg-blue-100 text-blue-700',
  NUMERIC:  'bg-green-100 text-green-700',
  DATE:     'bg-yellow-100 text-yellow-700',
  DATETIME: 'bg-orange-100 text-orange-700',
  BOOLEAN:  'bg-purple-100 text-purple-700',
  CODE:     'bg-pink-100 text-pink-700',
};
const TRANSFORM_LABELS: Record<EdiTransformationType, string> = {
  PASSTHROUGH: 'Pass-through', TRIM: 'Trim', PAD: 'Pad',
  SUBSTRING: 'Substring', DATE_REFORMAT: 'Date Reformat',
  NUMERIC_SCALE: 'Numeric Scale', CODE_MAP: 'Code Map',
  CONCATENATE: 'Concatenate', SPLIT: 'Split', CONSTANT: 'Constant',
};

function formatDate(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString();
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MappingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile]   = useState<EdiMappingProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'segments' | 'profile'>('segments');
  const [expandedSegs, setExpandedSegs] = useState<Set<string>>(new Set());

  // Modals
  const [showAddSeg, setShowAddSeg]    = useState(false);
  const [addElemFor, setAddElemFor]    = useState<string | null>(null);
  const [removeElemConfirm, setRemoveElemConfirm] =
    useState<{ segmentRef: string; elementRef: string } | null>(null);
  const [removeSegConfirm, setRemoveSegConfirm] = useState<string | null>(null);

  function loadProfile() {
    setLoading(true);
    getEdiMappingProfile(id)
      .then((data: EdiMappingProfile) => {
        setProfile(data);
        if (data.segments?.length > 0)
          setExpandedSegs(new Set([data.segments[0].segmentRef]));
      })
      .catch((e: any) => setError(e?.message ?? 'Not found'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadProfile(); }, [id]); // eslint-disable-line

  function toggleSeg(ref: string) {
    setExpandedSegs(prev => {
      const next = new Set(prev);
      next.has(ref) ? next.delete(ref) : next.add(ref);
      return next;
    });
  }

  async function removeElement(segmentRef: string, elementRef: string) {
    if (!profile) return;
    try {
      const updated: EdiMappingProfile = await patchEdiMappingProfile(profile.mappingProfileId, {
        action: 'remove_element', segmentRef, elementRef,
      });
      setProfile(updated);
    } finally { setRemoveElemConfirm(null); }
  }

  async function removeSegment(segmentRef: string) {
    if (!profile) return;
    try {
      const updated: EdiMappingProfile = await patchEdiMappingProfile(profile.mappingProfileId, {
        action: 'remove_segment', segmentRef,
      });
      setProfile(updated);
    } finally { setRemoveSegConfirm(null); }
  }

  if (loading) return <div className="py-20 text-center text-gray-400 text-sm">Loading mapping profile…</div>;
  if (error || !profile) return (
    <div className="space-y-4">
      <Link href="/integration/mappings" className="text-sm text-blue-600 hover:underline">← Back to mappings</Link>
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-500">
        Mapping profile not found.
      </div>
    </div>
  );

  const totalElements = profile.segments.reduce((s, seg) => s + seg.elements.length, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/integration" className="hover:text-blue-600">Vendor Integrations</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/integration/mappings" className="hover:text-blue-600">Integration Mapping</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-mono text-gray-700">{profile.mappingProfileId}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-gray-900">{profile.mappingProfileId}</h1>
          <p className="text-sm text-gray-500 mt-1">{profile.integrationName}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${DIR_COLOR[profile.direction]}`}>
            {DIR_LABELS[profile.direction]}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            profile.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {profile.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
        <InfoItem label="Document Type"    value={profile.documentType === 'INVOICE' ? 'Invoice' : 'Credit Memo'} />
        <InfoItem label="Format"           value={FORMAT_LABELS[profile.formatType] ?? profile.formatType} />
        <InfoItem label="Transaction Code" value={profile.transactionCode} mono />
        <InfoItem label="Version"          value={profile.version ?? '—'} mono />
        <InfoItem label="Effective Date"   value={profile.effectiveDate} />
        <InfoItem label="Expiry Date"      value={profile.expiryDate ?? 'Perpetual'} />
        <InfoItem label="Segments"         value={String(profile.segments.length)} />
        <InfoItem label="Elements"         value={String(totalElements)} />
        <InfoItem label="Last Updated"     value={formatDate(profile.updatedAt)} />
        <InfoItem label="Created"          value={formatDate(profile.createdAt)} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0">
          {(['segments', 'profile'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'segments' ? 'Segments & Elements' : 'Profile Config'}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Segments tab ── */}
      {activeTab === 'segments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {profile.segments.length} segment{profile.segments.length !== 1 ? 's' : ''} · {totalElements} element{totalElements !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setExpandedSegs(new Set(profile.segments.map(s => s.segmentRef)))}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50">
                Expand all
              </button>
              <button onClick={() => setExpandedSegs(new Set())}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50">
                Collapse all
              </button>
              <button onClick={() => setShowAddSeg(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" /> Add segment
              </button>
            </div>
          </div>

          {profile.segments.map((seg, idx) => (
            <SegmentPanel
              key={seg.segmentRef}
              seg={seg}
              sequence={idx + 1}
              isExpanded={expandedSegs.has(seg.segmentRef)}
              onToggle={() => toggleSeg(seg.segmentRef)}
              onAddElement={() => setAddElemFor(seg.segmentRef)}
              onRemoveElement={ref => setRemoveElemConfirm({ segmentRef: seg.segmentRef, elementRef: ref })}
              onRemoveSegment={() => setRemoveSegConfirm(seg.segmentRef)}
            />
          ))}

          {profile.segments.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
              No segments defined yet.{' '}
              <button onClick={() => setShowAddSeg(true)} className="text-blue-600 hover:underline">
                Add the first segment
              </button>.
            </div>
          )}
        </div>
      )}

      {/* ── Profile Config tab ── */}
      {activeTab === 'profile' && <ProfileConfigPanel profile={profile} />}

      {/* ── Modals ── */}
      {showAddSeg && (
        <AddSegmentModal
          profileId={profile.mappingProfileId}
          existingRefs={new Set(profile.segments.map(s => s.segmentRef))}
          onClose={() => setShowAddSeg(false)}
          onAdded={seg => {
            setProfile(p => p ? { ...p, segments: [...p.segments, seg] } : p);
            setExpandedSegs(prev => { const n = new Set(Array.from(prev)); n.add(seg.segmentRef); return n; });
            setShowAddSeg(false);
          }}
        />
      )}

      {addElemFor && (
        <AddElementModal
          profileId={profile.mappingProfileId}
          segmentRef={addElemFor}
          existingRefs={new Set(
            profile.segments.find(s => s.segmentRef === addElemFor)?.elements.map(e => e.elementRef) ?? []
          )}
          onClose={() => setAddElemFor(null)}
          onAdded={el => {
            const seg = addElemFor;
            setProfile(p => p ? {
              ...p,
              segments: p.segments.map(s =>
                s.segmentRef === seg ? { ...s, elements: [...s.elements, el] } : s
              ),
            } : p);
            setAddElemFor(null);
          }}
        />
      )}

      {removeElemConfirm && (
        <ConfirmModal
          title="Remove Element"
          message={<>Remove element <code className="font-mono font-bold">{removeElemConfirm.elementRef}</code>? This cannot be undone.</>}
          confirmLabel="Remove element"
          onConfirm={() => removeElement(removeElemConfirm.segmentRef, removeElemConfirm.elementRef)}
          onClose={() => setRemoveElemConfirm(null)}
        />
      )}

      {removeSegConfirm && (
        <ConfirmModal
          title="Remove Segment"
          message={<>Remove segment <code className="font-mono font-bold">{removeSegConfirm}</code> and all its elements? This cannot be undone.</>}
          confirmLabel="Remove segment"
          onConfirm={() => removeSegment(removeSegConfirm)}
          onClose={() => setRemoveSegConfirm(null)}
        />
      )}
    </div>
  );
}

// ── SegmentPanel ──────────────────────────────────────────────────────────────

function SegmentPanel({
  seg, sequence, isExpanded, onToggle, onAddElement, onRemoveElement, onRemoveSegment,
}: {
  seg: EdiSegmentDefinition; sequence: number; isExpanded: boolean;
  onToggle: () => void; onAddElement: () => void;
  onRemoveElement: (ref: string) => void; onRemoveSegment: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center">
        <button onClick={onToggle}
          className="flex-1 text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
          <span className="text-gray-400 text-xs w-5 text-center">{sequence}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          <div className="flex-1 flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-semibold text-blue-800">{seg.segmentRef}</span>
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{seg.segmentCode}</span>
            <span className="text-sm text-gray-700">{seg.segmentName}</span>
            {seg.loopId && (
              <span className="text-xs text-gray-500 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-mono">
                Loop {seg.loopId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
            <span className="font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">→ {seg.dbTable}</span>
            {seg.maxOccurrences && <span>×{seg.maxOccurrences}</span>}
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{seg.elements.length} elem</span>
          </div>
        </button>
        <button onClick={onRemoveSegment}
          className="px-3 py-3 text-red-500 hover:text-red-700 hover:bg-red-50 transition text-xs font-medium">
          Remove
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Metadata strip */}
          <div className="px-4 py-2 bg-gray-50 flex flex-wrap gap-4 text-xs text-gray-600">
            <span><span className="text-gray-400">PK: </span><span className="font-mono">{seg.primaryKeyCol}</span></span>
            {seg.foreignKeyCol && <span><span className="text-gray-400">FK: </span><span className="font-mono">{seg.foreignKeyCol}</span></span>}
            {seg.loopId && <span><span className="text-gray-400">Loop: </span><span className="font-mono">{seg.loopId}</span></span>}
            {seg.maxOccurrences && <span><span className="text-gray-400">Max: </span><span className="font-mono">{seg.maxOccurrences}</span></span>}
          </div>

          {/* Elements table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-6">#</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Element ID</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Code</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Name</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">DB Column</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Type</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Length</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">Mand.</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Direction</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Transform</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Default</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {seg.elements.slice().sort((a, b) => a.sequenceNum - b.sequenceNum).map(el => (
                  <ElementRow key={el.elementRef} el={el} onRemove={() => onRemoveElement(el.elementRef)} />
                ))}
                {seg.elements.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-3 py-4 text-center text-gray-400">
                      No elements.{' '}
                      <button onClick={onAddElement} className="text-blue-600 hover:underline">Add the first element</button>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-400">Ref: <span className="font-mono">{seg.segmentRef}</span></span>
            <button onClick={onAddElement} className="text-xs text-blue-600 hover:underline font-medium">+ Add element</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ElementRow ────────────────────────────────────────────────────────────────

function ElementRow({ el, onRemove }: { el: EdiElementDefinition; onRemove: () => void }) {
  const [showCodes, setShowCodes] = useState(false);

  const lengthStr =
    el.minLength != null && el.maxLength != null ? `${el.minLength}–${el.maxLength}`
    : el.maxLength != null ? `≤${el.maxLength}`
    : el.minLength != null ? `≥${el.minLength}` : '—';

  const t = el.transformationJson;
  const transformLabel  = t ? (TRANSFORM_LABELS[t.type] ?? t.type) : '—';
  const transformDetail = t ? (() => {
    if (t.type === 'DATE_REFORMAT')   return `${t.fromFormat} → ${t.toFormat}`;
    if (t.type === 'NUMERIC_SCALE')   return `× ${t.factor}`;
    if (t.type === 'PAD')             return `${t.side} '${t.padChar}' →${t.width}`;
    if (t.type === 'SUBSTRING')       return `[${t.start}:${t.end}]`;
    if (t.type === 'CONSTANT')        return `"${t.value}"`;
    return null;
  })() : null;

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-3 py-2 text-gray-400">{el.sequenceNum}</td>
        <td className="px-3 py-2 font-mono font-medium text-blue-700">{el.elementRef}</td>
        <td className="px-3 py-2 font-mono text-gray-700 bg-gray-50">{el.elementCode}</td>
        <td className="px-3 py-2 text-gray-800">{el.elementName}</td>
        <td className="px-3 py-2 font-mono text-gray-600">{el.dbColumn}</td>
        <td className="px-3 py-2">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${DATA_TYPE_COLOR[el.dataType]}`}>
            {DATA_TYPE_LABELS[el.dataType]}
          </span>
        </td>
        <td className="px-3 py-2 font-mono text-gray-500">{lengthStr}</td>
        <td className="px-3 py-2 text-center">
          {el.mandatory
            ? <span className="text-red-500 font-bold">✓</span>
            : <span className="text-gray-300">—</span>}
        </td>
        <td className="px-3 py-2">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${DIR_COLOR[el.direction]}`}>
            {DIR_LABELS[el.direction]}
          </span>
        </td>
        <td className="px-3 py-2">
          {t ? (
            <span className="inline-flex flex-col gap-0.5">
              <span className="font-medium text-gray-700">{transformLabel}</span>
              {transformDetail && <span className="font-mono text-gray-400 text-[10px]">{transformDetail}</span>}
            </span>
          ) : <span className="text-gray-300">—</span>}
        </td>
        <td className="px-3 py-2 font-mono text-gray-400">{el.defaultValue ?? '—'}</td>
        <td className="px-3 py-2 text-right">
          <div className="flex gap-2 justify-end">
            {el.codeMaps && el.codeMaps.length > 0 && (
              <button onClick={() => setShowCodes(!showCodes)}
                className="text-pink-600 hover:underline text-[10px] font-medium">
                {showCodes ? 'Hide' : `${el.codeMaps.length} codes`}
              </button>
            )}
            <button onClick={onRemove} className="text-red-500 hover:underline hover:text-red-700">Remove</button>
          </div>
        </td>
      </tr>
      {showCodes && el.codeMaps && (
        <tr>
          <td colSpan={12} className="bg-pink-50 px-6 py-2">
            <div className="text-[10px] font-semibold text-pink-700 mb-1.5">Code Map — {el.elementCode}</div>
            <table className="min-w-[400px] text-[10px]">
              <thead>
                <tr className="text-pink-600">
                  <th className="text-left pr-6 pb-1">EDI Code</th>
                  <th className="text-left pr-6 pb-1">App / DB Value</th>
                  <th className="text-left pb-1">Description</th>
                </tr>
              </thead>
              <tbody>
                {el.codeMaps.map(cm => (
                  <tr key={cm.id}>
                    <td className="font-mono pr-6 py-0.5 text-gray-800">{cm.ediCode}</td>
                    <td className="font-mono pr-6 py-0.5 text-gray-800">{cm.appCode}</td>
                    <td className="text-gray-500">{cm.description ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

// ── AddSegmentModal ───────────────────────────────────────────────────────────

type ExistingSegOpt = EdiSegmentDefinition & { fromProfileId: string };

function AddSegmentModal({
  profileId, existingRefs, onClose, onAdded,
}: {
  profileId: string; existingRefs: Set<string>;
  onClose: () => void; onAdded: (seg: EdiSegmentDefinition) => void;
}) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [saving, setSaving]       = useState(false);
  const [apiError, setApiError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [options, setOptions]     = useState<ExistingSegOpt[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [searchQ, setSearchQ]     = useState('');
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'existing') return;
    setLoadingOpts(true);
    getEdiSegmentsLibrary(profileId)
      .then(setOptions).catch(() => setOptions([]))
      .finally(() => setLoadingOpts(false));
  }, [mode, profileId]);

  const filtered = options.filter(s => {
    const q = searchQ.toLowerCase();
    return !q || s.segmentRef.toLowerCase().includes(q)
      || s.segmentCode.toLowerCase().includes(q)
      || s.segmentName.toLowerCase().includes(q);
  });

  async function submitNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};
    if (!fd.get('segmentRef'))     errs.segmentRef     = 'Required';
    if (!fd.get('segmentCode'))    errs.segmentCode    = 'Required';
    if (!fd.get('segmentName'))    errs.segmentName    = 'Required';
    if (!fd.get('dbTable'))        errs.dbTable        = 'Required';
    if (!fd.get('primaryKeyCol'))  errs.primaryKeyCol  = 'Required';
    const ref = String(fd.get('segmentRef') ?? '');
    if (existingRefs.has(ref))     errs.segmentRef     = 'Already in this profile';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      const updated: EdiMappingProfile = await patchEdiMappingProfile(profileId, {
        action: 'add_segment',
        segmentRef:    fd.get('segmentRef'),
        segmentCode:   fd.get('segmentCode'),
        segmentName:   fd.get('segmentName'),
        dbTable:       fd.get('dbTable'),
        primaryKeyCol: fd.get('primaryKeyCol'),
        foreignKeyCol: fd.get('foreignKeyCol') || undefined,
        loopId:        fd.get('loopId')        || undefined,
        maxOccurrences: fd.get('maxOccurrences') ? Number(fd.get('maxOccurrences')) : undefined,
      });
      const added = updated.segments.find(s => s.segmentRef === ref)!;
      onAdded(added);
    } catch (err: any) { setApiError(String(err)); }
    finally { setSaving(false); }
  }

  async function submitExisting() {
    const seg = options.find(s => s.segmentRef === selectedRef);
    if (!seg) return;
    setSaving(true); setApiError('');
    try {
      const updated: EdiMappingProfile = await patchEdiMappingProfile(profileId, {
        action: 'add_segment',
        segmentRef: seg.segmentRef, segmentCode: seg.segmentCode,
        segmentName: seg.segmentName, dbTable: seg.dbTable,
        primaryKeyCol: seg.primaryKeyCol, foreignKeyCol: seg.foreignKeyCol,
        loopId: seg.loopId, maxOccurrences: seg.maxOccurrences,
      });
      const added = updated.segments.find(s => s.segmentRef === seg.segmentRef)!;
      onAdded(added);
    } catch (err: any) { setApiError(String(err)); }
    finally { setSaving(false); }
  }

  function FE({ name }: { name: string }) {
    return fieldErrors[name] ? <p className="text-xs text-red-500 mt-0.5">{fieldErrors[name]}</p> : null;
  }

  return (
    <Modal title="Add Segment Definition" onClose={onClose} width="max-w-2xl">
      <div className="flex border-b border-gray-200 mb-4">
        {(['new', 'existing'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setApiError(''); setFieldErrors({}); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              mode === m ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {m === 'new' ? 'Create new segment' : 'Use existing segment'}
          </button>
        ))}
      </div>

      {apiError && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{apiError}</div>}

      {mode === 'new' && (
        <form onSubmit={submitNew} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label-sm">Segment ID (Ref) *</label>
              <input name="segmentRef" className="field-in font-mono" placeholder="SEG_BIG"
                onChange={() => setFieldErrors(e => ({ ...e, segmentRef: '' }))} />
              <p className="text-xs text-gray-400 mt-0.5">Unique key, e.g. SEG_BIG</p><FE name="segmentRef" />
            </div>
            <div>
              <label className="field-label-sm">Segment Code *</label>
              <input name="segmentCode" className="field-in font-mono" placeholder="BIG"
                onChange={() => setFieldErrors(e => ({ ...e, segmentCode: '' }))} />
              <p className="text-xs text-gray-400 mt-0.5">EDI tag, XPath prefix, or CSV header</p><FE name="segmentCode" />
            </div>
          </div>
          <div>
            <label className="field-label-sm">Segment Name *</label>
            <input name="segmentName" className="field-in" placeholder="e.g. Beginning Segment for Invoice"
              onChange={() => setFieldErrors(e => ({ ...e, segmentName: '' }))} />
            <FE name="segmentName" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label-sm">DB Table *</label>
              <input name="dbTable" className="field-in font-mono" placeholder="invoice_header"
                onChange={() => setFieldErrors(e => ({ ...e, dbTable: '' }))} />
              <FE name="dbTable" />
            </div>
            <div>
              <label className="field-label-sm">Primary Key Column *</label>
              <input name="primaryKeyCol" className="field-in font-mono" placeholder="invoice_id"
                onChange={() => setFieldErrors(e => ({ ...e, primaryKeyCol: '' }))} />
              <FE name="primaryKeyCol" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label-sm">Foreign Key Column</label>
              <input name="foreignKeyCol" className="field-in font-mono" placeholder="(blank for root segments)" />
            </div>
            <div>
              <label className="field-label-sm">Loop ID</label>
              <input name="loopId" className="field-in font-mono" placeholder="e.g. 2000, SG26" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label-sm">Max Occurrences</label>
              <input name="maxOccurrences" className="field-in" type="number" min={1} placeholder="blank = unlimited" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50" disabled={saving}>
              {saving ? 'Adding…' : 'Add segment'}
            </button>
          </div>
        </form>
      )}

      {mode === 'existing' && (
        <div className="space-y-3">
          <input className="field-in w-full" placeholder="Search by ref, code, name…"
            value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          {loadingOpts && <p className="text-sm text-gray-400 py-4 text-center">Loading segments…</p>}
          {!loadingOpts && filtered.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">
              {options.length === 0 ? 'No reusable segments found.' : 'No segments match your search.'}
            </p>
          )}
          {!loadingOpts && filtered.length > 0 && (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              {filtered.map(s => (
                <button key={s.segmentRef} type="button" onClick={() => setSelectedRef(s.segmentRef)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition ${
                    selectedRef === s.segmentRef ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                  }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-blue-800">{s.segmentRef}</span>
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{s.segmentCode}</span>
                      {s.loopId && <span className="text-xs bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-mono text-gray-500">Loop {s.loopId}</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{s.segmentName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Table: <span className="font-mono">{s.dbTable}</span> · {s.elements.length} elements · from <span className="font-mono">{s.fromProfileId}</span>
                    </p>
                  </div>
                  {selectedRef === s.segmentRef && <span className="text-blue-600 font-bold mt-1">✓</span>}
                </button>
              ))}
            </div>
          )}
          {selectedRef && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
              <strong>{selectedRef}</strong> will be copied into this profile with all its element definitions.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={submitExisting} disabled={saving || !selectedRef}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Adding…' : 'Add selected segment'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── AddElementModal ───────────────────────────────────────────────────────────

function AddElementModal({
  profileId, segmentRef, existingRefs, onClose, onAdded,
}: {
  profileId: string; segmentRef: string; existingRefs: Set<string>;
  onClose: () => void; onAdded: (el: EdiElementDefinition) => void;
}) {
  const [saving, setSaving]           = useState(false);
  const [apiError, setApiError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dataType, setDataType]       = useState<EdiDataType>('STRING');
  const [showTransform, setShowTransform] = useState(false);
  const [transformType, setTransformType] = useState<EdiTransformationType>('PASSTHROUGH');

  function FE({ name }: { name: string }) {
    return fieldErrors[name] ? <p className="text-xs text-red-500 mt-0.5">{fieldErrors[name]}</p> : null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};
    if (!fd.get('elementRef'))  errs.elementRef  = 'Required';
    if (!fd.get('elementCode')) errs.elementCode = 'Required';
    if (!fd.get('elementName')) errs.elementName = 'Required';
    if (!fd.get('dbColumn'))    errs.dbColumn    = 'Required';
    const ref = String(fd.get('elementRef') ?? '');
    if (existingRefs.has(ref))  errs.elementRef  = 'Element ID already in this segment';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    const transformJson = (() => {
      if (!showTransform || transformType === 'PASSTHROUGH') return undefined;
      const base = { type: transformType };
      if (transformType === 'DATE_REFORMAT')  return { ...base, fromFormat: fd.get('fromFormat') || 'yyyyMMdd', toFormat: fd.get('toFormat') || 'yyyy-MM-dd' };
      if (transformType === 'NUMERIC_SCALE')  return { ...base, factor: Number(fd.get('factor') || 1) };
      if (transformType === 'PAD')            return { ...base, width: Number(fd.get('padWidth')), padChar: fd.get('padChar') || ' ', side: fd.get('padSide') || 'LEFT' };
      if (transformType === 'TRIM')           return { type: 'TRIM' };
      if (transformType === 'CONSTANT')       return { ...base, value: fd.get('constantValue') };
      return base;
    })();

    setSaving(true); setApiError('');
    try {
      const updated: EdiMappingProfile = await patchEdiMappingProfile(profileId, {
        action: 'add_element', segmentRef,
        elementRef:    fd.get('elementRef'),
        elementCode:   fd.get('elementCode'),
        elementName:   fd.get('elementName'),
        dbColumn:      fd.get('dbColumn'),
        dataType:      fd.get('dataType'),
        minLength:     fd.get('minLength') ? Number(fd.get('minLength')) : undefined,
        maxLength:     fd.get('maxLength') ? Number(fd.get('maxLength')) : undefined,
        mandatory:     fd.get('mandatory') === 'true',
        direction:     fd.get('direction'),
        defaultValue:  fd.get('defaultValue') || undefined,
        sequenceNum:   fd.get('sequenceNum') ? Number(fd.get('sequenceNum')) : 1,
        transformationJson: transformJson,
      });
      const seg = updated.segments.find(s => s.segmentRef === segmentRef);
      const added = seg?.elements.find(el => el.elementRef === ref);
      if (added) onAdded(added);
    } catch (err: any) { setApiError(String(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={`Add Element to ${segmentRef}`} onClose={onClose} width="max-w-2xl">
      {apiError && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{apiError}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label-sm">Element ID (Ref) *</label>
            <input name="elementRef" className="field-in font-mono" placeholder="EL_BIG02"
              onChange={() => setFieldErrors(e => ({ ...e, elementRef: '' }))} />
            <p className="text-xs text-gray-400 mt-0.5">Unique key, e.g. EL_BIG02</p><FE name="elementRef" />
          </div>
          <div>
            <label className="field-label-sm">Element Code *</label>
            <input name="elementCode" className="field-in font-mono" placeholder="BIG02 or /Invoice/cbc:ID"
              onChange={() => setFieldErrors(e => ({ ...e, elementCode: '' }))} />
            <FE name="elementCode" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label-sm">Element Name *</label>
            <input name="elementName" className="field-in" placeholder="e.g. Invoice Number"
              onChange={() => setFieldErrors(e => ({ ...e, elementName: '' }))} />
            <FE name="elementName" />
          </div>
          <div>
            <label className="field-label-sm">DB Column *</label>
            <input name="dbColumn" className="field-in font-mono" placeholder="invoice_number"
              onChange={() => setFieldErrors(e => ({ ...e, dbColumn: '' }))} />
            <FE name="dbColumn" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="field-label-sm">Data Type *</label>
            <select name="dataType" className="field-in" value={dataType}
              onChange={e => setDataType(e.target.value as EdiDataType)}>
              {(Object.entries(DATA_TYPE_LABELS) as [EdiDataType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div><label className="field-label-sm">Min Length</label><input name="minLength" className="field-in" type="number" min={0} placeholder="—" /></div>
          <div><label className="field-label-sm">Max Length</label><input name="maxLength" className="field-in" type="number" min={1} placeholder="—" /></div>
          <div><label className="field-label-sm">Sequence #</label><input name="sequenceNum" className="field-in" type="number" min={1} defaultValue={1} /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="field-label-sm">Mandatory</label>
            <select name="mandatory" className="field-in" defaultValue="false">
              <option value="true">Yes — error if absent</option>
              <option value="false">No — optional</option>
            </select>
          </div>
          <div>
            <label className="field-label-sm">Direction</label>
            <select name="direction" className="field-in" defaultValue="BOTH">
              {(Object.entries(DIR_LABELS) as [EdiMappingDirection, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label-sm">Default Value</label>
            <input name="defaultValue" className="field-in font-mono" placeholder="used when absent" />
          </div>
        </div>

        {/* Transformation rule — collapsible */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button type="button" onClick={() => setShowTransform(v => !v)}
            className="w-full text-left px-4 py-2.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition text-sm">
            <span className="font-medium text-gray-700">Transformation rule</span>
            <span className="text-gray-400 text-xs">{showTransform ? '▲ hide' : '▼ configure'}</span>
          </button>
          {showTransform && (
            <div className="px-4 py-3 space-y-3">
              <div>
                <label className="field-label-sm">Type</label>
                <select name="transformationType" className="field-in" value={transformType}
                  onChange={e => setTransformType(e.target.value as EdiTransformationType)}>
                  {(Object.entries(TRANSFORM_LABELS) as [EdiTransformationType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {transformType === 'DATE_REFORMAT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="field-label-sm">From Format</label><input name="fromFormat" className="field-in font-mono" defaultValue="yyyyMMdd" /></div>
                  <div><label className="field-label-sm">To Format</label><input name="toFormat" className="field-in font-mono" defaultValue="yyyy-MM-dd" /></div>
                </div>
              )}
              {transformType === 'NUMERIC_SCALE' && (
                <div><label className="field-label-sm">Scale Factor</label><input name="factor" className="field-in font-mono" type="number" step="any" defaultValue={1} /></div>
              )}
              {transformType === 'PAD' && (
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="field-label-sm">Width</label><input name="padWidth" className="field-in" type="number" min={1} /></div>
                  <div><label className="field-label-sm">Pad Char</label><input name="padChar" className="field-in font-mono" defaultValue=" " maxLength={1} /></div>
                  <div><label className="field-label-sm">Side</label><select name="padSide" className="field-in"><option value="LEFT">Left</option><option value="RIGHT">Right</option></select></div>
                </div>
              )}
              {transformType === 'CONSTANT' && (
                <div><label className="field-label-sm">Constant Value</label><input name="constantValue" className="field-in font-mono" placeholder="hardcoded output value" /></div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50" disabled={saving}>
            {saving ? 'Adding…' : 'Add element'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── ProfileConfigPanel ────────────────────────────────────────────────────────

function ProfileConfigPanel({ profile }: { profile: EdiMappingProfile }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-5">
        <h2 className="font-semibold text-gray-800">Mapping Profile Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mapping ID</label>
            <input className="field-in font-mono bg-gray-50" defaultValue={profile.mappingProfileId} readOnly />
            <p className="text-xs text-gray-400 mt-1">Primary key — cannot be changed after creation.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Integration</label>
            <input className="field-in bg-gray-50" defaultValue={profile.integrationName} readOnly />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Type</label>
            <select className="field-in" defaultValue={profile.documentType}>
              <option value="INVOICE">Invoice</option>
              <option value="CREDIT_MEMO">Credit Memo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Format</label>
            <select className="field-in" defaultValue={profile.formatType}>
              {(Object.entries(FORMAT_LABELS)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Code</label>
            <input className="field-in font-mono" defaultValue={profile.transactionCode} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Version</label>
            <input className="field-in font-mono" defaultValue={profile.version ?? ''} placeholder="e.g. 004010, D96A" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Direction</label>
            <select className="field-in" defaultValue={profile.direction}>
              <option value="INBOUND">Inbound</option>
              <option value="OUTBOUND">Outbound</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Effective Date</label>
            <input className="field-in" type="date" defaultValue={profile.effectiveDate} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
            <input className="field-in" type="date" defaultValue={profile.expiryDate ?? ''} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select className="field-in" defaultValue={profile.enabled ? 'true' : 'false'}>
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
        <Link href="/integration/mappings" className="ml-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Modal({ title, onClose, width = 'max-w-lg', children }: {
  title: string; onClose: () => void; width?: string; children: React.ReactNode;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-12 px-4"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${width} relative`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: {
  title: string; message: React.ReactNode; confirmLabel: string;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{message}</p>
        <p className="text-xs text-gray-500">This action cannot be undone.</p>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InfoItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className={`font-medium text-gray-900 ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</div>
    </div>
  );
}
