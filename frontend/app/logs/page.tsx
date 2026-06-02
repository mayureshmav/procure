'use client';

import { useEffect, useState } from 'react';
import { getImportJobs, getImportFailures } from '@/lib/api';
import { ImportJob, FailureLog, PagedResponse } from '@/types';
import { RefreshCw, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

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

export default function LogsPage() {
  const [jobs, setJobs]         = useState<ImportJob[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [failures, setFailures] = useState<Record<number, FailureLog[]>>({});
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = (p = 0) => {
    setLoading(true);
    getImportJobs(p, 25)
      .then((r: any) => {
        const paged = r as PagedResponse<ImportJob>;
        setJobs(paged.content ?? []);
        setTotalPages(paged.totalPages ?? 0);
        setPage(p);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const toggle = async (jobId: number) => {
    if (expanded === jobId) { setExpanded(null); return; }
    setExpanded(jobId);
    if (!failures[jobId]) {
      const logs = await getImportFailures(jobId).catch(() => []);
      setFailures(prev => ({ ...prev, [jobId]: logs }));
    }
  };

  // Summary stats
  const completed  = jobs.filter(j => j.status === 'COMPLETED').length;
  const partial    = jobs.filter(j => j.status === 'PARTIAL').length;
  const failed     = jobs.filter(j => j.status === 'FAILED').length;
  const processing = jobs.filter(j => j.status === 'PROCESSING' || j.status === 'PENDING').length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Logs</h1>
          <p className="text-gray-500 text-sm mt-0.5">History of all catalog import jobs</p>
        </div>
        <button onClick={() => load(page)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Completed',  value: completed,  color: 'text-green-700',  bg: 'bg-green-50' },
          { label: 'Partial',    value: partial,    color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Failed',     value: failed,     color: 'text-red-700',    bg: 'bg-red-50' },
          { label: 'In Progress', value: processing, color: 'text-blue-700',  bg: 'bg-blue-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card p-4 ${bg}`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-600 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Job list */}
      <div className="card">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading logs…</div>
        ) : jobs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No import jobs found.</div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {jobs.map(job => (
                <div key={job.id}>
                  <div className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggle(job.id)}>
                    {STATUS_ICON[job.status]}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{job.fileName ?? job.jobRef}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[job.status]}`}>{job.status}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{job.formatType}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{job.sourceType}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Vendor: {job.vendor?.name ?? '—'} ·{' '}
                        {new Date(job.createdAt).toLocaleString()} ·{' '}
                        {job.processedRecords}/{job.totalRecords} records
                        {job.failedRecords > 0 && <span className="text-red-500"> · {job.failedRecords} errors</span>}
                      </div>
                    </div>
                    {/* Progress bar */}
                    {job.totalRecords > 0 && (
                      <div className="w-24">
                        <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                          <span>{Math.round((job.processedRecords / job.totalRecords) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${job.status === 'FAILED' ? 'bg-red-400' : job.status === 'PARTIAL' ? 'bg-yellow-400' : 'bg-green-500'}`}
                            style={{ width: `${Math.round((job.processedRecords / job.totalRecords) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    {job.failedRecords > 0
                      ? expanded === job.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <div className="w-4" />
                    }
                  </div>

                  {expanded === job.id && (
                    <div className="px-5 pb-5 bg-gray-50">
                      {failures[job.id] && failures[job.id].length > 0 ? (
                        <table className="w-full text-xs mt-2">
                          <thead>
                            <tr className="text-gray-500 border-b border-gray-200">
                              {['Row','SKU','Field','Error Code','Message','Severity'].map(h =>
                                <th key={h} className="text-left py-1.5 pr-3 font-medium">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {failures[job.id].map(f => (
                              <tr key={f.id} className="border-b border-gray-100 text-gray-700">
                                <td className="py-1.5 pr-3">{f.rowNumber ?? '—'}</td>
                                <td className="py-1.5 pr-3 font-mono">{f.sku ?? '—'}</td>
                                <td className="py-1.5 pr-3">{f.fieldName ?? '—'}</td>
                                <td className="py-1.5 pr-3 font-mono text-red-600">{f.errorCode}</td>
                                <td className="py-1.5 pr-3 max-w-xs">{f.errorMessage}</td>
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
                      ) : (
                        <p className="text-sm text-gray-400 mt-3">No failure details available.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-gray-100">
                <button onClick={() => load(page - 1)} disabled={page === 0}
                  className="text-sm px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40">
                  ← Prev
                </button>
                <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
                <button onClick={() => load(page + 1)} disabled={page >= totalPages - 1}
                  className="text-sm px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
