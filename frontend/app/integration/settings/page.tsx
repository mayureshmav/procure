'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, CheckCircle, PauseCircle, FileEdit, Wifi, Server,
  Clock, ChevronRight, Play, Loader2, Shield, AlertTriangle,
  RefreshCw, Lock,
} from 'lucide-react';
import {
  getEdiProcessingIntegrations,
  runEdiProcessingIntegration,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { EdiProcessingIntegration, EdiIntegrationStatus, EdiResultStatus } from '@/types';

// ── Labels & colours ──────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  EDI_X12:   'EDI X12',
  EDIFACT:   'UN/EDIFACT',
  XRECHNUNG: 'XRechnung',
  CXML:      'cXML',
};

const TYPE_COLOR: Record<string, string> = {
  EDI_X12:   'bg-purple-100 text-purple-700',
  EDIFACT:   'bg-indigo-100 text-indigo-700',
  XRECHNUNG: 'bg-blue-100 text-blue-700',
  CXML:      'bg-teal-100 text-teal-700',
};

const PROTO_COLOR: Record<string, string> = {
  SFTP: 'bg-blue-100 text-blue-700',
  FTP:  'bg-green-100 text-green-700',
  AS2:  'bg-orange-100 text-orange-700',
  AS4:  'bg-rose-100 text-rose-700',
};

const STATUS_COLOR: Record<EdiIntegrationStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  PAUSED: 'bg-amber-100 text-amber-700 border-amber-200',
  DRAFT:  'bg-gray-100  text-gray-600  border-gray-200',
};

const RUN_COLOR: Record<EdiResultStatus, string> = {
  SUCCESS: 'text-green-600',
  PARTIAL: 'text-amber-500',
  FAILED:  'text-red-500',
};

const RUN_ICON: Record<EdiResultStatus, React.ElementType> = {
  SUCCESS: CheckCircle,
  PARTIAL: AlertTriangle,
  FAILED:  AlertTriangle,
};

function fmt(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntegrationSettingsPage() {
  const { canAccess } = useAuth();
  const canManage = canAccess('integration', 'manage');

  const [integrations, setIntegrations] = useState<EdiProcessingIntegration[]>([]);
  const [loading, setLoading]   = useState(true);
  const [running, setRunning]   = useState<string | null>(null);
  const [filter, setFilter]     = useState<EdiIntegrationStatus | 'ALL'>('ALL');

  const load = () => {
    setLoading(true);
    getEdiProcessingIntegrations()
      .then((d: EdiProcessingIntegration[]) => setIntegrations(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleRunNow(id: string) {
    setRunning(id);
    try { await runEdiProcessingIntegration(id); } finally { setRunning(null); }
  }

  const counts = {
    ALL:    integrations.length,
    ACTIVE: integrations.filter(i => i.status === 'ACTIVE').length,
    PAUSED: integrations.filter(i => i.status === 'PAUSED').length,
    DRAFT:  integrations.filter(i => i.status === 'DRAFT').length,
  };

  const visible = filter === 'ALL' ? integrations : integrations.filter(i => i.status === filter);

  // ── Protocol detail summary ────────────────────────────────────────────────
  function protoDetail(i: EdiProcessingIntegration) {
    const t = i.transport;
    if (t.protocol === 'AS2') return `${t.as2Id ?? '—'} → ${t.as2PartnerId ?? '—'}`;
    if (t.protocol === 'AS4') return `${t.as4PartyId ?? '—'} → ${t.as4PartnerPartyId ?? '—'}`;
    return `${t.host}:${t.port}`;
  }

  function securityBadges(i: EdiProcessingIntegration) {
    const badges = [];
    if (i.security.tlsRequired)       badges.push({ l: 'TLS', c: 'bg-blue-50  text-blue-600'  });
    if (i.security.encryptionEnabled) badges.push({ l: 'ENC', c: 'bg-green-50 text-green-600' });
    if (i.security.signatureRequired) badges.push({ l: 'SIG', c: 'bg-purple-50 text-purple-600' });
    return badges;
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
            <Link href="/integration" className="hover:text-blue-600">Vendor Integrations</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium">Integration Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Integration Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define each partner connection — protocol, security, schedule and file handling.
            The scheduler picks up files automatically based on each integration's cron.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={load} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          {canManage ? (
            <Link href="/integration/settings/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> New Integration
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-2 border border-gray-200 rounded-lg">
              <Lock className="w-3.5 h-3.5" /> View only
            </div>
          )}
        </div>
      </div>

      {/* ── Stat chips ── */}
      <div className="flex flex-wrap gap-3">
        {(['ALL','ACTIVE','PAUSED','DRAFT'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              filter === s
                ? s === 'ACTIVE' ? 'bg-green-600 text-white border-green-600'
                : s === 'PAUSED' ? 'bg-amber-500 text-white border-amber-500'
                : s === 'DRAFT'  ? 'bg-gray-600  text-white border-gray-600'
                :                  'bg-blue-600  text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {s === 'ACTIVE' && <CheckCircle className="w-4 h-4" />}
            {s === 'PAUSED' && <PauseCircle className="w-4 h-4" />}
            {s === 'DRAFT'  && <FileEdit    className="w-4 h-4" />}
            {s === 'ALL'    && <Wifi        className="w-4 h-4" />}
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              filter === s ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500">
        <span className="font-semibold text-gray-600">Protocols:</span>
        {Object.entries(PROTO_COLOR).map(([k, c]) => (
          <span key={k} className={`px-2 py-0.5 rounded-full font-medium ${c}`}>{k}</span>
        ))}
        <span className="ml-4 font-semibold text-gray-600">Security badges:</span>
        <span className="px-2 py-0.5 rounded-full bg-blue-50  text-blue-600  font-medium">TLS</span>
        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">ENC</span>
        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">SIG</span>
        <span className="ml-4 text-gray-400">TLS=transport encryption · ENC=payload encryption · SIG=digital signature</span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            {filter === 'ALL' ? 'All Integrations' : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Integrations`}
          </h2>
          <span className="text-xs text-gray-400">{visible.length} shown</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading integrations…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <Wifi className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {filter === 'ALL' ? 'No integrations configured yet.' : `No ${filter.toLowerCase()} integrations.`}
            </p>
            {canManage && filter === 'ALL' && (
              <Link href="/integration/settings/new"
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" /> Add first integration
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-6 py-3">Name / Description</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Protocol & Endpoint</th>
                  <th className="text-left px-4 py-3">Security</th>
                  <th className="text-left px-4 py-3">Schedule</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Last Run</th>
                  <th className="px-4 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map(i => {
                  const RunIcon = i.lastRunStatus ? RUN_ICON[i.lastRunStatus] : null;
                  return (
                    <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-3.5">
                        <Link href={`/integration/settings/${i.id}`}
                          className="font-semibold text-blue-700 hover:underline">
                          {i.name}
                        </Link>
                        {i.description && (
                          <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{i.description}</div>
                        )}
                        {i.vendorId && (
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Vendor #{i.vendorId}
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLOR[i.integrationType] ?? 'bg-gray-100 text-gray-600'}`}>
                          {TYPE_LABEL[i.integrationType] ?? i.integrationType}
                        </span>
                      </td>

                      {/* Protocol + endpoint */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PROTO_COLOR[i.transport.protocol] ?? 'bg-gray-100 text-gray-600'}`}>
                            {i.transport.protocol}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5 max-w-[160px] truncate">
                          {protoDetail(i)}
                        </div>
                        {/* Inbox path for file-based protocols */}
                        {(i.transport.protocol === 'SFTP' || i.transport.protocol === 'FTP') && i.transport.remoteInboxPath && (
                          <div className="text-xs text-gray-300 font-mono mt-0.5 truncate max-w-[160px]" title={i.transport.remoteInboxPath}>
                            {i.transport.remoteInboxPath}
                          </div>
                        )}
                      </td>

                      {/* Security badges */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {securityBadges(i).map(({ l, c }) => (
                            <span key={l} className={`px-1.5 py-0.5 rounded text-xs font-bold ${c}`}>{l}</span>
                          ))}
                          <span className="px-1.5 py-0.5 rounded text-xs text-gray-400 bg-gray-50 font-medium">
                            {i.security.authMethod === 'SSH_KEY' ? 'SSH' : i.security.authMethod === 'CERTIFICATE' ? 'CERT' : 'PWD'}
                          </span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="px-4 py-3.5">
                        {i.schedule.enabled ? (
                          <>
                            <div className="flex items-center gap-1 text-xs font-mono text-gray-700">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {i.schedule.cron}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{i.schedule.timezone}</div>
                            {i.schedule.nextRunAt && (
                              <div className="text-xs text-blue-500 mt-0.5">
                                Next: {fmt(i.schedule.nextRunAt)}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Manual only</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[i.status]}`}>
                          {i.status}
                        </span>
                      </td>

                      {/* Last run */}
                      <td className="px-4 py-3.5">
                        <div className="text-xs text-gray-500">{fmt(i.lastRunAt)}</div>
                        {i.lastRunStatus && RunIcon && (
                          <div className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${RUN_COLOR[i.lastRunStatus]}`}>
                            <RunIcon className="w-3 h-3" /> {i.lastRunStatus}
                          </div>
                        )}
                        {/* Retry info */}
                        {i.retry && i.retry.maxAttempts > 0 && (
                          <div className="text-xs text-gray-300 mt-0.5 flex items-center gap-0.5">
                            <RefreshCw className="w-2.5 h-2.5" />
                            {i.retry.maxAttempts} retries · {i.retry.backoffStrategy.toLowerCase()}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {canManage && (
                            <button onClick={() => handleRunNow(i.id)} disabled={running === i.id}
                              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50">
                              {running === i.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Play className="w-3.5 h-3.5" />}
                              {running === i.id ? 'Running' : 'Run'}
                            </button>
                          )}
                          <Link href={`/integration/settings/${i.id}`}
                            className="text-xs text-gray-500 hover:text-blue-600 font-medium">
                            {canManage ? 'Edit' : 'View'}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── How-to guide ── */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
        <h3 className="text-sm font-semibold text-blue-800 mb-3">How to configure an integration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-blue-700">
          {[
            ['1  General', 'Name the integration, link it to a vendor and choose the EDI type (X12 / EDIFACT / XRechnung / cXML).'],
            ['2  Transport', 'Pick the protocol (SFTP / FTP / AS2 / AS4) and fill in all connection details. Use the Test Connection button to verify before saving.'],
            ['3  Security', 'Set TLS version, supply certificate vault paths and enable encryption / signing as required by the partner.'],
            ['4  File Handling', 'Choose the error strategy (Quarantine recommended), enable duplicate detection and configure the retry backoff policy.'],
            ['5  Schedule', 'Set the cron expression for automatic polling. Use the presets for common intervals.'],
            ['6  Notifications', 'Enter a team mailbox that will receive failure alerts, MDN errors and certificate expiry warnings.'],
          ].map(([title, desc]) => (
            <div key={title} className="flex flex-col gap-1">
              <span className="font-bold text-blue-900">{title}</span>
              <span className="leading-relaxed text-blue-600">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
