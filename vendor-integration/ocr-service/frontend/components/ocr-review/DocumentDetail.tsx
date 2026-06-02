'use client';

import { useState } from 'react';
import {
  X, RefreshCw, CheckCircle, AlertTriangle, Building2,
  Hash, Calendar, DollarSign, CreditCard, FileText, ClipboardList, Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { OcrDocument } from '@/types';
import { reprocessDocument, validateDocument } from '@/lib/api';

interface Props {
  doc: OcrDocument;
  onClose: () => void;
  onUpdate: (doc: OcrDocument) => void;
}

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-brand-600" />
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
    </div>
    <div className="pl-6 space-y-2">{children}</div>
  </div>
);

const Field = ({ label, value, editable, onChange, flagged }: {
  label: string; value: string | null; editable?: boolean;
  onChange?: (v: string) => void; flagged?: boolean;
}) => (
  <div className="flex items-start gap-2">
    <span className="text-xs text-gray-500 w-36 flex-shrink-0 pt-0.5">{label}</span>
    {editable && onChange ? (
      <input
        className={clsx('input-base text-xs py-1', flagged && 'border-amber-400 bg-amber-50')}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <span className={clsx('text-sm', value ? 'text-gray-900' : 'text-gray-300', flagged && 'text-amber-700')}>
        {value ?? '—'}
        {flagged && <AlertTriangle className="inline ml-1 h-3 w-3 text-amber-500" />}
      </span>
    )}
  </div>
);

export default function DocumentDetail({ doc, onClose, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'fields' | 'lineitems' | 'audit'>('details');

  const set = (key: string) => (val: string) => setCorrections((prev) => ({ ...prev, [key]: val }));
  const get = (key: keyof OcrDocument) => corrections[key] ?? (doc[key] as string | null);

  const handleValidate = async () => {
    setSaving(true);
    try {
      const updated = await validateDocument(doc.id, corrections);
      onUpdate(updated);
      setEditing(false);
      setCorrections({});
    } catch {
      alert('Validation failed. Is the backend running?');
    } finally {
      setSaving(false);
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      const updated = await reprocessDocument(doc.id);
      onUpdate(updated);
    } catch {
      alert('Reprocess failed. Is the backend running?');
    } finally {
      setReprocessing(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'fields', label: `Fields (${doc.extractedFields.length})` },
    { id: 'lineitems', label: `Line Items (${doc.lineItems.length})` },
    { id: 'audit', label: 'Audit Log' },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-gray-200">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{doc.documentType.replace('_', ' ')}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">{doc.sourceType}</span>
            {doc.isDuplicate && (
              <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs font-medium text-purple-700">Duplicate</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="ml-4 flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Confidence */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Overall Confidence</span>
          <span className={clsx('text-xs font-semibold', doc.overallConfidence >= 80 ? 'text-green-600' : doc.overallConfidence >= 60 ? 'text-amber-600' : 'text-red-600')}>
            {doc.overallConfidence}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={clsx('h-full rounded-full', doc.overallConfidence >= 80 ? 'bg-green-500' : doc.overallConfidence >= 60 ? 'bg-amber-400' : 'bg-red-500')}
            style={{ width: `${doc.overallConfidence}%` }}
          />
        </div>
        {doc.errorMessage && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> {doc.errorMessage}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-200">
        {!editing ? (
          <>
            <button className="btn-primary text-xs py-1.5" onClick={() => setEditing(true)}>
              <CheckCircle className="h-3.5 w-3.5" /> Validate & Correct
            </button>
            <button className="btn-secondary text-xs py-1.5" onClick={handleReprocess} disabled={reprocessing}>
              <RefreshCw className={clsx('h-3.5 w-3.5', reprocessing && 'animate-spin')} />
              {reprocessing ? 'Reprocessing…' : 'Reprocess'}
            </button>
          </>
        ) : (
          <>
            <button className="btn-primary text-xs py-1.5" onClick={handleValidate} disabled={saving}>
              {saving ? 'Saving…' : 'Save & Approve'}
            </button>
            <button className="btn-secondary text-xs py-1.5" onClick={() => { setEditing(false); setCorrections({}); }}>
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-5">
        <div className="flex gap-0">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'border-b-2 px-4 py-2.5 text-xs font-medium transition-colors',
                activeTab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {activeTab === 'details' && (
          <>
            <Section icon={Building2} title="Vendor">
              <Field label="Vendor Name" value={get('vendorName')} editable={editing} onChange={set('vendorName')} />
            </Section>
            <Section icon={Hash} title="Reference">
              <Field label="Invoice / CM Number" value={get('invoiceNumber')} editable={editing} onChange={set('invoiceNumber')} />
              <Field label="PO Reference" value={get('poReference')} editable={editing} onChange={set('poReference')} />
            </Section>
            <Section icon={Calendar} title="Dates">
              <Field label="Invoice Date" value={get('invoiceDate')} editable={editing} onChange={set('invoiceDate')} />
              <Field label="Due Date" value={get('dueDate')} editable={editing} onChange={set('dueDate')} />
              <Field label="Payment Terms" value={get('paymentTerms')} editable={editing} onChange={set('paymentTerms')} />
            </Section>
            <Section icon={DollarSign} title="Financials">
              <Field label="Currency" value={get('currency')} editable={editing} onChange={set('currency')} />
              <Field label="Subtotal" value={doc.subtotal != null ? String(doc.subtotal) : null} />
              <Field label="Tax Amount" value={doc.taxAmount != null ? String(doc.taxAmount) : null} />
              <Field label="Grand Total" value={doc.grandTotal != null ? String(doc.grandTotal) : null} />
            </Section>
            <Section icon={CreditCard} title="Bank Details">
              <Field label="Bank Info" value={get('bankDetails')} editable={editing} onChange={set('bankDetails')} />
            </Section>
          </>
        )}

        {activeTab === 'fields' && (
          <div>
            {doc.extractedFields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No raw fields extracted yet</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-2 text-gray-500 font-medium">Field</th>
                    <th className="text-left pb-2 text-gray-500 font-medium">Extracted Value</th>
                    <th className="text-left pb-2 text-gray-500 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doc.extractedFields.map((f, i) => (
                    <tr key={i} className={f.flagged ? 'bg-amber-50' : ''}>
                      <td className="py-2 pr-3 font-medium text-gray-700">{f.fieldName}</td>
                      <td className="py-2 pr-3 text-gray-900 flex items-center gap-1">
                        {f.value}
                        {f.flagged && <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-16 rounded-full bg-gray-200 overflow-hidden">
                            <div className={clsx('h-full rounded-full', f.confidence >= 80 ? 'bg-green-500' : f.confidence >= 60 ? 'bg-amber-400' : 'bg-red-500')} style={{ width: `${f.confidence}%` }} />
                          </div>
                          <span>{f.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'lineitems' && (
          <div>
            {doc.lineItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No line items extracted yet</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-2 text-gray-500 font-medium">Description</th>
                    <th className="text-right pb-2 text-gray-500 font-medium">Qty</th>
                    <th className="text-right pb-2 text-gray-500 font-medium">Unit Price</th>
                    <th className="text-right pb-2 text-gray-500 font-medium">Tax</th>
                    <th className="text-right pb-2 text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doc.lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 text-gray-800">{li.description}</td>
                      <td className="py-2 pr-3 text-right text-gray-600">{li.quantity}</td>
                      <td className="py-2 pr-3 text-right text-gray-600">{li.unitPrice.toFixed(2)}</td>
                      <td className="py-2 pr-3 text-right text-gray-600">{li.taxRate}%</td>
                      <td className="py-2 text-right font-medium text-gray-900">{li.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            {doc.auditLog.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No audit entries yet</p>
            ) : (
              <div className="space-y-3">
                {doc.auditLog.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-800">{entry.action}</span>
                        <span className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className="text-xs text-gray-400">by {entry.user}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{entry.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
