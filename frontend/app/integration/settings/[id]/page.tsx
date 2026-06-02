'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Play, Trash2, Save, TestTube2, Info,
  Server, Lock, Calendar, Bell, FileText, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Loader2,
  Wifi, Shield, Clock, Settings2,
} from 'lucide-react';
import {
  getEdiProcessingIntegration,
  createEdiProcessingIntegration,
  updateEdiProcessingIntegration,
  deleteEdiProcessingIntegration,
  runEdiProcessingIntegration,
  getVendors,
} from '@/lib/api';
import type {
  EdiProcessingIntegration, EdiIntegrationType, EdiTransportProto,
  EdiAuthMethod, EdiIntegrationStatus, FtpTlsMode, FtpTransferMode,
  As2MdnMode, As2SignAlgo, As2EncryptAlgo, ErrorStrategy, BackoffStrategy,
  Vendor,
} from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<EdiIntegrationType, { short: string; detail: string }> = {
  EDI_X12:   { short: 'EDI X12',    detail: '810 / 812 / 850 / 855 / 856 / 997' },
  EDIFACT:   { short: 'UN/EDIFACT', detail: 'INVOIC / ORDERS / ORDRSP / DESADV'  },
  XRECHNUNG: { short: 'XRechnung',  detail: 'UBL 2.1 / CII D16B'                 },
  CXML:      { short: 'cXML',       detail: 'PunchOut / Invoice / Purchase Order' },
};

const PROTO_INFO: Record<EdiTransportProto, { sub: string; defaultPort: number }> = {
  SFTP: { sub: 'SSH encrypted file transfer',     defaultPort: 22  },
  FTP:  { sub: 'FTP / FTP over TLS (FTPS)',        defaultPort: 21  },
  AS2:  { sub: 'AS2 over HTTPS (RFC 4130)',        defaultPort: 443 },
  AS4:  { sub: 'WS/ebMS 3.0 web-service transport',defaultPort: 443 },
};

const AUTH_INFO: Record<EdiAuthMethod, { label: string; sub: string }> = {
  PASSWORD:    { label: 'Username + Password',   sub: 'Basic credential pair'         },
  SSH_KEY:     { label: 'SSH Private Key',       sub: 'RSA / Ed25519 key-pair'        },
  CERTIFICATE: { label: 'X.509 Certificate',     sub: 'Mutual TLS / client cert auth' },
};

const TLS_MODES: { v: FtpTlsMode; l: string; d: string }[] = [
  { v: 'NONE',     l: 'None (plain FTP)',   d: 'No encryption — only on private networks' },
  { v: 'EXPLICIT', l: 'Explicit TLS (FTPES)', d: 'AUTH TLS upgrade on port 21 (preferred)' },
  { v: 'IMPLICIT', l: 'Implicit TLS (FTPS)',  d: 'TLS from connect — typically port 990'   },
];

const CRON_PRESETS = [
  { l: 'Every 5 min',   v: '*/5 * * * *'  },
  { l: 'Every 15 min',  v: '*/15 * * * *' },
  { l: 'Every 30 min',  v: '*/30 * * * *' },
  { l: 'Hourly',        v: '0 * * * *'    },
  { l: 'Every 2 h',     v: '0 */2 * * *'  },
  { l: 'Every 6 h',     v: '0 */6 * * *'  },
  { l: 'Daily midnight',v: '0 0 * * *'    },
  { l: 'Daily 6am',     v: '0 6 * * *'    },
  { l: 'Weekdays 8am',  v: '0 8 * * 1-5'  },
];

const TIMEZONES = [
  'UTC','America/New_York','America/Chicago','America/Los_Angeles',
  'Europe/London','Europe/Paris','Europe/Berlin','Europe/Amsterdam',
  'Asia/Kolkata','Asia/Singapore','Asia/Tokyo','Asia/Dubai','Australia/Sydney',
];

const AS2_SIGN:  As2SignAlgo[]    = ['SHA256','SHA384','SHA512','SHA1'];
const AS2_ENC:   As2EncryptAlgo[] = ['AES256','AES192','AES128','DES3','RC2'];

// ── Default state ─────────────────────────────────────────────────────────────

function empty(): EdiProcessingIntegration {
  return {
    id: '', name: '', description: '', vendorId: undefined,
    integrationType: 'EDI_X12', status: 'DRAFT',
    transport: {
      protocol: 'SFTP', host: '', port: 22,
      username: '', password: '', sshKeyRef: '',
      remoteInboxPath: '/inbound', remoteArchivePath: '/inbound/archive',
      remoteErrorPath: '/inbound/error', processedSuffix: '.processed',
      fileFilterPattern: '*.edi',
      connectionTimeoutSecs: 30, socketTimeoutSecs: 60,
      strictHostKeyChecking: true, compressionEnabled: false, keepAliveIntervalSecs: 30,
      passiveMode: true, tlsMode: 'EXPLICIT', transferMode: 'BINARY',
      as2MdnMode: 'SYNC', as2SignAlgorithm: 'SHA256', as2EncryptAlgorithm: 'AES256',
      as2Compress: false, as2MessageSubject: 'EDI Document',
      as2ContentType: 'application/edi-x12',
    },
    security: {
      authMethod: 'SSH_KEY', tlsRequired: true,
      encryptionEnabled: true, signatureRequired: false,
      tlsMinVersion: 'TLSv1.2',
    },
    schedule: { enabled: true, cron: '*/15 * * * *', timezone: 'UTC' },
    fileHandling: {
      errorStrategy: 'QUARANTINE', duplicateDetection: true,
      duplicateWindowHours: 24, decompress: true,
    },
    retry: {
      maxAttempts: 3, initialIntervalSecs: 60,
      backoffStrategy: 'EXPONENTIAL', backoffMultiplier: 2,
      maxIntervalSecs: 900, notifyAfterAttempts: 2,
    },
    notifications: {
      productionSupportEmail: '', notifyOnSuccess: false, notifyOnFailure: true,
    },
    createdAt: '', updatedAt: '',
  };
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'general' | 'transport' | 'security' | 'filehandling' | 'schedule' | 'notifications';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'general',       label: 'General',        icon: Settings2 },
  { key: 'transport',     label: 'Transport',       icon: Server    },
  { key: 'security',      label: 'Security',        icon: Lock      },
  { key: 'filehandling',  label: 'File Handling',   icon: FileText  },
  { key: 'schedule',      label: 'Schedule',        icon: Calendar  },
  { key: 'notifications', label: 'Notifications',   icon: Bell      },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntegrationSettingsFormPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isNew  = params.id === 'new';

  const [data, setData]     = useState<EdiProcessingIntegration>(empty());
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tab, setTab]       = useState<Tab>('general');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    getVendors({ size: 200 }).then((r: any) => setVendors(r.content ?? (Array.isArray(r) ? r : []))).catch(() => {});
    if (isNew) return;
    getEdiProcessingIntegration(params.id)
      .then((d: EdiProcessingIntegration) => setData(d))
      .catch(() => setError('Integration not found'))
      .finally(() => setLoading(false));
  }, [params.id, isNew]);

  const set = useCallback(<K extends keyof EdiProcessingIntegration>(k: K, v: EdiProcessingIntegration[K]) =>
    setData(d => ({ ...d, [k]: v })), []);
  const setT   = useCallback(<K extends keyof EdiProcessingIntegration['transport']>(k: K, v: any) =>
    setData(d => ({ ...d, transport:    { ...d.transport,    [k]: v } })), []);
  const setSec = useCallback(<K extends keyof EdiProcessingIntegration['security']>(k: K, v: any) =>
    setData(d => ({ ...d, security:     { ...d.security,     [k]: v } })), []);
  const setSch = useCallback(<K extends keyof EdiProcessingIntegration['schedule']>(k: K, v: any) =>
    setData(d => ({ ...d, schedule:     { ...d.schedule,     [k]: v } })), []);
  const setFH  = useCallback(<K extends keyof EdiProcessingIntegration['fileHandling']>(k: K, v: any) =>
    setData(d => ({ ...d, fileHandling: { ...d.fileHandling, [k]: v } })), []);
  const setRet = useCallback(<K extends keyof EdiProcessingIntegration['retry']>(k: K, v: any) =>
    setData(d => ({ ...d, retry:        { ...d.retry,        [k]: v } })), []);
  const setNot = useCallback(<K extends keyof EdiProcessingIntegration['notifications']>(k: K, v: any) =>
    setData(d => ({ ...d, notifications:{ ...d.notifications,[k]: v } })), []);

  const setProto = (proto: EdiTransportProto) => {
    setData(d => ({ ...d, transport: { ...d.transport, protocol: proto, port: PROTO_INFO[proto].defaultPort } }));
    setTestResult(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      if (isNew) await createEdiProcessingIntegration(data);
      else       await updateEdiProcessingIntegration(data.id, data);
      setSaved(true);
      setTimeout(() => router.push('/integration/settings'), 900);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Save failed');
    } finally { setSaving(false); }
  }

  async function onDelete() {
    if (!confirm(`Delete "${data.name}"? This cannot be undone.`)) return;
    await deleteEdiProcessingIntegration(data.id).catch(() => {});
    router.push('/integration/settings');
  }

  async function onRunNow() {
    setRunning(true);
    try { await runEdiProcessingIntegration(data.id); } finally { setRunning(false); }
  }

  async function onTest() {
    setTesting(true); setTestResult(null);
    await new Promise(r => setTimeout(r, 1200));
    const ok = data.transport.host.trim().length > 0 && data.transport.port > 0;
    setTestResult({ ok, msg: ok ? 'Connection established successfully.' : 'Host or port missing.' });
    setTesting(false);
  }

  const proto = data.transport.protocol;
  const isSftp = proto === 'SFTP', isFtp = proto === 'FTP';
  const isAs2  = proto === 'AS2',  isAs4 = proto === 'AS4';

  if (loading) return (
    <div className="py-20 text-center text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
      <p className="text-sm">Loading integration…</p>
    </div>
  );

  if (error && !isNew) return (
    <div className="py-20 text-center">
      <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">{error}</p>
      <Link href="/integration/settings" className="text-blue-600 hover:underline text-sm">← Back</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 flex-wrap">
            <Link href="/integration" className="hover:text-blue-600">Vendor Integrations</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/integration/settings" className="hover:text-blue-600">Integration Settings</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium">{isNew ? 'New Integration' : data.name}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{isNew ? 'Create Integration' : `Edit: ${data.name}`}</h1>
          {!isNew && (
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                data.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                data.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                {data.status}
              </span>
              {data.schedule.lastRunAt && (
                <span className="text-xs text-gray-400">
                  Last run: {new Date(data.schedule.lastRunAt).toLocaleString()}
                  {data.schedule.lastRunStatus && (
                    <span className={`ml-1 font-medium ${
                      data.schedule.lastRunStatus === 'SUCCESS' ? 'text-green-600' :
                      data.schedule.lastRunStatus === 'PARTIAL' ? 'text-amber-600' : 'text-red-600'}`}>
                      ({data.schedule.lastRunStatus})
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
        {!isNew && (
          <button onClick={onRunNow} disabled={running}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex-shrink-0">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running…' : 'Run Now'}
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit}>
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-6">

          {/* ══════════════ GENERAL ══════════════ */}
          {tab === 'general' && (
            <div className="space-y-5">
              <ST icon={Settings2} title="Integration Identity" desc="Name this integration and select what type of document it processes." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <F label="Integration Name *" help="Shown in the integrations list and alert emails.">
                  <input required className="fi" value={data.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Acme Corp — Inbound EDI 810" />
                </F>
                <F label="Status" help="Only ACTIVE integrations are polled by the scheduler.">
                  <select className="fi" value={data.status} onChange={e => set('status', e.target.value as EdiIntegrationStatus)}>
                    <option value="DRAFT">Draft — not yet active</option>
                    <option value="ACTIVE">Active — polls on schedule</option>
                    <option value="PAUSED">Paused — temporarily suspended</option>
                  </select>
                </F>
                <F label="Linked Vendor" className="md:col-span-2" help="Associates this integration with a vendor record for document matching and reporting.">
                  <select className="fi" value={data.vendorId ?? ''} onChange={e => set('vendorId', e.target.value ? Number(e.target.value) : undefined)}>
                    <option value="">— No vendor linked —</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </F>
                <F label="Description" className="md:col-span-2" help="Operational notes — what this integration does, who owns it.">
                  <textarea className="fi" rows={2} value={data.description ?? ''} onChange={e => set('description', e.target.value)}
                    placeholder="Receives daily EDI 810 invoice files from Acme Corp via SFTP. Processed at 06:00 UTC weekdays." />
                </F>
                <F label="Integration / Document Type *" className="md:col-span-2" help="The EDI standard the partner uses. Invoice vs Credit Memo is auto-detected from file content.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.entries(TYPE_LABELS) as [EdiIntegrationType, { short: string; detail: string }][]).map(([v, { short, detail }]) => (
                      <label key={v} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                        data.integrationType === v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="intType" value={v} checked={data.integrationType === v} onChange={() => set('integrationType', v)} className="mt-0.5 accent-blue-600" />
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{short}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{detail}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </F>
              </div>
            </div>
          )}

          {/* ══════════════ TRANSPORT ══════════════ */}
          {tab === 'transport' && (
            <div className="space-y-6">
              <ST icon={Server} title="Protocol" desc="Choose the transport protocol the partner uses to exchange files." />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['SFTP','FTP','AS2','AS4'] as EdiTransportProto[]).map(p => (
                  <label key={p} className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-all ${
                    proto === p ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="proto" value={p} checked={proto === p} onChange={() => setProto(p)} className="sr-only" />
                    <Wifi className={`w-6 h-6 ${proto === p ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-bold text-gray-800">{p}</span>
                    <span className="text-xs text-gray-400 text-center leading-tight">{PROTO_INFO[p].sub}</span>
                    <span className="text-xs text-gray-300">Port {PROTO_INFO[p].defaultPort}</span>
                  </label>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {isSftp ? 'SFTP Server & Authentication' : isFtp ? 'FTP Server & Authentication' : isAs2 ? 'AS2 Endpoint Configuration' : 'AS4 / ebMS 3.0 Configuration'}
                </h3>

                {/* Common: host / port / timeouts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <F label={isAs2 || isAs4 ? 'Partner Endpoint Hostname *' : 'Server Host / IP *'}
                    help="Hostname or IP address. For AS2/AS4, this is the domain part of the endpoint URL — fill the full URL below."
                    className="md:col-span-2">
                    <input required className="fi font-mono" value={data.transport.host} onChange={e => setT('host', e.target.value)}
                      placeholder={isSftp ? 'sftp.partner.example.com' : isFtp ? 'ftp.partner.example.com' : isAs2 ? 'as2.partner.example.com' : 'as4.partner.example.com'} />
                  </F>
                  <F label="Port *" help={`Default for ${proto}: ${PROTO_INFO[proto].defaultPort}`}>
                    <input required type="number" className="fi font-mono" value={data.transport.port} onChange={e => setT('port', Number(e.target.value))} />
                  </F>
                  <F label="Connection Timeout (s)" help="Seconds to wait for the initial TCP connection before aborting.">
                    <input type="number" className="fi" value={data.transport.connectionTimeoutSecs ?? 30} onChange={e => setT('connectionTimeoutSecs', Number(e.target.value))} min={5} max={300} />
                  </F>
                  <F label="Socket / Read Timeout (s)" help="Inactivity seconds before dropping a mid-transfer connection.">
                    <input type="number" className="fi" value={data.transport.socketTimeoutSecs ?? 60} onChange={e => setT('socketTimeoutSecs', Number(e.target.value))} min={10} max={600} />
                  </F>
                </div>

                {/* SFTP */}
                {isSftp && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <F label="Username" help="SSH login username on the remote SFTP server.">
                        <input className="fi" value={data.transport.username ?? ''} onChange={e => setT('username', e.target.value)} placeholder="edi_user" />
                      </F>
                      <F label="Password" help="Leave blank when using SSH key authentication.">
                        <PwdF value={data.transport.password ?? ''} onChange={v => setT('password', v)} show={showPwd} onToggle={() => setShowPwd(s => !s)} />
                      </F>
                      <F label="SSH Private Key Reference" className="md:col-span-2"
                        help="Vault path to your private key, e.g. vault://edi/partner/id_rsa. The scheduler retrieves the key at runtime — never paste raw key material here.">
                        <input className="fi font-mono text-xs" value={data.transport.sshKeyRef ?? ''} onChange={e => setT('sshKeyRef', e.target.value)} placeholder="vault://edi/acme/ssh_private_key" />
                      </F>
                      <F label="Server Host Key Fingerprint (SHA256)"
                        help="SHA256 fingerprint of the server's host key, e.g. SHA256:AbCdEf... Verified on every connect to prevent MITM attacks. Get it by running: ssh-keyscan -t rsa <host>">
                        <input className="fi font-mono text-xs" value={data.transport.serverFingerprint ?? ''} onChange={e => setT('serverFingerprint', e.target.value)} placeholder="SHA256:AAAA...base64encoded..." />
                      </F>
                      <F label="Known Hosts File Reference"
                        help="Vault path to a known_hosts file for host key verification. Alternative to entering fingerprints manually.">
                        <input className="fi font-mono text-xs" value={data.transport.knownHostsRef ?? ''} onChange={e => setT('knownHostsRef', e.target.value)} placeholder="vault://edi/known_hosts" />
                      </F>
                      <F label="Preferred Cipher Suites"
                        help="Comma-separated SSH cipher preference list. Leave blank for server defaults. Override only when the partner requires specific ciphers.">
                        <input className="fi font-mono text-xs" value={data.transport.preferredCiphers ?? ''} onChange={e => setT('preferredCiphers', e.target.value)} placeholder="aes256-ctr,aes256-cbc,aes128-ctr" />
                      </F>
                      <F label="Keep-Alive Interval (s)" help="Sends a no-op packet every N seconds to keep idle connections alive. 0 = disabled.">
                        <input type="number" className="fi" value={data.transport.keepAliveIntervalSecs ?? 30} onChange={e => setT('keepAliveIntervalSecs', Number(e.target.value))} min={0} max={300} />
                      </F>
                      <div className="flex flex-col gap-3 pt-1">
                        <CB checked={Boolean(data.transport.strictHostKeyChecking)} onChange={v => setT('strictHostKeyChecking', v)}
                          label="Strict host key checking" help="Reject connections whose host key doesn't match stored fingerprint. Required in production." />
                        <CB checked={Boolean(data.transport.compressionEnabled)} onChange={v => setT('compressionEnabled', v)}
                          label="Enable zlib compression" help="Compress data in transit. Useful for large files on slow WAN links." />
                      </div>
                    </div>
                  </div>
                )}

                {/* FTP */}
                {isFtp && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <F label="Username"><input className="fi" value={data.transport.username ?? ''} onChange={e => setT('username', e.target.value)} placeholder="ftpuser" /></F>
                      <F label="Password"><PwdF value={data.transport.password ?? ''} onChange={v => setT('password', v)} show={showPwd} onToggle={() => setShowPwd(s => !s)} /></F>
                      <F label="TLS Mode" className="md:col-span-2" help="Explicit TLS (FTPES) is preferred. Implicit (FTPS) uses port 990 by default.">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {TLS_MODES.map(m => (
                            <label key={m.v} className={`p-3 border rounded-xl cursor-pointer ${data.transport.tlsMode === m.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <input type="radio" name="tlsMode" value={m.v} checked={data.transport.tlsMode === m.v} onChange={() => setT('tlsMode', m.v)} className="sr-only" />
                              <div className="text-sm font-semibold text-gray-800">{m.l}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{m.d}</div>
                            </label>
                          ))}
                        </div>
                      </F>
                      <F label="Transfer Mode" help="Use BINARY for all EDI / XML files. ASCII may corrupt binary content.">
                        <div className="flex gap-3">
                          {(['BINARY','ASCII'] as FtpTransferMode[]).map(m => (
                            <label key={m} className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer ${data.transport.transferMode === m ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                              <input type="radio" name="txMode" value={m} checked={data.transport.transferMode === m} onChange={() => setT('transferMode', m)} className="accent-blue-600" />
                              <span className="text-sm font-medium">{m}</span>
                            </label>
                          ))}
                        </div>
                      </F>
                      <F label="Max Concurrent Connections" help="FTP connections kept open simultaneously. Most servers cap at 2–5 per user.">
                        <input type="number" className="fi" value={data.transport.maxConcurrentConnections ?? 2} onChange={e => setT('maxConcurrentConnections', Number(e.target.value))} min={1} max={20} />
                      </F>
                      <div className="pt-1">
                        <CB checked={Boolean(data.transport.passiveMode)} onChange={v => setT('passiveMode', v)}
                          label="Passive mode (PASV/EPSV)" help="Required when the client is behind NAT or a firewall. Active mode rarely works in cloud environments." />
                      </div>
                    </div>
                  </div>
                )}

                {/* AS2 */}
                {isAs2 && (
                  <div className="space-y-4">
                    <IB type="info" text="AS2 uses HTTP/HTTPS. Outbound messages are POSTed to the partner's endpoint URL. For inbound, the partner POSTs to your receive URL configured in their AS2 system." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <F label="Our AS2 Station ID *" help="The AS2-From value we present. Must match exactly what the partner has configured for us in their AS2 system.">
                        <input required className="fi font-mono" value={data.transport.as2Id ?? ''} onChange={e => setT('as2Id', e.target.value)} placeholder="OURCOMPANY_AS2" />
                      </F>
                      <F label="Partner AS2 ID *" help="The AS2-To value the partner expects. Found in their AS2 onboarding documentation.">
                        <input required className="fi font-mono" value={data.transport.as2PartnerId ?? ''} onChange={e => setT('as2PartnerId', e.target.value)} placeholder="PARTNER_AS2" />
                      </F>
                      <F label="Partner AS2 Endpoint URL *" className="md:col-span-2" help="Full HTTPS URL where we POST outbound messages. Usually ends in /HttpReceiver, /as2 or /edigate.">
                        <input required className="fi font-mono text-xs" value={data.transport.as2Url ?? ''} onChange={e => setT('as2Url', e.target.value)} placeholder="https://as2.partner.example.com/HttpReceiver" />
                      </F>
                      <F label="MDN Mode" help="SYNC: partner replies immediately in same HTTP response (recommended). ASYNC: partner POSTs MDN to your callback URL later.">
                        <select className="fi" value={data.transport.as2MdnMode ?? 'SYNC'} onChange={e => setT('as2MdnMode', e.target.value as As2MdnMode)}>
                          <option value="SYNC">SYNC — inline receipt in HTTP 200 response</option>
                          <option value="ASYNC">ASYNC — receipt POSTed to our callback URL</option>
                          <option value="NONE">NONE — no receipt confirmation requested</option>
                        </select>
                      </F>
                      <F label="Our MDN Callback URL (ASYNC only)" help="Your publicly accessible HTTPS URL where the partner sends async MDN receipts. Required when MDN Mode = ASYNC.">
                        <input className="fi font-mono text-xs" value={data.transport.as2MdnUrl ?? ''} onChange={e => setT('as2MdnUrl', e.target.value)} placeholder="https://procuretop.yourco.com/api/edi/as2/mdn" />
                      </F>
                      <F label="Message Signing Algorithm" help="SHA256 or stronger required by RFC 5751. SHA1 is deprecated and should only be used for legacy partners.">
                        <select className="fi" value={data.transport.as2SignAlgorithm ?? 'SHA256'} onChange={e => setT('as2SignAlgorithm', e.target.value as As2SignAlgo)}>
                          {AS2_SIGN.map(a => <option key={a} value={a}>{a} {a === 'SHA1' ? '(deprecated)' : ''}</option>)}
                        </select>
                      </F>
                      <F label="Payload Encryption Algorithm" help="AES256 is the current standard. DES3 / RC2 are legacy — use only when the partner requires it.">
                        <select className="fi" value={data.transport.as2EncryptAlgorithm ?? 'AES256'} onChange={e => setT('as2EncryptAlgorithm', e.target.value as As2EncryptAlgo)}>
                          {AS2_ENC.map(a => <option key={a} value={a}>{a} {['DES3','RC2'].includes(a) ? '(legacy)' : ''}</option>)}
                        </select>
                      </F>
                      <F label="Message Subject" help="MIME Subject header on outbound AS2 messages. Some partners use this for routing or identification.">
                        <input className="fi" value={data.transport.as2MessageSubject ?? 'EDI Document'} onChange={e => setT('as2MessageSubject', e.target.value)} />
                      </F>
                      <F label="Content-Type" help="MIME type of the EDI payload body.">
                        <select className="fi" value={data.transport.as2ContentType ?? 'application/edi-x12'} onChange={e => setT('as2ContentType', e.target.value)}>
                          <option value="application/edi-x12">application/edi-x12 (X12)</option>
                          <option value="application/edifact">application/edifact (EDIFACT)</option>
                          <option value="application/xml">application/xml (XML / cXML)</option>
                          <option value="text/plain">text/plain</option>
                        </select>
                      </F>
                      <div className="pt-1">
                        <CB checked={Boolean(data.transport.as2Compress)} onChange={v => setT('as2Compress', v)}
                          label="Compress payload (zlib/SMIME)"
                          help="Compress before signing and encrypting. Reduces size but adds overhead. Only enable if partner supports and requires it." />
                      </div>
                    </div>
                  </div>
                )}

                {/* AS4 */}
                {isAs4 && (
                  <div className="space-y-4">
                    <IB type="info" text="AS4 is built on SOAP + WS-Security + ebMS 3.0. Obtain the partner's Service specification or WSDL before configuring these fields." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <F label="MSH Endpoint URL *" className="md:col-span-2" help="Partner's Message Service Handler SOAP/HTTP endpoint.">
                        <input required className="fi font-mono text-xs" value={data.transport.as4Url ?? ''} onChange={e => setT('as4Url', e.target.value)} placeholder="https://as4.partner.example.com/services/MSH" />
                      </F>
                      <F label="WSDL URL" help="Partner's WSDL for WS-Security policy auto-discovery. Recommended.">
                        <input className="fi font-mono text-xs" value={data.transport.as4WsdlUrl ?? ''} onChange={e => setT('as4WsdlUrl', e.target.value)} placeholder="https://as4.partner.example.com/services/MSH?wsdl" />
                      </F>
                      <F label="Our Party ID *" help="Our ebMS Party ID — typically a URN or DUNS. e.g. urn:oasis:names:tc:ebcore:partyid-type:iso6523:0088:1234567890123">
                        <input required className="fi font-mono text-xs" value={data.transport.as4PartyId ?? ''} onChange={e => setT('as4PartyId', e.target.value)} placeholder="urn:party:ourcompany" />
                      </F>
                      <F label="Our Party Role"><input className="fi" value={data.transport.as4PartyRole ?? 'Sender'} onChange={e => setT('as4PartyRole', e.target.value)} /></F>
                      <F label="Partner Party ID *"><input required className="fi font-mono text-xs" value={data.transport.as4PartnerPartyId ?? ''} onChange={e => setT('as4PartnerPartyId', e.target.value)} placeholder="urn:party:partner" /></F>
                      <F label="Partner Party Role"><input className="fi" value={data.transport.as4PartnerPartyRole ?? 'Receiver'} onChange={e => setT('as4PartnerPartyRole', e.target.value)} /></F>
                      <F label="Service Name" help="ebMS Service element — from partner spec. Often a URN.">
                        <input className="fi font-mono text-xs" value={data.transport.as4ServiceName ?? ''} onChange={e => setT('as4ServiceName', e.target.value)} placeholder="http://docs.oasis-open.org/ebxml-msg/as4/v1.0/ns/invoice" />
                      </F>
                      <F label="Service Type"><input className="fi" value={data.transport.as4ServiceType ?? 'string'} onChange={e => setT('as4ServiceType', e.target.value)} /></F>
                      <F label="Action" help="ebMS Action identifying the business step, e.g. Invoice, OrderResponse.">
                        <input className="fi" value={data.transport.as4Action ?? ''} onChange={e => setT('as4Action', e.target.value)} placeholder="Invoice" />
                      </F>
                      <F label="Agreement Reference"><input className="fi font-mono text-xs" value={data.transport.as4AgreementRef ?? ''} onChange={e => setT('as4AgreementRef', e.target.value)} placeholder="urn:agreement:acme" /></F>
                      <F label="Message Partition Channel (MPC)" help="Leave blank to use the default ebMS MPC.">
                        <input className="fi font-mono text-xs" value={data.transport.as4MessagePartitionChannel ?? ''} onChange={e => setT('as4MessagePartitionChannel', e.target.value)} placeholder="http://docs.oasis-open.org/ebxml-msg/ebms/v3.0/ns/core/200704/defaultMPC" />
                      </F>
                      <F label="Our Receipt Callback URL" help="Where the partner sends non-repudiation receipts for outbound messages.">
                        <input className="fi font-mono text-xs" value={data.transport.as4ReceiptUrl ?? ''} onChange={e => setT('as4ReceiptUrl', e.target.value)} placeholder="https://procuretop.yourco.com/api/edi/as4/receipt" />
                      </F>
                      <F label="Payload Compression">
                        <select className="fi" value={data.transport.as4CompressionType ?? 'none'} onChange={e => setT('as4CompressionType', e.target.value)}>
                          <option value="none">None</option>
                          <option value="application/gzip">GZip (application/gzip)</option>
                        </select>
                      </F>
                      <div className="pt-1">
                        <CB checked={Boolean(data.transport.as4WsSecurityEnabled)} onChange={v => setT('as4WsSecurityEnabled', v)}
                          label="Enable WS-Security" help="Apply WS-Security SOAP headers (signing + encryption). Required by most AS4 MSH implementations." />
                      </div>
                    </div>
                  </div>
                )}

                {/* Remote paths — SFTP/FTP only */}
                {(isSftp || isFtp) && (
                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Remote Directories &amp; File Filter</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <F label="Inbox Path *" help="Directory the scheduler polls. Files matching the filter pattern are picked up from here.">
                        <input required className="fi font-mono text-sm" value={data.transport.remoteInboxPath} onChange={e => setT('remoteInboxPath', e.target.value)} placeholder="/inbound/invoices" />
                      </F>
                      <F label="Archive Path" help="Processed files are moved here. Leave blank to delete after processing.">
                        <input className="fi font-mono text-sm" value={data.transport.remoteArchivePath ?? ''} onChange={e => setT('remoteArchivePath', e.target.value)} placeholder="/inbound/invoices/archive" />
                      </F>
                      <F label="Error / Dead-Letter Path" help="Files that fail all retries are moved here for manual inspection. Strongly recommended.">
                        <input className="fi font-mono text-sm" value={data.transport.remoteErrorPath ?? ''} onChange={e => setT('remoteErrorPath', e.target.value)} placeholder="/inbound/invoices/error" />
                      </F>
                      <F label="Processed Marker Suffix" help="The original file is renamed with this suffix after successful parsing to prevent re-processing on the next poll.">
                        <input className="fi font-mono text-sm" value={data.transport.processedSuffix} onChange={e => setT('processedSuffix', e.target.value)} placeholder=".processed" />
                      </F>
                      <F label="File Filter Pattern" className="md:col-span-2"
                        help="Glob pattern. Only files matching this pattern are processed. Multiple patterns comma-separated: *.edi,invoice_*.x12,*.txt">
                        <input className="fi font-mono text-sm" value={data.transport.fileFilterPattern ?? ''} onChange={e => setT('fileFilterPattern', e.target.value)} placeholder="*.edi, *.x12, invoice_*.txt" />
                      </F>
                    </div>
                  </div>
                )}
              </div>

              {/* Test connection */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 border border-gray-200">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Test Connection</div>
                  <div className="text-xs text-gray-400 mt-0.5">Verify host reachability, credentials and inbox path access.</div>
                </div>
                <div className="flex items-center gap-3">
                  {testResult && (
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                      {testResult.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {testResult.msg}
                    </span>
                  )}
                  <button type="button" onClick={onTest} disabled={testing}
                    className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50">
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
                    {testing ? 'Testing…' : 'Test Connection'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ SECURITY ══════════════ */}
          {tab === 'security' && (
            <div className="space-y-5">
              <ST icon={Shield} title="Security Configuration" desc="Certificates, keys and TLS settings. Reference secrets by vault path — never paste raw keys here." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <F label="Authentication Method" className="md:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(Object.entries(AUTH_INFO) as [EdiAuthMethod, { label: string; sub: string }][]).map(([v, { label, sub }]) => (
                      <label key={v} className={`p-3 border rounded-xl cursor-pointer ${data.security.authMethod === v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="authMethod" value={v} checked={data.security.authMethod === v} onChange={() => setSec('authMethod', v)} className="sr-only" />
                        <div className="text-sm font-semibold text-gray-800">{label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                      </label>
                    ))}
                  </div>
                </F>
                <F label="Our Key Store Reference" help="Vault path to our PKCS12/JKS key store (private key + certificate for signing and mutual TLS).">
                  <input className="fi font-mono text-xs" value={data.security.keystoreRef ?? ''} onChange={e => setSec('keystoreRef', e.target.value)} placeholder="vault://edi/certs/our_keystore.p12" />
                </F>
                <F label="Key Store Password"><PwdF value={data.security.keystorePassword ?? ''} onChange={v => setSec('keystorePassword', v)} show={showPwd} onToggle={() => setShowPwd(s => !s)} /></F>
                <F label="Our Signing Certificate Reference" help="Vault path to our PEM certificate. Partners use this to verify our message signatures.">
                  <input className="fi font-mono text-xs" value={data.security.ourCertificateRef ?? ''} onChange={e => setSec('ourCertificateRef', e.target.value)} placeholder="vault://edi/certs/our_signing_cert.pem" />
                </F>
                <F label="Partner Public Certificate Reference" help="Vault path to the partner's PEM certificate. Used to encrypt outbound and verify inbound signatures.">
                  <input className="fi font-mono text-xs" value={data.security.partnerCertificateRef ?? ''} onChange={e => setSec('partnerCertificateRef', e.target.value)} placeholder="vault://edi/certs/partner_public_cert.pem" />
                </F>
                <F label="Trust Store Reference" help="Vault path to JKS/PKCS12 trust store with trusted CA certificates for TLS verification.">
                  <input className="fi font-mono text-xs" value={data.security.truststoreRef ?? ''} onChange={e => setSec('truststoreRef', e.target.value)} placeholder="vault://edi/certs/truststore.jks" />
                </F>
                <F label="Trust Store Password"><PwdF value={data.security.truststorePassword ?? ''} onChange={v => setSec('truststorePassword', v)} show={showPwd} onToggle={() => setShowPwd(s => !s)} /></F>
                <F label="Minimum TLS Version" help="TLSv1.2 is the minimum acceptable standard in production environments.">
                  <select className="fi" value={data.security.tlsMinVersion ?? 'TLSv1.2'} onChange={e => setSec('tlsMinVersion', e.target.value)}>
                    <option value="TLSv1.2">TLSv1.2 (recommended minimum)</option>
                    <option value="TLSv1.3">TLSv1.3 (most secure)</option>
                  </select>
                </F>
                <F label="Allowed TLS Cipher Suites" help="Comma-separated. Leave blank for JVM defaults. Override only when the partner mandates specific ciphers.">
                  <input className="fi font-mono text-xs" value={data.security.tlsCipherSuites ?? ''} onChange={e => setSec('tlsCipherSuites', e.target.value)} placeholder="TLS_AES_256_GCM_SHA384,TLS_AES_128_GCM_SHA256" />
                </F>
                <div className="md:col-span-2 flex flex-wrap gap-5 pt-1">
                  <CB checked={data.security.tlsRequired} onChange={v => setSec('tlsRequired', v)} label="TLS required" help="Reject any plaintext connection." />
                  <CB checked={data.security.encryptionEnabled} onChange={v => setSec('encryptionEnabled', v)} label="Payload encryption enabled" help="Encrypt the EDI payload with the partner certificate." />
                  <CB checked={data.security.signatureRequired} onChange={v => setSec('signatureRequired', v)} label="Digital signature required" help="Sign outbound and validate inbound message signatures." />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ FILE HANDLING & RETRY ══════════════ */}
          {tab === 'filehandling' && (
            <div className="space-y-6">
              <ST icon={FileText} title="File Handling" desc="Validation, deduplication and error behaviour for inbound files." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <F label="Error Handling Strategy" className="md:col-span-2"
                  help="What to do when a file fails processing after all retries are exhausted.">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { v: 'QUARANTINE', l: 'Quarantine (recommended)', d: 'Move to error path; continue polling.' },
                      { v: 'SKIP',       l: 'Skip',                      d: 'Log error; leave file in inbox; continue.' },
                      { v: 'STOP',       l: 'Stop',                      d: 'Halt all processing; alert immediately.' },
                    ] as { v: ErrorStrategy; l: string; d: string }[]).map(({ v, l, d }) => (
                      <label key={v} className={`p-3 border rounded-xl cursor-pointer ${data.fileHandling.errorStrategy === v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="errStrat" value={v} checked={data.fileHandling.errorStrategy === v} onChange={() => setFH('errorStrategy', v)} className="sr-only" />
                        <div className="text-sm font-semibold text-gray-800">{l}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{d}</div>
                      </label>
                    ))}
                  </div>
                </F>
                <F label="Max File Size (KB)" help="Files larger than this are rejected without processing. 0 = no limit.">
                  <input type="number" className="fi" value={data.fileHandling.maxFileSizeKb ?? 0} onChange={e => setFH('maxFileSizeKb', Number(e.target.value))} min={0} />
                </F>
                <F label="Expected Character Encoding" help="Encoding mismatch causes garbled field extraction.">
                  <select className="fi" value={data.fileHandling.expectedEncodings ?? 'UTF-8'} onChange={e => setFH('expectedEncodings', e.target.value)}>
                    {['UTF-8','UTF-16','ISO-8859-1','Windows-1252','US-ASCII'].map(enc => <option key={enc} value={enc}>{enc}</option>)}
                  </select>
                </F>
                <div className="flex flex-col gap-3">
                  <CB checked={Boolean(data.fileHandling.duplicateDetection)} onChange={v => setFH('duplicateDetection', v)}
                    label="Duplicate detection" help="Check filename + hash against previously processed files." />
                  <CB checked={Boolean(data.fileHandling.decompress)} onChange={v => setFH('decompress', v)}
                    label="Auto-decompress (.gz / .zip)" help="Unpack compressed archives before parsing." />
                </div>
                <F label="Duplicate Look-Back Window (hours)" help="How far back to check for duplicates.">
                  <input type="number" className="fi" value={data.fileHandling.duplicateWindowHours ?? 24}
                    onChange={e => setFH('duplicateWindowHours', Number(e.target.value))} min={1} max={720}
                    disabled={!data.fileHandling.duplicateDetection} />
                </F>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <ST icon={RefreshCw} title="Retry Policy" desc="Automatic retries for transient failures (network blips, server unavailable)." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                  <F label="Max Retry Attempts" help="0 = no retries. After exhausting attempts, error strategy applies.">
                    <input type="number" className="fi" value={data.retry.maxAttempts} onChange={e => setRet('maxAttempts', Number(e.target.value))} min={0} max={20} />
                  </F>
                  <F label="Initial Retry Interval (s)" help="Wait time before the first retry.">
                    <input type="number" className="fi" value={data.retry.initialIntervalSecs} onChange={e => setRet('initialIntervalSecs', Number(e.target.value))} min={10} max={3600} />
                  </F>
                  <F label="Backoff Strategy" help="How the interval grows between successive retries.">
                    <select className="fi" value={data.retry.backoffStrategy} onChange={e => setRet('backoffStrategy', e.target.value as BackoffStrategy)}>
                      <option value="FIXED">Fixed — same interval every retry</option>
                      <option value="LINEAR">Linear — adds initial interval each time</option>
                      <option value="EXPONENTIAL">Exponential — interval × multiplier (recommended)</option>
                    </select>
                  </F>
                  {data.retry.backoffStrategy === 'EXPONENTIAL' && (
                    <F label="Backoff Multiplier" help="e.g. 2 means 60s → 120s → 240s → 480s…">
                      <input type="number" step="0.5" className="fi" value={data.retry.backoffMultiplier ?? 2} onChange={e => setRet('backoffMultiplier', Number(e.target.value))} min={1.5} max={10} />
                    </F>
                  )}
                  <F label="Max Retry Interval (s)" help="Cap so backoff doesn't grow indefinitely.">
                    <input type="number" className="fi" value={data.retry.maxIntervalSecs ?? 900} onChange={e => setRet('maxIntervalSecs', Number(e.target.value))} min={60} max={86400} />
                  </F>
                  <F label="Alert After N Attempts" help="Send notification after this many failures, before exhausting all retries.">
                    <input type="number" className="fi" value={data.retry.notifyAfterAttempts ?? 2} onChange={e => setRet('notifyAfterAttempts', Number(e.target.value))} min={1} max={20} />
                  </F>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ SCHEDULE ══════════════ */}
          {tab === 'schedule' && (
            <div className="space-y-5">
              <ST icon={Clock} title="Polling Schedule" desc="When the engine polls the partner's inbox for new files." />
              <CB checked={data.schedule.enabled} onChange={v => setSch('enabled', v)}
                label="Scheduled polling enabled" help="When off, files are only processed via 'Run Now'." />

              <div className={`space-y-5 ${!data.schedule.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <F label="Cron Expression"
                  help="Standard 5-field cron: minute(0-59) hour(0-23) day-of-month(1-31) month(1-12) day-of-week(0-7). Use * for every unit, */N for every N units.">
                  <input className="fi font-mono" value={data.schedule.cron} onChange={e => setSch('cron', e.target.value)} placeholder="*/15 * * * *" />
                  <p className="text-xs text-gray-400 mt-1.5 font-mono bg-gray-50 rounded p-2">
                    minute(0-59) &nbsp; hour(0-23) &nbsp; day(1-31) &nbsp; month(1-12) &nbsp; weekday(0-7,Sun=0/7)
                  </p>
                </F>

                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Quick presets</p>
                  <div className="flex flex-wrap gap-2">
                    {CRON_PRESETS.map(({ l, v }) => (
                      <button key={v} type="button" onClick={() => setSch('cron', v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          data.schedule.cron === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <F label="Timezone" help="The timezone the cron expression is evaluated in. UTC is recommended for production.">
                  <select className="fi" value={data.schedule.timezone} onChange={e => setSch('timezone', e.target.value)}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </F>

                {data.schedule.nextRunAt && (
                  <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-blue-700">Next scheduled run</div>
                      <div className="text-sm text-blue-900">{new Date(data.schedule.nextRunAt).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              <IB type="tip" text="For time-sensitive invoices, poll every 5–15 minutes. For daily price list updates, once a day at 6am is sufficient. Over-polling adds load without benefit and may trigger partner rate limits." />
            </div>
          )}

          {/* ══════════════ NOTIFICATIONS ══════════════ */}
          {tab === 'notifications' && (
            <div className="space-y-5">
              <ST icon={Bell} title="Notification Settings" desc="Who gets alerted when files process, fail, or exhaust retries." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <F label="Production Support Email *" className="md:col-span-2"
                  help="Use a team mailbox monitored 24/7 — not an individual's address. This also receives MDN failures (AS2), WS-Security errors (AS4) and certificate expiry warnings.">
                  <input required type="email" className="fi" value={data.notifications.productionSupportEmail}
                    onChange={e => setNot('productionSupportEmail', e.target.value)} placeholder="edi-support@yourco.example" />
                </F>
                <div className="md:col-span-2 flex flex-col gap-3">
                  <CB checked={Boolean(data.notifications.notifyOnFailure)} onChange={v => setNot('notifyOnFailure', v)}
                    label="Alert on processing failure" help="Send email when a file fails and all retries are exhausted. Strongly recommended." />
                  <CB checked={Boolean(data.notifications.notifyOnSuccess)} onChange={v => setNot('notifyOnSuccess', v)}
                    label="Confirm on successful processing" help="Send confirmation per processed file. Useful for audit but can be noisy — consider only for critical integrations." />
                </div>
              </div>
              <IB type="warning" text="Certificate expiry warnings are sent 30 and 7 days before expiry. Expired certificates will cause all AS2/AS4 message exchange to fail — keep them updated in your vault and rotate the references here." />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              {!isNew && (
                <button type="button" onClick={onDelete} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <Link href="/integration/settings"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </Link>
              <button type="submit" disabled={saving}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : saved ? 'Saved!' : isNew ? 'Create Integration' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ST({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3 pb-1">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

function F({ label, children, className = '', help }: {
  label: string; children: React.ReactNode; className?: string; help?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}
        {help && <span className="ml-1 text-gray-300" title={help}><Info className="w-3 h-3 inline cursor-help" /></span>}
      </label>
      {children}
      {help && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{help}</p>}
    </div>
  );
}

function CB({ checked, onChange, label, help }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; help?: string;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded accent-blue-600 flex-shrink-0" />
      <div>
        <span className="text-sm text-gray-700">{label}</span>
        {help && <p className="text-xs text-gray-400 mt-0.5">{help}</p>}
      </div>
    </label>
  );
}

function PwdF({ value, onChange, show, onToggle }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} className="fi pr-10" value={value}
        onChange={e => onChange(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
      <button type="button" onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function IB({ text, type = 'info' }: { text: string; type?: 'info' | 'tip' | 'warning' }) {
  const s = {
    info:    { bg: 'bg-blue-50  border-blue-100',  t: 'text-blue-700',  I: Info          },
    tip:     { bg: 'bg-green-50 border-green-100', t: 'text-green-700', I: CheckCircle   },
    warning: { bg: 'bg-amber-50 border-amber-100', t: 'text-amber-700', I: AlertTriangle },
  }[type];
  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${s.bg}`}>
      <s.I className={`w-4 h-4 mt-0.5 flex-shrink-0 ${s.t}`} />
      <p className={`text-xs leading-relaxed ${s.t}`}>{text}</p>
    </div>
  );
}
