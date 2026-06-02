'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getOcrDocument, validateOcrDocument, reprocessOcrDocument, linkOcrDocumentToPo,
  getVendors, getPurchaseOrders,
} from '@/lib/api';
import { OcrDocument, OcrExtractedField, OcrLineItem, Vendor } from '@/types';
import {
  ArrowLeft, RefreshCw, Save, CheckCircle, XCircle, AlertCircle,
  Loader2, Link2, ScanLine, FileText, List, Clock, User,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
  SUCCESSFUL: 'bg-green-100 text-green-700 border-green-200',
  FAILED:     'bg-red-100 text-red-700 border-red-200',
  DUPLICATE:  'bg-orange-100 text-orange-700 border-orange-200',
};

const confColor = (c: number) => c >= 0.8 ? 'text-green-600' : c >= 0.5 ? 'text-yellow-600' : 'text-red-600';

// ── component ─────────────────────────────────────────────────────────────────

export default function OcrDocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doc, setDoc]                 = useState<OcrDocument | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'fields' | 'lineitems' | 'audit'>('fields');

  // Linking state
  const [vendors, setVendors]         = useState<Vendor[]>([]);
  const [pos, setPos]                 = useState<any[]>([]);
  const [linkVendorId, setLinkVendorId] = useState('');
  const [linkPoId, setLinkPoId]       = useState('');
  const [linkPoRef, setLinkPoRef]     = useState('');
  const [linkSaving, setLinkSaving]   = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getOcrDocument(id)
      .then((d: OcrDocument) => {
        setDoc(d);
        setLinkVendorId(d.linkedVendorId ? String(d.linkedVendorId) : '');
        setLinkPoId(d.linkedPoId ? String(d.linkedPoId) : '');
        setLinkPoRef(d.poReference ?? '');
      })
      .catch(() => setError('Could not load document'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getVendors({ size: 200 }).then((r: any) => setVendors(r.content ?? r ?? [])).catch(() => {});
    if (typeof getPurchaseOrders === 'function') {
      getPurchaseOrders({ size: 200 }).then((r: any) => setPos(r.content ?? r ?? [])).catch(() => {});
    }
  }, []);

  // Jump to link section if hash present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#link') {
      setActiveSection('fields');
      setTimeout(() => document.getElementById('link-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [doc]);

  const handleFieldChange = (fieldName: string, value: string) =>
    setCorrections(prev => ({ ...prev, [fieldName]: value }));

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const updated = await validateOcrDocument(doc.id, corrections) as OcrDocument;
      setDoc(updated);
      setCorrections({});
    } catch {
      alert('Failed to save corrections');
    } finally {
      setSaving(false);
    }
  };

  const handleReprocess = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const updated = await reprocessOcrDocument(doc.id) as OcrDocument;
      setDoc(updated);
    } catch {
      alert('Reprocess failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLink = async () => {
    if (!doc) return;
    setLinkSaving(true);
    try {
      await linkOcrDocumentToPo(doc.id, {
        vendorId: linkVendorId ? Number(linkVendorId) : undefined,
        poId:     linkPoId     ? Number(linkPoId)     : undefined,
        poReference: linkPoRef || undefined,
      });
      setLinkSuccess(true);
      setTimeout(() => setLinkSuccess(false), 3000);
    } catch {
      alert('Failed to link document');
    } finally {
      setLinkSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading document…
    </div>
  );

  if (error || !doc) return (
    <div className="p-8 text-center text-red-600">
      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
      {error || 'Document not found'}
    </div>
  );

  const conf = Math.round((doc.overallConfidence ?? 0) * 100);
  const hasPendingCorrections = Object.keys(corrections).length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/integration?tab=ocr')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-blue-600" />
              {doc.fileName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Received {new Date(doc.receivedAt).toLocaleString()} · Source: {doc.sourceType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor[doc.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {doc.status}
          </span>
          <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
          {(doc.status === 'FAILED' || doc.status === 'PENDING') && (
            <button onClick={handleReprocess} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50">
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} /> Reprocess
            </button>
          )}
          {hasPendingCorrections && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              Save Corrections
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Vendor',       value: doc.vendorName      ?? '—' },
          { label: 'Invoice #',    value: doc.invoiceNumber   ?? '—' },
          { label: 'Invoice Date', value: doc.invoiceDate     ?? '—' },
          { label: 'Due Date',     value: doc.dueDate         ?? '—' },
          { label: 'PO Reference', value: doc.poReference     ?? '—' },
          { label: 'Currency',     value: doc.currency        ?? '—' },
          { label: 'Grand Total',  value: doc.grandTotal != null ? `${doc.currency ?? ''} ${doc.grandTotal.toLocaleString()}` : '—' },
          { label: 'Confidence',   value: `${conf}%`, extra: (
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${conf >= 80 ? 'bg-green-500' : conf >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${conf}%` }} />
            </div>
          )},
        ].map(({ label, value, extra }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-sm font-medium text-gray-900 truncate">{value}</div>
            {extra}
          </div>
        ))}
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'fields',    label: 'Extracted Fields', icon: FileText },
          { key: 'lineitems', label: 'Line Items',        icon: List     },
          { key: 'audit',     label: 'Audit Log',         icon: Clock    },
        ] as { key: typeof activeSection; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveSection(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeSection === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Extracted Fields */}
      {activeSection === 'fields' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {doc.extractedFields.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No extracted fields available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Field</th>
                  <th className="px-4 py-3 text-left">Extracted Value</th>
                  <th className="px-4 py-3 text-left">Corrected Value</th>
                  <th className="px-4 py-3 text-center">Confidence</th>
                  <th className="px-4 py-3 text-center">Flagged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doc.extractedFields.map((f: OcrExtractedField) => (
                  <tr key={f.fieldName} className={f.flagged ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-700">{f.fieldName}</td>
                    <td className="px-4 py-3 text-gray-600">{f.value}</td>
                    <td className="px-4 py-3">
                      <input
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Override value…"
                        value={corrections[f.fieldName] ?? ''}
                        onChange={e => handleFieldChange(f.fieldName, e.target.value)}
                      />
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${confColor(f.confidence)}`}>
                      {Math.round(f.confidence * 100)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.flagged
                        ? <AlertCircle className="w-4 h-4 text-red-500 mx-auto" />
                        : <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Line Items */}
      {activeSection === 'lineitems' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {doc.lineItems.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No line items extracted.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Tax</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doc.lineItems.map((item: OcrLineItem, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{item.unitPrice?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{item.taxAmount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{item.discount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.totalAmount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right text-gray-500 font-medium">Grand Total</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {doc.currency} {doc.grandTotal?.toLocaleString() ?? '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Audit Log */}
      {activeSection === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {doc.auditLog.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm">No audit entries.</p>
          ) : doc.auditLog.map((entry, idx) => (
            <div key={idx} className="px-5 py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{entry.action}</div>
                <div className="text-xs text-gray-500">{entry.user} · {new Date(entry.timestamp).toLocaleString()}</div>
                {entry.details && <div className="text-xs text-gray-600 mt-0.5">{entry.details}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link to PO / Vendor Section */}
      <div id="link-section" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Link to Procurement</h2>
          {(doc.linkedVendorId || doc.linkedPoId) && (
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Already linked
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Match to Vendor</label>
            <select value={linkVendorId} onChange={e => setLinkVendorId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select vendor —</option>
              {vendors.map(v => (
                <option key={v.id} value={String(v.id)}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Link to Purchase Order</label>
            <select value={linkPoId} onChange={e => setLinkPoId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select PO —</option>
              {pos.map((po: any) => (
                <option key={po.id} value={String(po.id)}>{po.poNumber ?? `PO #${po.id}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">PO Reference (manual)</label>
            <input value={linkPoRef} onChange={e => setLinkPoRef(e.target.value)}
              placeholder="e.g. PO-2024-0042"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleLink} disabled={linkSaving || (!linkVendorId && !linkPoId && !linkPoRef)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {linkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            Save Link
          </button>
          {linkSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" /> Linked successfully
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {doc.errorMessage && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-700">Processing Error</div>
            <div className="text-sm text-red-600 mt-0.5">{doc.errorMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}
