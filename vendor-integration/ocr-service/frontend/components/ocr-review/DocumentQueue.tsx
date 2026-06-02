'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Upload, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, AlertCircle, Copy, Loader2, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { OcrDocument, DocumentStatus } from '@/types';
import { getDocuments, getQueueStats, uploadDocument } from '@/lib/api';

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; icon: React.ElementType }> = {
  SUCCESSFUL:  { label: 'Successful',  color: 'text-green-700 bg-green-50 border-green-200',  icon: CheckCircle2 },
  PENDING:     { label: 'Pending',     color: 'text-amber-700 bg-amber-50 border-amber-200',   icon: Clock },
  PROCESSING:  { label: 'Processing',  color: 'text-blue-700 bg-blue-50 border-blue-200',      icon: Loader2 },
  FAILED:      { label: 'Failed',      color: 'text-red-700 bg-red-50 border-red-200',         icon: AlertCircle },
  DUPLICATE:   { label: 'Duplicate',   color: 'text-purple-700 bg-purple-50 border-purple-200', icon: Copy },
};

const StatusBadge = ({ status }: { status: DocumentStatus }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', cfg.color)}>
      <Icon className={clsx('h-3 w-3', status === 'PROCESSING' && 'animate-spin')} />
      {cfg.label}
    </span>
  );
};

const ConfidenceBar = ({ value }: { value: number }) => {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
        <div className={clsx('h-full rounded-full', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-500">{value}%</span>
    </div>
  );
};

interface Props {
  onSelect: (doc: OcrDocument) => void;
  selectedId: string | null;
}

const STATUSES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SUCCESSFUL', label: 'Successful' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'DUPLICATE', label: 'Duplicate' },
];

// ── Mock data for UI development without a running backend ─────────────────────
const MOCK_DOCS: OcrDocument[] = [
  {
    id: '1', fileName: 'INV-2024-00142.pdf', documentType: 'INVOICE', status: 'SUCCESSFUL',
    sourceType: 'EMAIL', receivedAt: '2024-05-10T09:14:00Z', processedAt: '2024-05-10T09:15:02Z',
    vendorName: 'Acme Supplies Ltd', invoiceNumber: 'INV-2024-00142', invoiceDate: '2024-05-09',
    poReference: 'PO-7823', currency: 'USD', subtotal: 4500.00, taxAmount: 810.00, grandTotal: 5310.00,
    paymentTerms: 'Net 30', dueDate: '2024-06-09', bankDetails: 'Acc: 4582019283, SWIFT: BOFAUS3N',
    lineItems: [], extractedFields: [], errorMessage: null, isDuplicate: false, overallConfidence: 94, auditLog: [],
  },
  {
    id: '2', fileName: 'CM-2024-00031.pdf', documentType: 'CREDIT_MEMO', status: 'PENDING',
    sourceType: 'SFTP', receivedAt: '2024-05-10T10:02:00Z', processedAt: null,
    vendorName: 'TechParts Inc', invoiceNumber: null, invoiceDate: null,
    poReference: null, currency: 'INR', subtotal: null, taxAmount: null, grandTotal: null,
    paymentTerms: null, dueDate: null, bankDetails: null,
    lineItems: [], extractedFields: [], errorMessage: 'Invoice number not found', isDuplicate: false, overallConfidence: 42, auditLog: [],
  },
  {
    id: '3', fileName: 'invoice_scan_blurry.jpg', documentType: 'INVOICE', status: 'FAILED',
    sourceType: 'MANUAL', receivedAt: '2024-05-10T11:30:00Z', processedAt: '2024-05-10T11:31:10Z',
    vendorName: null, invoiceNumber: null, invoiceDate: null,
    poReference: null, currency: null, subtotal: null, taxAmount: null, grandTotal: null,
    paymentTerms: null, dueDate: null, bankDetails: null,
    lineItems: [], extractedFields: [], errorMessage: 'Image quality too low for OCR extraction', isDuplicate: false, overallConfidence: 8, auditLog: [],
  },
  {
    id: '4', fileName: 'INV-2024-00142-dup.pdf', documentType: 'INVOICE', status: 'DUPLICATE',
    sourceType: 'EMAIL', receivedAt: '2024-05-10T13:00:00Z', processedAt: '2024-05-10T13:01:00Z',
    vendorName: 'Acme Supplies Ltd', invoiceNumber: 'INV-2024-00142', invoiceDate: '2024-05-09',
    poReference: 'PO-7823', currency: 'USD', subtotal: 4500.00, taxAmount: 810.00, grandTotal: 5310.00,
    paymentTerms: 'Net 30', dueDate: '2024-06-09', bankDetails: null,
    lineItems: [], extractedFields: [], errorMessage: 'Duplicate of document ID 1', isDuplicate: true, overallConfidence: 93, auditLog: [],
  },
  {
    id: '5', fileName: 'BILL-EUR-0022.pdf', documentType: 'INVOICE', status: 'PROCESSING',
    sourceType: 'SFTP', receivedAt: '2024-05-10T14:20:00Z', processedAt: null,
    vendorName: null, invoiceNumber: null, invoiceDate: null,
    poReference: null, currency: null, subtotal: null, taxAmount: null, grandTotal: null,
    paymentTerms: null, dueDate: null, bankDetails: null,
    lineItems: [], extractedFields: [], errorMessage: null, isDuplicate: false, overallConfidence: 0, auditLog: [],
  },
];

export default function DocumentQueue({ onSelect, selectedId }: Props) {
  const [docs, setDocs] = useState<OcrDocument[]>(MOCK_DOCS);
  const [total, setTotal] = useState(MOCK_DOCS.length);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState({ total: 5, pending: 1, processing: 1, successful: 1, failed: 1, duplicate: 1 });
  const PAGE_SIZE = 20;

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDocuments({ page, size: PAGE_SIZE, status: statusFilter || undefined, search: search || undefined });
      setDocs(res.content);
      setTotal(res.totalElements);
    } catch {
      // backend not yet running — keep mock data
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await getQueueStats();
      setStats(s);
    } catch { /* use mock */ }
  }, []);

  useEffect(() => { fetchDocs(); fetchStats(); }, [fetchDocs, fetchStats]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const doc = await uploadDocument(file);
      setDocs((prev) => [doc, ...prev]);
    } catch {
      alert('Upload failed. Is the backend running?');
    }
    e.target.value = '';
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'Successful', value: stats.successful, color: 'text-green-600' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Failed', value: stats.failed, color: 'text-red-600' },
          { label: 'Duplicate', value: stats.duplicate, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-4 py-3 text-center">
            <p className={clsx('text-xl font-bold', color)}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="input-base pl-9"
            placeholder="Search by filename, vendor, invoice number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="flex gap-1">
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(0); }}
              className={clsx(
                'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                statusFilter === value
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              )}
            >{label}</button>
          ))}
        </div>
        <button onClick={fetchDocs} className="btn-secondary flex-shrink-0" title="Refresh">
          <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
        </button>
        <label className="btn-primary flex-shrink-0 cursor-pointer">
          <Upload className="h-4 w-4" />
          Upload
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* Table */}
      <div className="card flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Document</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Received</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={9} className="py-12 text-center text-gray-400"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /><p>Loading…</p></td></tr>
              )}
              {!loading && docs.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center text-gray-400"><FileText className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No documents found</p></td></tr>
              )}
              {!loading && docs.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => onSelect(doc)}
                  className={clsx(
                    'cursor-pointer transition-colors hover:bg-gray-50',
                    selectedId === doc.id && 'bg-brand-50 hover:bg-brand-50'
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[180px]" title={doc.fileName}>{doc.fileName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{doc.documentType.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-[140px]">{doc.vendorName ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{doc.invoiceNumber ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {doc.grandTotal != null ? `${doc.currency ?? ''} ${doc.grandTotal.toLocaleString()}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3"><ConfidenceBar value={doc.overallConfidence} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(doc.receivedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600">{doc.sourceType}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">Showing {docs.length} of {total} documents</p>
          <div className="flex items-center gap-2">
            <button className="btn-secondary py-1 px-2 text-xs" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-600">Page {page + 1} of {Math.max(1, totalPages)}</span>
            <button className="btn-secondary py-1 px-2 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
