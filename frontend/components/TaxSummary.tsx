'use client';

import { useState, useEffect, useCallback } from 'react';
import { calculateTaxForPO, getTaxSummary } from '@/lib/api';
import { TaxSummary as TaxSummaryType } from '@/types';
import { Receipt, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  poId: number;
  poStatus: string;
  /** Called after a successful recalculation so the parent can refresh the PO */
  onRecalculated?: () => void;
}

export default function TaxSummary({ poId, poStatus, onRecalculated }: Props) {
  const [summary, setSummary] = useState<TaxSummaryType | null>(null);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTaxSummary(poId);
      setSummary(data);
    } catch {
      setError('Tax summary unavailable');
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError(null);
    try {
      const data = await calculateTaxForPO(poId);
      setSummary(data);
      onRecalculated?.();
    } catch {
      setError('Tax Engine unreachable — please try again');
    } finally {
      setRecalculating(false);
    }
  };

  const fmt = (v?: number, currency = 'USD') =>
    v != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v)
      : '—';

  const canRecalculate = ['DRAFT', 'SUBMITTED'].includes(poStatus);

  return (
    <div className="border border-blue-200 rounded-xl bg-blue-50 p-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-900 text-sm">Tax Summary</span>
          {summary?.taxJurisdiction && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {summary.taxJurisdiction}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {summary?.taxCalculatedAt && (
            <span className="text-xs text-gray-400">
              Calculated {new Date(summary.taxCalculatedAt).toLocaleString()}
            </span>
          )}
          {canRecalculate && (
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-1 text-xs bg-white border border-blue-300 text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {recalculating
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <RefreshCw className="w-3 h-3" />}
              {recalculating ? 'Calculating…' : 'Recalculate'}
            </button>
          )}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading tax data…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Per-line breakdown */}
          {summary.lines && summary.lines.length > 0 && (
            <div className="mb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-blue-200">
                    <th className="text-left py-1 font-medium">Line Item</th>
                    <th className="text-right py-1 font-medium">Net</th>
                    <th className="text-right py-1 font-medium">Tax</th>
                    <th className="text-right py-1 font-medium">Gross</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.lines.map((line) => (
                    <tr key={line.lineId} className="border-b border-blue-100 last:border-0">
                      <td className="py-1 text-gray-700 max-w-[180px] truncate">
                        {line.description}
                        {line.taxClass && (
                          <span className="ml-1 text-blue-500 font-medium">({line.taxClass})</span>
                        )}
                      </td>
                      <td className="py-1 text-right text-gray-700">
                        {fmt(line.netAmount, summary.taxCurrency)}
                      </td>
                      <td className="py-1 text-right text-blue-700 font-medium">
                        {fmt(line.taxAmount, summary.taxCurrency)}
                      </td>
                      <td className="py-1 text-right text-gray-900 font-semibold">
                        {fmt((line.netAmount || 0) + (line.taxAmount || 0), summary.taxCurrency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="bg-white rounded-lg border border-blue-200 px-3 py-2 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{fmt(summary.subTotal, summary.taxCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm text-blue-700 font-medium">
              <span>Tax</span>
              <span>{fmt(summary.taxAmount, summary.taxCurrency)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-blue-100 pt-1 mt-1">
              <span>Total (incl. tax)</span>
              <span>{fmt(summary.totalWithTax, summary.taxCurrency)}</span>
            </div>
          </div>

          {/* Audit trail link */}
          {summary.taxAuditId && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Tax Engine audit ref: <span className="font-mono">{summary.taxAuditId}</span>
            </div>
          )}
        </>
      )}

      {!loading && !error && !summary && (
        <p className="text-sm text-gray-500">
          No tax calculation yet.{' '}
          {canRecalculate && (
            <button onClick={handleRecalculate} className="text-blue-600 underline">
              Calculate now
            </button>
          )}
        </p>
      )}
    </div>
  );
}
