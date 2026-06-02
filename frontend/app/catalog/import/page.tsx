'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadCatalog, getImportJobs, getImportFailures, getVendors } from '@/lib/api';
import { ImportJob, FailureLog, Vendor, FileFormatType, PagedResponse } from '@/types';
import { Upload, FileText, RefreshCw, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const FORMAT_META: Record<string, { color: string; bg: string; ext: string; desc: string }> = {
  CSV:  { color: 'text-green-700',  bg: 'bg-green-50',  ext: 'csv',  desc: 'Comma-separated · Excel & most ERPs' },
  XLSX: { color: 'text-blue-700',   bg: 'bg-blue-50',   ext: 'xlsx', desc: 'Excel spreadsheet' },
  JSON: { color: 'text-indigo-700', bg: 'bg-indigo-50', ext: 'json', desc: 'JSON array format' },
  CXML: { color: 'text-purple-700', bg: 'bg-purple-50', ext: 'xml',  desc: 'cXML · Ariba / Coupa' },
  EDI:  { color: 'text-orange-700', bg: 'bg-orange-50', ext: 'edi',  desc: 'EDI 832 / X12' },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />,
  PROCESSING: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  COMPLETED:  <CheckCircle className="w-4 h-4 text-green-600" />,
  PARTIAL:    <AlertCircle className="w-4 h-4 text-yellow-500" />,
  FAILED:     <XCircle className="w-4 h-4 text-red-500" />,
};
const STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED:  'bg-green-100 text-green-700',
  PARTIAL:    'bg-yellow-100 text-yellow-700',
  FAILED:     'bg-red-100 text-red-700',
};

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [vendors, setVendors]   = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState<number | ''>('');
  const [format, setFormat]     = useState<FileFormatType>('CSV');
  const [file, setFile]         = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const [jobs, setJobs]         = useState<ImportJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [failures, setFailures] = useState<Record<number, FailureLog[]>>({});

  const loadJobs = () => {
    setLoadingJobs(true);
    getImportJobs()
      .then(r => setJobs((r as PagedResponse<ImportJob>).content ?? []))
      .catch(() => setJobs([]))
      .finally(() => setLoadingJobs(false));
  };

  useEffect(() => {
    getVendors().then(setVendors);
    loadJobs();
  }, []);

  const handleUpload = async () => {
    if (!vendorId || !file) { setUploadMsg('Please select a vendor and file.'); return; }
    setUploading(true);
    setUploadMsg('');
    try {
      await uploadCatalog(Number(vendorId), format, file);
      setUploadMsg('Import job created — processing in background.');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      loadJobs();
    } catch (e: any) {
      setUploadMsg(e?.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const toggleFailures = async (jobId: number) => {
    if (expandedJob === jobId) { setExpandedJob(null); return; }
    setExpandedJob(jobId);
    if (!failures[jobId]) {
      const logs = await getImportFailures(jobId).catch(() => []);
      setFailures(prev => ({ ...prev, [jobId]: logs }));
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog Import</h1>
          <p className="text-gray-500 text-sm mt-0.5">Upload CSV, XLSX, JSON, cXML or EDI files to bulk-import products</p>
        </div>
        <button onClick={loadJobs} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <RefreshCw className={`w-4 h-4 ${loadingJobs ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Upload Card */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Upload a Catalog File</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
            <select className="input-field" value={vendorId} onChange={e => setVendorId(Number(e.target.value) || '')}>
              <option value="">— Select vendor —</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File Format *</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(FORMAT_META) as FileFormatType[]).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    format === f
                      ? `${FORMAT_META[f].bg} ${FORMAT_META[f].color} border-current`
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drop zone */}
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
          <input ref={fileRef} type="file"
            accept={`.${FORMAT_META[format]?.ext},.csv,.xlsx,.json,.xml,.edi`}
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {file ? (
            <>
              <FileText className="w-8 h-8 text-green-600 mb-1" />
              <span className="text-sm font-medium text-green-700">{file.name}</span>
              <span className="text-xs text-green-500">{(file.size / 1024).toFixed(1)} KB</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-1" />
              <span className="text-sm text-gray-500">Click to select or drag & drop</span>
              <span className="text-xs text-gray-400">{FORMAT_META[format]?.desc}</span>
            </>
          )}
        </label>

        {uploadMsg && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${uploadMsg.includes('failed') || uploadMsg.includes('Please') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {uploadMsg}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={handleUpload} disabled={uploading || !file || !vendorId}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload & Import'}
          </button>
        </div>
      </div>

      {/* Job History */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Import Job History</h2>
        </div>
        {loadingJobs ? (
          <div className="p-10 text-center text-gray-400">Loading jobs…</div>
        ) : jobs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No import jobs yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.map(job => (
              <div key={job.id}>
                <div className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50">
                  {STATUS_ICON[job.status]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{job.fileName ?? job.jobRef}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[job.status]}`}>{job.status}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{job.formatType}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {job.vendor?.name} · {new Date(job.createdAt).toLocaleString()} ·{' '}
                      {job.processedRecords}/{job.totalRecords} processed
                      {job.failedRecords > 0 && ` · ${job.failedRecords} failed`}
                    </div>
                  </div>
                  {job.failedRecords > 0 && (
                    <button onClick={() => toggleFailures(job.id)}
                      className="text-xs text-red-600 flex items-center gap-1 hover:underline">
                      View {job.failedRecords} errors
                      {expandedJob === job.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                {expandedJob === job.id && failures[job.id] && (
                  <div className="px-5 pb-4 bg-red-50">
                    <table className="w-full text-xs mt-2">
                      <thead>
                        <tr className="text-gray-500 border-b border-red-100">
                          {['Row','SKU','Field','Error Code','Message','Severity'].map(h =>
                            <th key={h} className="text-left py-1.5 pr-3 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {failures[job.id].map(f => (
                          <tr key={f.id} className="border-b border-red-100 text-gray-700">
                            <td className="py-1.5 pr-3">{f.rowNumber ?? '—'}</td>
                            <td className="py-1.5 pr-3 font-mono">{f.sku ?? '—'}</td>
                            <td className="py-1.5 pr-3">{f.fieldName ?? '—'}</td>
                            <td className="py-1.5 pr-3 font-mono">{f.errorCode}</td>
                            <td className="py-1.5 pr-3 max-w-xs truncate">{f.errorMessage}</td>
                            <td className="py-1.5 pr-3">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                f.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                                f.severity === 'ERROR' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'}`}>{f.severity}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
