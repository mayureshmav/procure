'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getVendors, getIntegrations, saveIntegration, updateIntegration,
  deleteIntegration, testIntegration,
  getEdiConfig, saveEdiConfig, updateEdiConfig, getEdiDocuments,
  getCatalogFeedConfig, saveCatalogFeedConfig,
  getImportJobs, uploadCatalog,
  getOcrDocuments, getOcrQueueStats, uploadOcrDocument, reprocessOcrDocument,
  getPoDeliveryPreferences, savePoDeliveryPreferences,
  getPoIntegrationConfig, savePoIntegrationConfig, testPoIntegrationConn,
  getCompanies,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Vendor, Integration, ProtocolType, IntegrationPurpose, IntegrationPartyType,
  EdiStandard, EdiDocType, EdiDirection, EdiAckMode,
  EdiInterchangeConfig, EdiTransactionSet, EdiDocument,
  CatalogFeedConfig, CatalogColumnMapping, MergeMode,
  FileFormatType, ImportJob, PagedResponse,
  OcrDocument, OcrDocumentStatus, OcrQueueStats,
  PoDeliveryPreferences, PoIntegrationConfig, PoFileFormat,
  Company,
} from '@/types';
import Modal from '@/components/Modal';
import {
  Plus, Pencil, Trash2, Zap, CheckCircle, XCircle, Wifi,
  FileText, Upload, RefreshCw, ChevronDown, ChevronUp,
  Loader2, AlertCircle, Save, Settings2, Database,
  ArrowDown, ArrowUp, ArrowLeftRight, History, Cable,
  Info, FileCode2, ScanLine, Eye, RotateCcw, Link2,
  Mail, Globe, Cpu, SendHorizonal,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

type Tab = 'connections' | 'edi' | 'catalog' | 'history' | 'ocr' | 'po-delivery';

const PROTOCOL_COLORS: Record<ProtocolType, string> = {
  SFTP: 'bg-blue-100 text-blue-700',
  FTP:  'bg-green-100 text-green-700',
  AS2:  'bg-purple-100 text-purple-700',
  AS4:  'bg-orange-100 text-orange-700',
};

const PURPOSE_META: Array<{
  purpose: IntegrationPurpose;
  label: string;
  description: string;
  icon: React.ElementType;
  badgeCls: string;
}> = [
  {
    purpose: 'EDI_EDIFACT',
    label: 'EDI / EDIFACT',
    description: 'Electronic invoice, PO & ASN exchange via ANSI X12 or UN/EDIFACT',
    icon: FileCode2,
    badgeCls: 'bg-blue-100 text-blue-700',
  },
  {
    purpose: 'CATALOG',
    label: 'Catalog Integration',
    description: 'Automated product catalogue & pricing sync from vendor',
    icon: Database,
    badgeCls: 'bg-green-100 text-green-700',
  },
  {
    purpose: 'OCR',
    label: 'OCR / Invoice Processing',
    description: 'SFTP or email pickup of scanned invoices for OCR data extraction',
    icon: ScanLine,
    badgeCls: 'bg-orange-100 text-orange-700',
  },
  {
    purpose: 'PO_DELIVERY',
    label: 'PO Delivery',
    description: 'Automated outbound push of purchase orders to vendor or buyer endpoint',
    icon: SendHorizonal,
    badgeCls: 'bg-purple-100 text-purple-700',
  },
  {
    purpose: 'GENERAL',
    label: 'General File Transfer',
    description: 'Generic SFTP / FTP / AS2 connection for custom file exchange',
    icon: Wifi,
    badgeCls: 'bg-gray-100 text-gray-600',
  },
];

// X12 transaction sets
const X12_SETS: Array<{ docType: EdiDocType; label: string; description: string; defaultDir: EdiDirection }> = [
  { docType: '832',  label: '832 – Price/Sales Catalog',      description: 'Vendor sends product & pricing updates',          defaultDir: 'INBOUND'  },
  { docType: '850',  label: '850 – Purchase Order',            description: 'Buyer sends purchase orders to vendor',           defaultDir: 'OUTBOUND' },
  { docType: '855',  label: '855 – PO Acknowledgment',         description: 'Vendor confirms/rejects purchase orders',         defaultDir: 'INBOUND'  },
  { docType: '856',  label: '856 – Ship Notice (ASN)',          description: 'Vendor sends advance shipment notice',            defaultDir: 'INBOUND'  },
  { docType: '810',  label: '810 – Invoice',                   description: 'Vendor sends invoices for delivered goods',       defaultDir: 'INBOUND'  },
  { docType: '997',  label: '997 – Functional Acknowledgment', description: 'Auto-acknowledge interchange receipts',           defaultDir: 'BOTH'     },
];

// EDIFACT message types
const EDIFACT_SETS: Array<{ docType: EdiDocType; label: string; description: string; defaultDir: EdiDirection }> = [
  { docType: 'PRICAT',  label: 'PRICAT – Price/Sales Catalogue', description: 'Vendor sends product & pricing catalogue',       defaultDir: 'INBOUND'  },
  { docType: 'ORDERS',  label: 'ORDERS – Purchase Order',        description: 'Buyer sends purchase orders to vendor',          defaultDir: 'OUTBOUND' },
  { docType: 'ORDRSP',  label: 'ORDRSP – Order Response',        description: 'Vendor confirms or rejects purchase orders',     defaultDir: 'INBOUND'  },
  { docType: 'DESADV',  label: 'DESADV – Despatch Advice (ASN)', description: 'Vendor sends advance despatch notification',     defaultDir: 'INBOUND'  },
  { docType: 'INVOIC',  label: 'INVOIC – Invoice',               description: 'Vendor sends invoices for delivered goods',      defaultDir: 'INBOUND'  },
  { docType: 'CONTRL',  label: 'CONTRL – Syntax/Application Ack','description': 'EDIFACT functional acknowledgment message',    defaultDir: 'BOTH'     },
];

// ISA qualifier codes
const ISA_QUALIFIERS = [
  { code: '01', label: '01 – Duns' },
  { code: '08', label: '08 – UCC EDI Comm ID' },
  { code: '12', label: '12 – Phone Number' },
  { code: '14', label: '14 – Duns + Suffix' },
  { code: '16', label: '16 – DUNS Number' },
  { code: '20', label: '20 – Health Industry #' },
  { code: 'ZZ', label: 'ZZ – Mutually Defined' },
];

const CATALOG_SYSTEM_FIELDS = [
  'sku', 'vendorSku', 'name', 'description', 'category', 'subCategory',
  'brand', 'manufacturer', 'unitPrice', 'costPrice', 'rrp', 'uom',
  'currencyCode', 'taxCode', 'taxRatePct', 'gtin', 'upc', 'ean',
  'minOrderQty', 'maxOrderQty', 'orderIncrement', 'leadTimeDays',
  'caseQty', 'shelfLifeDays', 'storageTemp', 'countryOfOrigin',
  'effectiveDate', 'expireDate', 'productStatus', 'catchWeight',
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />,
  PROCESSING: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  QUEUED:     <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />,
  SENT:       <ArrowUp className="w-4 h-4 text-blue-500" />,
  RECEIVED:   <ArrowDown className="w-4 h-4 text-green-500" />,
  COMPLETED:  <CheckCircle className="w-4 h-4 text-green-600" />,
  ACKNOWLEDGED: <CheckCircle className="w-4 h-4 text-green-600" />,
  PARTIAL:    <AlertCircle className="w-4 h-4 text-yellow-500" />,
  FAILED:     <XCircle className="w-4 h-4 text-red-500" />,
  REJECTED:   <XCircle className="w-4 h-4 text-red-500" />,
};

const ACK_BADGE: Record<string, string> = {
  PENDING:               'bg-yellow-100 text-yellow-700',
  ACCEPTED:              'bg-green-100 text-green-700',
  ACCEPTED_WITH_ERRORS:  'bg-orange-100 text-orange-700',
  REJECTED:              'bg-red-100 text-red-700',
  NOT_REQUIRED:          'bg-gray-100 text-gray-500',
};

const EMPTY_INTEGRATION: Partial<Integration> = {
  partyType: 'VENDOR',
  purpose: 'GENERAL',
  protocolType: 'SFTP', host: '', port: 22, username: '',
  remoteDirectory: '/', filePattern: '*.csv', active: true,
};

const DEFAULT_EDI_CONFIG = (standard: EdiStandard): EdiInterchangeConfig => ({
  standard,
  active: true,
  isaVersion: standard === 'X12' ? '00401' : undefined,
  isaUsageIndicator: 'P',
  isaAckRequested: true,
  unbSyntaxId: standard === 'EDIFACT' ? 'UNOA' : undefined,
  unbSyntaxVersion: standard === 'EDIFACT' ? '3' : undefined,
  transactionSets: (standard === 'X12' ? X12_SETS : EDIFACT_SETS).map(s => ({
    docType: s.docType, enabled: false, direction: s.defaultDir,
    ackRequired: s.docType !== '997' && s.docType !== 'CONTRL',
    ackMode: 'ASYNC',
  })),
});

const DEFAULT_FEED_CONFIG = (): CatalogFeedConfig => ({
  autoImport: false,
  pollFrequencyMinutes: 60,
  defaultFormatType: 'CSV',
  mergeMode: 'UPDATE',
  archiveAfterImport: true,
  notifyOnComplete: false,
  columnMappings: [],
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${on ? 'bg-blue-600' : 'bg-gray-200'}`}>
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function VendorIntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as Tab) || 'connections';
  const { canAccess } = useAuth();
  const canManage = canAccess('integration', 'manage');
  const canView   = canAccess('integration', 'view');

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  // ── Connections state ──────────────────────────────────────────────────────
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connLoading, setConnLoading]   = useState(true);
  const [showConnModal, setShowConnModal] = useState(false);
  const [editingConn, setEditingConn]   = useState<Partial<Integration>>(EMPTY_INTEGRATION);
  const [isConnEdit, setIsConnEdit]     = useState(false);
  const [connVendor, setConnVendor]     = useState<number | ''>('');
  const [testing, setTesting]           = useState<number | null>(null);
  const [testResults, setTestResults]   = useState<Record<number, boolean>>({});
  const [connPartyType, setConnPartyType] = useState<IntegrationPartyType>('VENDOR');
  const [connCompany, setConnCompany]   = useState<number | ''>('');
  const [companies, setCompanies]       = useState<Company[]>([]);

  // ── EDI state ──────────────────────────────────────────────────────────────
  const [ediConfig, setEdiConfig]       = useState<EdiInterchangeConfig | null>(null);
  const [ediSaving, setEdiSaving]       = useState(false);
  const [ediDirty, setEdiDirty]         = useState(false);
  const [ediStandard, setEdiStandard]   = useState<EdiStandard>('X12');

  // ── Catalog Feed state ────────────────────────────────────────────────────
  const [feedConfig, setFeedConfig]     = useState<CatalogFeedConfig>(DEFAULT_FEED_CONFIG());
  const [feedSaving, setFeedSaving]     = useState(false);
  const [feedDirty, setFeedDirty]       = useState(false);
  const [newMapping, setNewMapping]     = useState<Partial<CatalogColumnMapping>>({ sourceColumn: '', targetField: '' });

  // ── History state ─────────────────────────────────────────────────────────
  const [ediDocs, setEdiDocs]           = useState<EdiDocument[]>([]);
  const [importJobs, setImportJobs]     = useState<ImportJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTab, setHistoryTab]     = useState<'edi' | 'catalog'>('edi');
  const [expandedJob, setExpandedJob]   = useState<number | null>(null);

  // OCR state
  const [ocrDocs, setOcrDocs]           = useState<OcrDocument[]>([]);
  const [ocrStats, setOcrStats]         = useState<OcrQueueStats | null>(null);
  const [ocrLoading, setOcrLoading]     = useState(false);
  const [ocrFilter, setOcrFilter]       = useState<OcrDocumentStatus | ''>('');
  const [ocrSearch, setOcrSearch]       = useState('');
  const [ocrPage, setOcrPage]           = useState(0);
  const [ocrTotalPages, setOcrTotalPages] = useState(0);
  const ocrFileRef                      = useRef<HTMLInputElement>(null);

  // PO Delivery state
  const DEFAULT_PO_DELIVERY = (): PoDeliveryPreferences => ({
    emailEnabled: true, emailFormat: 'PDF', emailTo: '',
    portalEnabled: false, integrationEnabled: false,
  });
  const DEFAULT_PO_INTEGRATION = (): PoIntegrationConfig => ({
    active: true, protocol: 'SFTP', host: '', port: 22,
    username: '', password: '', remoteDirectory: '/', fileFormat: 'PDF' as any,
  });
  const [poDelivery, setPoDelivery]         = useState<PoDeliveryPreferences>(DEFAULT_PO_DELIVERY());
  const [poIntegration, setPoIntegration]   = useState<PoIntegrationConfig>(DEFAULT_PO_INTEGRATION());
  const [poDeliverySaving, setPoDeliverySaving] = useState(false);
  const [poIntSaving, setPoIntSaving]       = useState(false);
  const [poIntTesting, setPoIntTesting]     = useState(false);
  const [poIntTestResult, setPoIntTestResult] = useState<boolean | null>(null);
  const [poDeliveryDirty, setPoDeliveryDirty] = useState(false);
  const [poIntDirty, setPoIntDirty]         = useState(false);

  // ── Load base data ─────────────────────────────────────────────────────────
  const loadConnections = useCallback(() => {
    setConnLoading(true);
    getIntegrations().catch(() => [])
      .then(setIntegrations)
      .finally(() => setConnLoading(false));
  }, []);

  useEffect(() => {
    getVendors().then(setVendors);
    getCompanies().then(d => setCompanies(Array.isArray(d) ? d : (d?.data ?? []))).catch(() => {});
    loadConnections();
  }, [loadConnections]);

  // ── Load vendor-specific data when vendor changes ──────────────────────────
  useEffect(() => {
    if (!selectedVendorId) { setEdiConfig(null); setFeedConfig(DEFAULT_FEED_CONFIG()); return; }
    getEdiConfig(Number(selectedVendorId)).then(cfg => {
      if (cfg) { setEdiConfig(cfg); setEdiStandard(cfg.standard); }
      else setEdiConfig(null);
      setEdiDirty(false);
    });
    getCatalogFeedConfig(Number(selectedVendorId)).then(cfg => {
      setFeedConfig(cfg ?? DEFAULT_FEED_CONFIG());
      setFeedDirty(false);
    });
  }, [selectedVendorId]);

  // ── Load history ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    Promise.all([
      getEdiDocuments(selectedVendorId || undefined).catch(() => []),
      getImportJobs().then(r => (r as PagedResponse<ImportJob>).content ?? []).catch(() => []),
    ]).then(([docs, jobs]) => { setEdiDocs(docs); setImportJobs(jobs); })
      .finally(() => setHistoryLoading(false));
  }, [selectedVendorId]);

  useEffect(() => { if (activeTab === 'history') loadHistory(); }, [activeTab, loadHistory]);

  const loadOcr = useCallback((page = 0) => {
    setOcrLoading(true);
    Promise.all([
      getOcrDocuments({ page, size: 20, status: ocrFilter || undefined, search: ocrSearch || undefined })
        .catch(() => ({ content: [], totalPages: 0 })),
      getOcrQueueStats().catch(() => null),
    ]).then(([docs, stats]) => {
      setOcrDocs((docs as any).content ?? []);
      setOcrTotalPages((docs as any).totalPages ?? 0);
      setOcrStats(stats as OcrQueueStats | null);
      setOcrPage(page);
    }).finally(() => setOcrLoading(false));
  }, [ocrFilter, ocrSearch]);

  useEffect(() => { if (activeTab === 'ocr') loadOcr(0); }, [activeTab, loadOcr]);

  // Load PO delivery config when vendor changes or tab is active
  useEffect(() => {
    if (!selectedVendorId) return;
    getPoDeliveryPreferences(Number(selectedVendorId)).then(cfg => {
      setPoDelivery(cfg ?? DEFAULT_PO_DELIVERY());
      setPoDeliveryDirty(false);
    });
    getPoIntegrationConfig(Number(selectedVendorId)).then(cfg => {
      setPoIntegration(cfg ?? DEFAULT_PO_INTEGRATION());
      setPoIntDirty(false);
      setPoIntTestResult(null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendorId]);

  const updatePoDelivery = (patch: Partial<PoDeliveryPreferences>) => {
    setPoDelivery(p => ({ ...p, ...patch }));
    setPoDeliveryDirty(true);
  };

  const updatePoIntegration = (patch: Partial<PoIntegrationConfig>) => {
    setPoIntegration(p => ({ ...p, ...patch }));
    setPoIntDirty(true);
    setPoIntTestResult(null);
  };

  const savePoDelivery = async () => {
    if (!selectedVendorId) return;
    setPoDeliverySaving(true);
    try { await savePoDeliveryPreferences(Number(selectedVendorId), poDelivery); setPoDeliveryDirty(false); }
    finally { setPoDeliverySaving(false); }
  };

  const savePoInt = async () => {
    if (!selectedVendorId) return;
    setPoIntSaving(true);
    try { await savePoIntegrationConfig(Number(selectedVendorId), poIntegration); setPoIntDirty(false); }
    finally { setPoIntSaving(false); }
  };

  const testPoInt = async () => {
    if (!selectedVendorId) return;
    setPoIntTesting(true);
    try { await testPoIntegrationConn(Number(selectedVendorId)); setPoIntTestResult(true); }
    catch { setPoIntTestResult(false); }
    finally { setPoIntTesting(false); }
  };

  const setTab = (t: Tab) => router.push(`/integration?tab=${t}`);

  // ─────────────────────────────────────────────────────────────────────────
  // Connections handlers
  // ─────────────────────────────────────────────────────────────────────────
  const openCreateConn = () => {
    setEditingConn(EMPTY_INTEGRATION);
    setConnPartyType('VENDOR');
    setConnVendor(selectedVendorId || '');
    setConnCompany('');
    setIsConnEdit(false);
    setShowConnModal(true);
  };
  const openEditConn = (i: Integration) => {
    setEditingConn({ ...i });
    setConnPartyType(i.partyType ?? 'VENDOR');
    setConnVendor(i.vendor?.id ?? '');
    setConnCompany(i.companyId ?? '');
    setIsConnEdit(true);
    setShowConnModal(true);
  };
  const saveConn = async () => {
    if (connPartyType === 'VENDOR' && !connVendor) return;
    if (connPartyType === 'COMPANY' && !connCompany) return;
    const payload = {
      ...editingConn,
      partyType: connPartyType,
      vendor: connPartyType === 'VENDOR' ? { id: connVendor } : undefined,
      companyId: connPartyType === 'COMPANY' ? Number(connCompany) : undefined,
      companyName: connPartyType === 'COMPANY'
        ? companies.find(c => c.companyId === Number(connCompany))?.companyName
        : undefined,
    };
    if (isConnEdit && editingConn.id) {
      await updateIntegration(editingConn.id, payload);
    } else {
      const partyId = connPartyType === 'VENDOR' ? Number(connVendor) : Number(connCompany);
      await saveIntegration(partyId, payload);
    }
    setShowConnModal(false);
    loadConnections();
  };
  const deleteConn = async (id: number) => {
    if (!confirm('Delete this connection?')) return;
    await deleteIntegration(id);
    loadConnections();
  };
  const testConn = async (id: number) => {
    setTesting(id);
    try { await testIntegration(id); setTestResults(p => ({ ...p, [id]: true })); }
    catch { setTestResults(p => ({ ...p, [id]: false })); }
    finally { setTesting(null); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EDI handlers
  // ─────────────────────────────────────────────────────────────────────────
  const initEdiConfig = () => {
    const cfg = DEFAULT_EDI_CONFIG(ediStandard);
    if (selectedVendorId) cfg.vendorId = Number(selectedVendorId);
    setEdiConfig(cfg);
    setEdiDirty(true);
  };

  const updateEdi = (patch: Partial<EdiInterchangeConfig>) => {
    setEdiConfig(p => p ? { ...p, ...patch } : null);
    setEdiDirty(true);
  };

  const toggleTxSet = (docType: EdiDocType, key: keyof EdiTransactionSet, value: boolean | string) => {
    setEdiConfig(p => {
      if (!p) return p;
      return {
        ...p,
        transactionSets: (p.transactionSets ?? []).map(tx =>
          tx.docType === docType ? { ...tx, [key]: value } : tx
        ),
      };
    });
    setEdiDirty(true);
  };

  const saveEdi = async () => {
    if (!selectedVendorId || !ediConfig) return;
    setEdiSaving(true);
    try {
      if (ediConfig.id) await updateEdiConfig(ediConfig.id, ediConfig);
      else await saveEdiConfig(Number(selectedVendorId), ediConfig);
      setEdiDirty(false);
    } finally { setEdiSaving(false); }
  };

  const switchStandard = (std: EdiStandard) => {
    setEdiStandard(std);
    if (!ediConfig) return;
    const txSets = (std === 'X12' ? X12_SETS : EDIFACT_SETS).map(s => ({
      docType: s.docType, enabled: false, direction: s.defaultDir,
      ackRequired: s.docType !== '997' && s.docType !== 'CONTRL', ackMode: 'ASYNC' as EdiAckMode,
    }));
    updateEdi({ standard: std, transactionSets: txSets });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Catalog Feed handlers
  // ─────────────────────────────────────────────────────────────────────────
  const updateFeed = (patch: Partial<CatalogFeedConfig>) => {
    setFeedConfig(p => ({ ...p, ...patch }));
    setFeedDirty(true);
  };

  const saveFeed = async () => {
    if (!selectedVendorId) return;
    setFeedSaving(true);
    try {
      await saveCatalogFeedConfig(Number(selectedVendorId), feedConfig);
      setFeedDirty(false);
    } finally { setFeedSaving(false); }
  };

  const addMapping = () => {
    if (!newMapping.sourceColumn || !newMapping.targetField) return;
    updateFeed({
      columnMappings: [...(feedConfig.columnMappings ?? []),
        { sourceColumn: newMapping.sourceColumn, targetField: newMapping.targetField, required: false }],
    });
    setNewMapping({ sourceColumn: '', targetField: '' });
  };

  const removeMapping = (idx: number) => {
    updateFeed({ columnMappings: (feedConfig.columnMappings ?? []).filter((_, i) => i !== idx) });
  };

  // ── Filtered connections for selected vendor ───────────────────────────────
  const visibleConns = selectedVendorId
    ? integrations.filter(i => i.vendor?.id === selectedVendorId)
    : integrations;

  const txSets = ediConfig?.transactionSets ?? [];
  const txMeta = ediStandard === 'X12' ? X12_SETS : EDIFACT_SETS;

  // ─────────────────────────────────────────────────────────────────────────
  // TAB CONTENT
  // ─────────────────────────────────────────────────────────────────────────

  const protocols: ProtocolType[] = ['SFTP', 'FTP', 'AS2', 'AS4'];
  const isAS = editingConn.protocolType === 'AS2' || editingConn.protocolType === 'AS4';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Integrations</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Connections · EDI/EDIFACT · Catalog Feed · Document History
          </p>
        </div>
        {/* Vendor filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Vendor:</label>
          <select
            className="input-field w-52"
            value={selectedVendorId}
            onChange={e => setSelectedVendorId(Number(e.target.value) || '')}
          >
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 mb-6 -mt-2">
        {([
          { key: 'connections', label: 'Connections',      icon: Cable           },
          { key: 'edi',         label: 'EDI / EDIFACT',    icon: FileCode2       },
          { key: 'catalog',     label: 'Catalog Feed',     icon: Database        },
          { key: 'history',     label: 'Document History', icon: History         },
          { key: 'ocr',         label: 'OCR / Invoices',   icon: ScanLine        },
          { key: 'po-delivery', label: 'PO Delivery',      icon: SendHorizonal   },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — CONNECTIONS
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'connections' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={Cable} title="Integration Connections"
              subtitle="Add connections for vendors or buyer companies — each with a defined integration purpose" />
            {canManage && (
              <button onClick={openCreateConn} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Connection
              </button>
            )}
          </div>

          {connLoading ? (
            <div className="card p-10 text-center text-gray-400">Loading…</div>
          ) : visibleConns.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">
              No connections configured.{' '}
              {canManage && <button onClick={openCreateConn} className="text-blue-600 underline">Add one</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {visibleConns.map(i => {
                const pm = PURPOSE_META.find(p => p.purpose === (i.purpose ?? 'GENERAL')) ?? PURPOSE_META[4];
                const PurposeIcon = pm.icon;
                const partyName = i.partyType === 'COMPANY' ? (i.companyName ?? '—') : (i.vendor?.name ?? '—');
                return (
                  <div key={i.id} className="card p-5 flex items-center gap-4">
                    {/* Purpose icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${pm.badgeCls}`}>
                      <PurposeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">{partyName}</span>
                        {i.partyType === 'COMPANY' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">Buyer Co.</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pm.badgeCls}`}>{pm.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROTOCOL_COLORS[i.protocolType]}`}>{i.protocolType}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${i.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {i.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{pm.description}</p>
                      <div className="text-xs text-gray-500 truncate mt-0.5 font-mono">
                        {i.host && <>{i.host}:{i.port}</>}
                        {i.remoteDirectory && <> · {i.remoteDirectory}</>}
                        {i.filePattern && <> · {i.filePattern}</>}
                      </div>
                      {i.lastPolledAt && (
                        <div className="text-xs text-gray-400 mt-0.5">Last polled: {new Date(i.lastPolledAt).toLocaleString()}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {testResults[i.id!] !== undefined && (
                        testResults[i.id!]
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <button onClick={() => testConn(i.id!)} disabled={testing === i.id}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Zap className="w-3.5 h-3.5" />{testing === i.id ? 'Testing…' : 'Test'}
                      </button>
                      {canManage && (
                        <button onClick={() => openEditConn(i)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => i.id && deleteConn(i.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Connection Modal */}
          {showConnModal && (
            <Modal
              title={isConnEdit ? 'Edit Integration Connection' : 'New Integration Connection'}
              subtitle="Configure protocol connection for a vendor or buyer company"
              size="lg"
              onClose={() => setShowConnModal(false)}
            >
              <div className="space-y-6">

                {/* ── 1. Party ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Who is this integration for?</p>
                  <div className="flex gap-2 mb-3">
                    {(['VENDOR', 'COMPANY'] as IntegrationPartyType[]).map(pt => (
                      <button key={pt}
                        onClick={() => { setConnPartyType(pt); setConnVendor(''); setConnCompany(''); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          connPartyType === pt
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}>
                        {pt === 'VENDOR' ? 'Vendor' : 'Buyer Company'}
                      </button>
                    ))}
                  </div>
                  {connPartyType === 'VENDOR' ? (
                    <select className="input-field" value={connVendor}
                      onChange={e => setConnVendor(Number(e.target.value) || '')}>
                      <option value="">— Select vendor —</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  ) : (
                    <select className="input-field" value={connCompany}
                      onChange={e => setConnCompany(Number(e.target.value) || '')}>
                      <option value="">— Select buyer company —</option>
                      {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.companyName}</option>)}
                    </select>
                  )}
                </div>

                {/* ── 2. Purpose ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Integration Purpose</p>
                  <div className="grid grid-cols-1 gap-2">
                    {PURPOSE_META.map(pm => {
                      const PIcon = pm.icon;
                      const selected = (editingConn.purpose ?? 'GENERAL') === pm.purpose;
                      return (
                        <button key={pm.purpose}
                          onClick={() => setEditingConn(p => ({ ...p, purpose: pm.purpose }))}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            selected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${pm.badgeCls}`}>
                            <PIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{pm.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{pm.description}</p>
                          </div>
                          {selected && <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── 3. Transport Protocol ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Transport Protocol</p>
                  <div className="flex gap-2">
                    {protocols.map(p => (
                      <button key={p}
                        onClick={() => setEditingConn(e => ({ ...e, protocolType: p }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          editingConn.protocolType === p
                            ? `${PROTOCOL_COLORS[p]} border-current shadow-sm`
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── 4. Connection Details ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Connection Details</p>
                  {!isAS && (
                    <div className="grid grid-cols-2 gap-3">
                      {[['Host *','host','text'],['Port','port','number'],['Username','username','text'],['Password','password','password'],['Remote Directory','remoteDirectory','text'],['File Pattern','filePattern','text'],['Archive Directory','archiveDirectory','text']].map(([label, key, type]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                          <input className="input-field" type={type}
                            value={(editingConn as any)[key] ?? (key === 'port' ? 22 : key === 'remoteDirectory' ? '/' : '')}
                            onChange={e => setEditingConn(p => ({ ...p, [key]: type === 'number' ? parseInt(e.target.value) : e.target.value }))} />
                        </div>
                      ))}
                      {editingConn.protocolType === 'FTP' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">FTP Mode</label>
                            <select className="input-field" value={editingConn.ftpMode ?? 'PASSIVE'}
                              onChange={e => setEditingConn(p => ({ ...p, ftpMode: e.target.value as 'ACTIVE' | 'PASSIVE' }))}>
                              <option value="PASSIVE">Passive</option>
                              <option value="ACTIVE">Active</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input type="checkbox" id="ftpTls" checked={editingConn.ftpUseTls ?? false}
                              onChange={e => setEditingConn(p => ({ ...p, ftpUseTls: e.target.checked }))} />
                            <label htmlFor="ftpTls" className="text-sm text-gray-700">Use TLS (FTPS)</label>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {editingConn.protocolType === 'AS2' && (
                    <div className="grid grid-cols-2 gap-3">
                      {[['AS2 From ID','as2From'],['AS2 To ID','as2To']].map(([label, key]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                          <input className="input-field" value={(editingConn as any)[key] ?? ''}
                            onChange={e => setEditingConn(p => ({ ...p, [key]: e.target.value }))} />
                        </div>
                      ))}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner URL</label>
                        <input className="input-field" value={editingConn.as2PartnerUrl ?? ''}
                          onChange={e => setEditingConn(p => ({ ...p, as2PartnerUrl: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Algorithm</label>
                        <select className="input-field" value={editingConn.as2EncryptionAlg ?? 'AES128'}
                          onChange={e => setEditingConn(p => ({ ...p, as2EncryptionAlg: e.target.value }))}>
                          {['NONE','3DES','AES128','AES192','AES256'].map(a => <option key={a}>{a}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">MDN Mode</label>
                        <select className="input-field" value={editingConn.as2MdnMode ?? 'ASYNC'}
                          onChange={e => setEditingConn(p => ({ ...p, as2MdnMode: e.target.value }))}>
                          {['NONE','SYNC','ASYNC'].map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  {editingConn.protocolType === 'AS4' && (
                    <div className="grid grid-cols-2 gap-3">
                      {[['Our Party ID','as4PartyId'],['Partner Party ID','as4PartnerPartyId']].map(([label, key]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                          <input className="input-field" value={(editingConn as any)[key] ?? ''}
                            onChange={e => setEditingConn(p => ({ ...p, [key]: e.target.value }))} />
                        </div>
                      ))}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                        <input className="input-field" value={editingConn.as4EndpointUrl ?? ''}
                          onChange={e => setEditingConn(p => ({ ...p, as4EndpointUrl: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Security Mode</label>
                        <select className="input-field" value={editingConn.as4SecurityMode ?? 'SIGN_AND_ENCRYPT'}
                          onChange={e => setEditingConn(p => ({ ...p, as4SecurityMode: e.target.value }))}>
                          {['NONE','SIGN_ONLY','ENCRYPT_ONLY','SIGN_AND_ENCRYPT'].map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── 5. Purpose-specific Config ── */}
                {editingConn.purpose === 'EDI_EDIFACT' && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">EDI / EDIFACT Settings</p>
                    <div className="flex gap-2 mb-3">
                      {(['X12', 'EDIFACT'] as EdiStandard[]).map(std => (
                        <button key={std}
                          onClick={() => setEditingConn(p => ({ ...p, ediStandard: std }))}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                            (editingConn.ediStandard ?? 'X12') === std
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}>
                          {std === 'X12' ? 'ANSI X12' : 'UN/EDIFACT'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-blue-700 bg-blue-100 rounded-lg p-2.5">
                      Full interchange settings (ISA/UNB envelope, transaction sets) are configured in the <strong>EDI / EDIFACT</strong> tab after saving this connection.
                    </p>
                  </div>
                )}
                {editingConn.purpose === 'CATALOG' && (
                  <div className="rounded-xl border border-green-200 bg-green-50/40 p-4">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Catalog Integration Settings</p>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Default File Format</label>
                      <div className="flex gap-2 flex-wrap">
                        {(['CSV','XLSX','JSON','EDI'] as FileFormatType[]).map(f => (
                          <button key={f}
                            onClick={() => setEditingConn(p => ({ ...p, catalogFileFormat: f }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              (editingConn.catalogFileFormat ?? 'CSV') === f
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                            }`}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-green-700 bg-green-100 rounded-lg p-2.5">
                      Auto-import schedule, poll frequency and column mappings are configured in the <strong>Catalog Feed</strong> tab after saving.
                    </p>
                  </div>
                )}
                {editingConn.purpose === 'OCR' && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-3">OCR Processing Settings</p>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">File Filter Pattern</label>
                      <input className="input-field font-mono text-sm"
                        placeholder="*.pdf  or  invoice_*.pdf"
                        value={editingConn.filePattern ?? ''}
                        onChange={e => setEditingConn(p => ({ ...p, filePattern: e.target.value }))} />
                    </div>
                    <p className="text-xs text-orange-700 bg-orange-100 rounded-lg p-2.5">
                      Files picked up from this path will be queued for OCR data extraction and matched to purchase orders.
                    </p>
                  </div>
                )}
                {editingConn.purpose === 'PO_DELIVERY' && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-3">PO Delivery Settings</p>
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">PO File Format</label>
                    <div className="flex gap-2 flex-wrap">
                      {(['CSV','CXML','JSON','EDI_X12','EDI_EDIFACT'] as PoFileFormat[]).map(f => (
                        <button key={f}
                          onClick={() => setEditingConn(p => ({ ...p, poFileFormat: f }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            (editingConn.poFileFormat ?? 'CSV') === f
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                          }`}>
                          {f.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Active toggle ── */}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="connActive" checked={editingConn.active ?? true}
                    onChange={e => setEditingConn(p => ({ ...p, active: e.target.checked }))} />
                  <label htmlFor="connActive" className="text-sm text-gray-700">Active (enable polling)</label>
                </div>

                {/* ── Footer ── */}
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => setShowConnModal(false)} className="btn-secondary">Cancel</button>
                  {canManage && (
                    <button onClick={saveConn} className="btn-primary">
                      {isConnEdit ? 'Update Connection' : 'Create Connection'}
                    </button>
                  )}
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — EDI / EDIFACT
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'edi' && (
        <div className="space-y-6">
          {/* Vendor required notice */}
          {!selectedVendorId && (
            <div className="card p-5 flex items-center gap-3 bg-amber-50 border border-amber-200">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700">Select a vendor above to view or configure their EDI/EDIFACT settings.</p>
            </div>
          )}

          {selectedVendorId && (
            <>
              {/* Standard selector & save */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader icon={FileCode2} title="EDI Standard"
                    subtitle="Choose X12 (ANSI ASC X12) or EDIFACT (UN/EDIFACT) for this vendor" />
                  <div className="flex items-center gap-3">
                    {ediDirty && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">Unsaved changes</span>
                    )}
                    {!ediConfig && canManage && (
                      <button onClick={initEdiConfig}
                        className="flex items-center gap-2 text-sm px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                        <Plus className="w-4 h-4" /> Configure EDI
                      </button>
                    )}
                    {ediConfig && canManage && (
                      <button onClick={saveEdi} disabled={ediSaving || !ediDirty}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50">
                        {ediSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                    )}
                  </div>
                </div>

                {/* Standard toggle */}
                <div className="flex items-center gap-3">
                  {(['X12', 'EDIFACT'] as EdiStandard[]).map(std => (
                    <button key={std} onClick={() => switchStandard(std)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        ediStandard === std
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}>
                      {std === 'X12' ? 'ANSI X12' : 'UN/EDIFACT'}
                    </button>
                  ))}
                  {ediConfig && (
                    <label className="flex items-center gap-2 ml-auto text-sm text-gray-700">
                      <Toggle on={ediConfig.active} onChange={v => updateEdi({ active: v })} />
                      EDI Active
                    </label>
                  )}
                </div>
              </div>

              {ediConfig && (
                <>
                  {/* ── Interchange / Envelope Settings ── */}
                  <div className="card p-5">
                    {ediStandard === 'X12' ? (
                      <>
                        <SectionHeader icon={Settings2} title="X12 ISA / GS Interchange Settings"
                          subtitle="ISA segment identifiers for EDI interchange envelope" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">ISA-05 Sender Qualifier</label>
                            <select className="input-field" value={ediConfig.isaSenderQual ?? 'ZZ'}
                              onChange={e => updateEdi({ isaSenderQual: e.target.value })}>
                              {ISA_QUALIFIERS.map(q => <option key={q.code} value={q.code}>{q.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">ISA-06 Sender ID</label>
                            <input className="input-field font-mono" maxLength={15}
                              value={ediConfig.isaSenderId ?? ''}
                              onChange={e => updateEdi({ isaSenderId: e.target.value.toUpperCase() })}
                              placeholder="YOUR_SENDER_ID" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">ISA-07 Receiver Qualifier</label>
                            <select className="input-field" value={ediConfig.isaReceiverQual ?? 'ZZ'}
                              onChange={e => updateEdi({ isaReceiverQual: e.target.value })}>
                              {ISA_QUALIFIERS.map(q => <option key={q.code} value={q.code}>{q.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">ISA-08 Receiver ID</label>
                            <input className="input-field font-mono" maxLength={15}
                              value={ediConfig.isaReceiverId ?? ''}
                              onChange={e => updateEdi({ isaReceiverId: e.target.value.toUpperCase() })}
                              placeholder="VENDOR_RECEIVER_ID" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">ISA-12 Version</label>
                            <select className="input-field" value={ediConfig.isaVersion ?? '00401'}
                              onChange={e => updateEdi({ isaVersion: e.target.value })}>
                              <option value="00401">00401 – X12 4010</option>
                              <option value="00501">00501 – X12 5010</option>
                              <option value="00402">00402 – X12 4020</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">ISA-15 Usage</label>
                            <div className="flex gap-2">
                              {([['P','Production'],['T','Test']] as [string, string][]).map(([v, l]) => (
                                <button key={v} onClick={() => updateEdi({ isaUsageIndicator: v as 'P' | 'T' })}
                                  className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                                    ediConfig.isaUsageIndicator === v
                                      ? v === 'P' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                      : 'bg-white border-gray-200 text-gray-600'}`}>
                                  {l}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-4">
                            <input type="checkbox" id="isaAck" checked={ediConfig.isaAckRequested ?? true}
                              onChange={e => updateEdi({ isaAckRequested: e.target.checked })} />
                            <label htmlFor="isaAck" className="text-sm text-gray-700">ISA-14 Request 997 Acknowledgment</label>
                          </div>
                        </div>
                        <div className="border-t border-gray-100 mt-4 pt-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">GS Functional Group</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">GS-02 App Sender ID</label>
                              <input className="input-field font-mono" value={ediConfig.gsApplicationSenderId ?? ''}
                                onChange={e => updateEdi({ gsApplicationSenderId: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">GS-03 App Receiver ID</label>
                              <input className="input-field font-mono" value={ediConfig.gsApplicationReceiverId ?? ''}
                                onChange={e => updateEdi({ gsApplicationReceiverId: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <SectionHeader icon={Settings2} title="EDIFACT UNB Interchange Settings"
                          subtitle="UNB segment identifiers for EDIFACT interchange envelope" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">UNB Syntax Identifier</label>
                            <select className="input-field" value={ediConfig.unbSyntaxId ?? 'UNOA'}
                              onChange={e => updateEdi({ unbSyntaxId: e.target.value })}>
                              <option value="UNOA">UNOA – UN/ECE Character Set A</option>
                              <option value="UNOB">UNOB – UN/ECE Character Set B</option>
                              <option value="UNOC">UNOC – ISO 8859-1 Latin 1</option>
                              <option value="UNOD">UNOD – ISO 8859-2 Latin 2</option>
                              <option value="UNOE">UNOE – ISO 8859-5 Cyrillic</option>
                              <option value="UNOF">UNOF – ISO 8859-7 Greek</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">UNB Syntax Version</label>
                            <select className="input-field" value={ediConfig.unbSyntaxVersion ?? '3'}
                              onChange={e => updateEdi({ unbSyntaxVersion: e.target.value })}>
                              <option value="1">1 – Release 1</option>
                              <option value="2">2 – Release 2</option>
                              <option value="3">3 – Release 3</option>
                              <option value="4">4 – Release 4</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">UNB-S002 Sender ID</label>
                            <input className="input-field font-mono" value={ediConfig.unbSenderId ?? ''}
                              onChange={e => updateEdi({ unbSenderId: e.target.value })}
                              placeholder="YOUR_SENDER_ID" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">UNB-S002 Sender Qualifier</label>
                            <input className="input-field font-mono" maxLength={4} value={ediConfig.unbSenderQual ?? ''}
                              onChange={e => updateEdi({ unbSenderQual: e.target.value })}
                              placeholder="e.g. 14" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">UNB-S003 Recipient ID</label>
                            <input className="input-field font-mono" value={ediConfig.unbRecipientId ?? ''}
                              onChange={e => updateEdi({ unbRecipientId: e.target.value })}
                              placeholder="VENDOR_RECIPIENT_ID" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">UNB-S003 Recipient Qualifier</label>
                            <input className="input-field font-mono" maxLength={4} value={ediConfig.unbRecipientQual ?? ''}
                              onChange={e => updateEdi({ unbRecipientQual: e.target.value })}
                              placeholder="e.g. 14" />
                          </div>
                          <div className="flex items-center gap-2 pt-4">
                            <input type="checkbox" id="unbTest" checked={ediConfig.unbTestIndicator ?? false}
                              onChange={e => updateEdi({ unbTestIndicator: e.target.checked })} />
                            <label htmlFor="unbTest" className="text-sm text-gray-700">UNB-0035 Test Indicator</label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── Transaction Sets ── */}
                  <div className="card p-5">
                    <SectionHeader icon={FileText}
                      title={ediStandard === 'X12' ? 'X12 Transaction Sets' : 'EDIFACT Message Types'}
                      subtitle="Enable and configure which document types to exchange with this vendor" />

                    <div className="space-y-3">
                      {txMeta.map(meta => {
                        const tx = txSets.find(t => t.docType === meta.docType) ?? {
                          docType: meta.docType, enabled: false, direction: meta.defaultDir,
                          ackRequired: true, ackMode: 'ASYNC' as EdiAckMode,
                        };
                        return (
                          <div key={meta.docType}
                            className={`rounded-xl border p-4 transition-all ${tx.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
                            <div className="flex items-start gap-4">
                              {/* Enable toggle */}
                              <div className="flex items-center pt-0.5">
                                <Toggle on={tx.enabled}
                                  onChange={v => toggleTxSet(meta.docType, 'enabled', v)} />
                              </div>
                              {/* Doc info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-sm text-gray-800">{meta.docType}</span>
                                  <span className="text-sm text-gray-700">{meta.label.split(' – ')[1]}</span>
                                  {/* Direction badge */}
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                    tx.direction === 'INBOUND'  ? 'bg-green-100 text-green-700' :
                                    tx.direction === 'OUTBOUND' ? 'bg-blue-100 text-blue-700' :
                                    'bg-purple-100 text-purple-700'
                                  }`}>
                                    {tx.direction === 'INBOUND'  && <ArrowDown className="w-3 h-3" />}
                                    {tx.direction === 'OUTBOUND' && <ArrowUp className="w-3 h-3" />}
                                    {tx.direction === 'BOTH'     && <ArrowLeftRight className="w-3 h-3" />}
                                    {tx.direction}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                              </div>
                              {/* Direction + Ack controls (only when enabled) */}
                              {tx.enabled && (
                                <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">Direction</label>
                                    <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                                      value={tx.direction}
                                      onChange={e => toggleTxSet(meta.docType, 'direction', e.target.value as EdiDirection)}>
                                      <option value="INBOUND">Inbound</option>
                                      <option value="OUTBOUND">Outbound</option>
                                      <option value="BOTH">Both</option>
                                    </select>
                                  </div>
                                  {meta.docType !== '997' && meta.docType !== 'CONTRL' && (
                                    <div>
                                      <label className="block text-xs text-gray-400 mb-1">Ack Mode</label>
                                      <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                                        value={tx.ackMode ?? 'ASYNC'}
                                        onChange={e => toggleTxSet(meta.docType, 'ackMode', e.target.value as EdiAckMode)}>
                                        <option value="ASYNC">Async</option>
                                        <option value="SYNC">Sync</option>
                                        <option value="NONE">None</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — CATALOG FEED
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {!selectedVendorId && (
            <div className="card p-5 flex items-center gap-3 bg-amber-50 border border-amber-200">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700">Select a vendor above to configure their catalog feed settings.</p>
            </div>
          )}

          {selectedVendorId && (
            <>
              {/* Auto-Import & Schedule */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader icon={Database} title="Catalog Feed Configuration"
                    subtitle="Automated import schedule and format settings" />
                  <div className="flex items-center gap-3">
                    {feedDirty && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">Unsaved changes</span>
                    )}
                    {canManage && (
                      <button onClick={saveFeed} disabled={feedSaving || !feedDirty}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50">
                        {feedSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Toggle on={feedConfig.autoImport} onChange={v => updateFeed({ autoImport: v })} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Auto Import</p>
                      <p className="text-xs text-gray-500">Automatically poll the vendor connection and import new catalog files</p>
                    </div>
                  </div>

                  {feedConfig.autoImport && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Poll Frequency</label>
                      <select className="input-field" value={feedConfig.pollFrequencyMinutes ?? 60}
                        onChange={e => updateFeed({ pollFrequencyMinutes: parseInt(e.target.value) })}>
                        <option value={15}>Every 15 minutes</option>
                        <option value={30}>Every 30 minutes</option>
                        <option value={60}>Every hour</option>
                        <option value={180}>Every 3 hours</option>
                        <option value={360}>Every 6 hours</option>
                        <option value={720}>Every 12 hours</option>
                        <option value={1440}>Daily</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Default File Format</label>
                    <div className="flex gap-2 flex-wrap">
                      {(['CSV','XLSX','JSON','CXML','EDI'] as FileFormatType[]).map(f => (
                        <button key={f} onClick={() => updateFeed({ defaultFormatType: f })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            feedConfig.defaultFormatType === f
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Duplicate SKU Handling</label>
                    <div className="flex gap-2">
                      {([['SKIP','Skip & keep existing'],['UPDATE','Update existing record'],['REPLACE','Replace all fields']] as [MergeMode, string][]).map(([v, l]) => (
                        <button key={v} onClick={() => updateFeed({ mergeMode: v })}
                          className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium border ${
                            feedConfig.mergeMode === v
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Toggle on={feedConfig.archiveAfterImport} onChange={v => updateFeed({ archiveAfterImport: v })} />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Archive after import</p>
                      <p className="text-xs text-gray-400">Move processed files to archive directory</p>
                    </div>
                  </div>

                  {feedConfig.archiveAfterImport && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Archive Directory</label>
                      <input className="input-field font-mono text-sm"
                        value={feedConfig.archiveDirectory ?? ''}
                        onChange={e => updateFeed({ archiveDirectory: e.target.value })}
                        placeholder="/archive/catalog" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Toggle on={feedConfig.notifyOnComplete ?? false} onChange={v => updateFeed({ notifyOnComplete: v })} />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Email notification on import</p>
                      <p className="text-xs text-gray-400">Send summary when import job completes</p>
                    </div>
                  </div>

                  {feedConfig.notifyOnComplete && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Notification Email</label>
                      <input className="input-field" type="email"
                        value={feedConfig.notifyEmail ?? ''}
                        onChange={e => updateFeed({ notifyEmail: e.target.value })}
                        placeholder="buyer@company.com" />
                    </div>
                  )}
                </div>
              </div>

              {/* Column Mapping */}
              <div className="card p-5">
                <SectionHeader icon={Settings2} title="Column Mapping"
                  subtitle="Map vendor file column headers to ProcureX item fields" />

                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="table-header">Source Column (vendor file)</th>
                        <th className="table-header">Target Field (system)</th>
                        <th className="table-header">Required</th>
                        <th className="table-header">Default Value</th>
                        <th className="table-header w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(feedConfig.columnMappings ?? []).map((m, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="table-cell font-mono text-xs text-blue-700">{m.sourceColumn}</td>
                          <td className="table-cell">
                            <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded font-mono">{m.targetField}</span>
                          </td>
                          <td className="table-cell">
                            <input type="checkbox" checked={m.required ?? false}
                              onChange={e => {
                                const maps = [...(feedConfig.columnMappings ?? [])];
                                maps[idx] = { ...maps[idx], required: e.target.checked };
                                updateFeed({ columnMappings: maps });
                              }} />
                          </td>
                          <td className="table-cell">
                            <input className="text-xs border border-gray-200 rounded px-2 py-1 w-28"
                              value={m.defaultValue ?? ''}
                              onChange={e => {
                                const maps = [...(feedConfig.columnMappings ?? [])];
                                maps[idx] = { ...maps[idx], defaultValue: e.target.value };
                                updateFeed({ columnMappings: maps });
                              }}
                              placeholder="optional" />
                          </td>
                          <td className="table-cell">
                            <button onClick={() => removeMapping(idx)} className="p-1 hover:bg-red-50 rounded text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(feedConfig.columnMappings ?? []).length === 0 && (
                        <tr><td colSpan={5} className="text-center py-5 text-gray-400 text-xs">No column mappings defined.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add new mapping row */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <input className="input-field flex-1 font-mono text-sm"
                    placeholder="Source column name"
                    value={newMapping.sourceColumn ?? ''}
                    onChange={e => setNewMapping(p => ({ ...p, sourceColumn: e.target.value }))} />
                  <span className="text-gray-400 text-xs">→</span>
                  <select className="input-field flex-1"
                    value={newMapping.targetField ?? ''}
                    onChange={e => setNewMapping(p => ({ ...p, targetField: e.target.value }))}>
                    <option value="">— System field —</option>
                    {CATALOG_SYSTEM_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <button onClick={addMapping}
                    disabled={!newMapping.sourceColumn || !newMapping.targetField}
                    className="btn-primary flex items-center gap-1 text-sm disabled:opacity-50">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4 — DOCUMENT HISTORY
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={History} title="Document History"
              subtitle="EDI transaction log and catalog import job history" />
            <button onClick={loadHistory}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {/* Sub-tab: EDI vs Catalog */}
          <div className="flex gap-1 border-b border-gray-100 mb-4">
            {([['edi','EDI Documents'],['catalog','Catalog Imports']] as ['edi' | 'catalog', string][]).map(([k, l]) => (
              <button key={k} onClick={() => setHistoryTab(k)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  historyTab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {l}
              </button>
            ))}
          </div>

          {historyLoading ? (
            <div className="card p-10 text-center text-gray-400">Loading…</div>
          ) : historyTab === 'edi' ? (
            <div className="card">
              {ediDocs.length === 0 ? (
                <div className="p-10 text-center text-gray-400 text-sm">No EDI documents found.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Timestamp','Vendor','Doc Type','Direction','Reference','Status','Ack Status'].map(h => (
                        <th key={h} className="table-header">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ediDocs.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                          {new Date(d.createdAt).toLocaleString()}
                        </td>
                        <td className="table-cell text-sm">{d.vendorName ?? '—'}</td>
                        <td className="table-cell">
                          <span className="font-mono font-bold text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{d.docType}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`flex items-center gap-1 text-xs font-medium ${
                            d.direction === 'INBOUND'  ? 'text-green-600' :
                            d.direction === 'OUTBOUND' ? 'text-blue-600' : 'text-purple-600'
                          }`}>
                            {d.direction === 'INBOUND'  && <ArrowDown className="w-3.5 h-3.5" />}
                            {d.direction === 'OUTBOUND' && <ArrowUp className="w-3.5 h-3.5" />}
                            {d.direction}
                          </span>
                        </td>
                        <td className="table-cell font-mono text-xs text-gray-500">{d.referenceId ?? d.controlNumber ?? '—'}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            {STATUS_ICON[d.status] ?? null}
                            <span className="text-xs text-gray-700">{d.status}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          {d.ackStatus ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACK_BADGE[d.ackStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                              {d.ackStatus.replace(/_/g, ' ')}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* Catalog Import History */
            <div className="card divide-y divide-gray-50">
              {importJobs.length === 0 ? (
                <div className="p-10 text-center text-gray-400 text-sm">No catalog import jobs found.</div>
              ) : (
                importJobs.map(job => (
                  <div key={job.id}>
                    <div className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50">
                      {STATUS_ICON[job.status]}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {job.fileName ?? job.jobRef}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            job.status === 'COMPLETED'  ? 'bg-green-100 text-green-700' :
                            job.status === 'FAILED'     ? 'bg-red-100 text-red-700' :
                            job.status === 'PARTIAL'    ? 'bg-yellow-100 text-yellow-700' :
                            job.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'}`}>
                            {job.status}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{job.formatType}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {job.vendor?.name} · {new Date(job.createdAt).toLocaleString()}
                          {' · '}{job.processedRecords}/{job.totalRecords} processed
                          {job.failedRecords > 0 && <span className="text-red-500"> · {job.failedRecords} failed</span>}
                        </div>
                      </div>
                      {job.failedRecords > 0 && (
                        <button onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                          className="text-xs text-red-600 flex items-center gap-1 hover:underline">
                          {job.failedRecords} errors
                          {expandedJob === job.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    {expandedJob === job.id && (
                      <div className="px-5 pb-3 bg-red-50">
                        <p className="text-xs text-red-600 py-2">
                          {job.failedRecords} record(s) failed during import. Check the Import Logs page for full details.
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5 — OCR / INVOICE PROCESSING
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ocr' && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={ScanLine} title="OCR Invoice Processing"
              subtitle="Upload, review and match vendor invoices extracted via OCR" />
            <div className="flex gap-2">
              <button onClick={() => loadOcr(ocrPage)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <RefreshCw className={`w-4 h-4 ${ocrLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button onClick={() => ocrFileRef.current?.click()}
                className="btn-primary flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Invoice
              </button>
              <input ref={ocrFileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff" className="hidden"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try { await uploadOcrDocument(f); loadOcr(0); }
                  catch { alert('Upload failed'); }
                  e.target.value = '';
                }} />
            </div>
          </div>

          {/* Stats Row */}
          {ocrStats && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
              {([
                ['Total',      ocrStats.total,      'bg-gray-50  text-gray-700' ],
                ['Pending',    ocrStats.pending,     'bg-yellow-50 text-yellow-700'],
                ['Processing', ocrStats.processing,  'bg-blue-50  text-blue-700' ],
                ['Successful', ocrStats.successful,  'bg-green-50 text-green-700' ],
                ['Failed',     ocrStats.failed,      'bg-red-50   text-red-700'  ],
                ['Duplicate',  ocrStats.duplicate,   'bg-orange-50 text-orange-700'],
              ] as [string, number, string][]).map(([label, val, cls]) => (
                <div key={label} className={`rounded-lg p-3 ${cls}`}>
                  <div className="text-xl font-bold">{val}</div>
                  <div className="text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input value={ocrSearch} onChange={e => setOcrSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadOcr(0)}
              placeholder="Search vendor, invoice #…"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={ocrFilter} onChange={e => { setOcrFilter(e.target.value as OcrDocumentStatus | ''); loadOcr(0); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {(['PENDING','PROCESSING','SUCCESSFUL','FAILED','DUPLICATE'] as OcrDocumentStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Document Table */}
          {ocrLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading documents…
            </div>
          ) : ocrDocs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ScanLine className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No documents found. Upload an invoice to get started.</p>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">File</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-left">Invoice #</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-left">PO Ref</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-center">Confidence</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ocrDocs.map(doc => {
                      const statusColors: Record<string, string> = {
                        PENDING:    'bg-yellow-100 text-yellow-700',
                        PROCESSING: 'bg-blue-100 text-blue-700',
                        SUCCESSFUL: 'bg-green-100 text-green-700',
                        FAILED:     'bg-red-100 text-red-700',
                        DUPLICATE:  'bg-orange-100 text-orange-700',
                      };
                      const conf = Math.round((doc.overallConfidence ?? 0) * 100);
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 max-w-[160px] truncate text-blue-600 font-medium" title={doc.fileName}>
                            {doc.fileName}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{doc.documentType}</td>
                          <td className="px-4 py-3">{doc.vendorName ?? '—'}</td>
                          <td className="px-4 py-3">{doc.invoiceNumber ?? '—'}</td>
                          <td className="px-4 py-3 text-right">
                            {doc.grandTotal != null
                              ? `${doc.currency ?? ''} ${doc.grandTotal.toLocaleString()}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3">{doc.poReference ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${conf >= 80 ? 'bg-green-500' : conf >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${conf}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{conf}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <a href={`/integration/ocr/${doc.id}`}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Review">
                                <Eye className="w-4 h-4" />
                              </a>
                              {(doc.status === 'FAILED' || doc.status === 'PENDING') && (
                                <button onClick={async () => { await reprocessOcrDocument(doc.id); loadOcr(ocrPage); }}
                                  className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600" title="Reprocess">
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              {doc.status === 'SUCCESSFUL' && !doc.linkedPoId && (
                                <a href={`/integration/ocr/${doc.id}#link`}
                                  className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Link to PO">
                                  <Link2 className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {ocrTotalPages > 1 && (
                <div className="flex justify-end gap-2 mt-4">
                  <button disabled={ocrPage === 0} onClick={() => loadOcr(ocrPage - 1)}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-500">
                    Page {ocrPage + 1} / {ocrTotalPages}
                  </span>
                  <button disabled={ocrPage >= ocrTotalPages - 1} onClick={() => loadOcr(ocrPage + 1)}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6 — PO DELIVERY
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'po-delivery' && (
        <div className="space-y-6">
          {!selectedVendorId && (
            <div className="card p-5 flex items-center gap-3 bg-amber-50 border border-amber-200">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700">Select a vendor above to configure their PO delivery settings.</p>
            </div>
          )}

          {selectedVendorId && (
            <>
              {/* ── Delivery Channels ── */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader icon={Mail} title="PO Delivery Channels"
                    subtitle="How this vendor receives Purchase Orders from your system" />
                  <div className="flex items-center gap-3">
                    {poDeliveryDirty && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">Unsaved changes</span>
                    )}
                    {canManage && (
                      <button onClick={savePoDelivery} disabled={poDeliverySaving || !poDeliveryDirty}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50">
                        {poDeliverySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-800">Email Delivery</span>
                        <span className="text-xs text-gray-400">Send PO as email attachment</span>
                      </div>
                      <Toggle on={poDelivery.emailEnabled} onChange={v => updatePoDelivery({ emailEnabled: v })} />
                    </div>
                    {poDelivery.emailEnabled && (
                      <div className="px-4 py-4 space-y-4 border-t border-gray-100">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Recipients</label>
                          <input className="input-field" type="email"
                            value={poDelivery.emailTo ?? ''}
                            onChange={e => updatePoDelivery({ emailTo: e.target.value })}
                            placeholder="orders@vendor.com (comma-separated for multiple)" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Attachment Format</label>
                          <div className="flex gap-2">
                            {(['PDF','HTML'] as const).map(fmt => (
                              <button key={fmt} onClick={() => updatePoDelivery({ emailFormat: fmt })}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                  poDelivery.emailFormat === fmt
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}>
                                {fmt === 'PDF' ? '📄 PDF Document' : '🌐 HTML Email Body'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Portal Inbox */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-gray-800">Vendor Portal Inbox</span>
                        <span className="text-xs text-gray-400">PO visible in vendor's in-app inbox</span>
                      </div>
                      <Toggle on={poDelivery.portalEnabled} onChange={v => updatePoDelivery({ portalEnabled: v })} />
                    </div>
                    {poDelivery.portalEnabled && (
                      <div className="px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-green-700 bg-green-50 rounded-lg p-3">
                          Vendor users (VENDOR_USER / VENDOR_ADMIN) will see new POs in their <strong>PO Inbox</strong> when logged in.
                          They can view and acknowledge directly from the portal.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Automated Integration */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-800">Automated File Delivery</span>
                        <span className="text-xs text-gray-400">Push PO file to vendor's SFTP/FTP server</span>
                      </div>
                      <Toggle on={poDelivery.integrationEnabled} onChange={v => updatePoDelivery({ integrationEnabled: v })} />
                    </div>
                    {poDelivery.integrationEnabled && (
                      <div className="px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-purple-700 bg-purple-50 rounded-lg p-3">
                          Configure the connection details and file format below in <strong>PO Integration Settings</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── PO Integration Connection (SFTP/FTP for automated push) ── */}
              {poDelivery.integrationEnabled && (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <SectionHeader icon={Cpu} title="PO Integration Settings"
                      subtitle="Vendor's connection details for automated PO file delivery" />
                    <div className="flex items-center gap-3">
                      {poIntTesting && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                      {poIntTestResult === true  && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {poIntTestResult === false && <XCircle className="w-4 h-4 text-red-500" />}
                      {canManage && (
                        <button onClick={testPoInt} disabled={poIntTesting}
                          className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                          <Zap className="w-3.5 h-3.5" /> Test
                        </button>
                      )}
                      {poIntDirty && (
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">Unsaved changes</span>
                      )}
                      {canManage && (
                        <button onClick={savePoInt} disabled={poIntSaving || !poIntDirty}
                          className="btn-primary flex items-center gap-2 disabled:opacity-50">
                          {poIntSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Protocol selector */}
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Protocol</label>
                    <div className="flex gap-2">
                      {(['SFTP','FTP','AS2','AS4'] as const).map(p => (
                        <button key={p} onClick={() => updatePoIntegration({ protocol: p })}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                            poIntegration.protocol === p
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                          }`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* File format */}
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">PO File Format</label>
                    <div className="flex gap-2 flex-wrap">
                      {(['CSV','CXML','JSON','EDI_X12','EDI_EDIFACT'] as PoFileFormat[]).map(f => (
                        <button key={f} onClick={() => updatePoIntegration({ fileFormat: f })}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            poIntegration.fileFormat === f
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                          }`}>
                          {f.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {poIntegration.fileFormat === 'CSV'        && 'Comma-separated values — simple, widely supported.'}
                      {poIntegration.fileFormat === 'CXML'       && 'cXML (Commerce XML) — PunchOut / Ariba standard.'}
                      {poIntegration.fileFormat === 'JSON'       && 'JSON — modern REST-friendly format.'}
                      {poIntegration.fileFormat === 'EDI_X12'    && 'ANSI X12 850 — standard EDI Purchase Order transaction set.'}
                      {poIntegration.fileFormat === 'EDI_EDIFACT'&& 'UN/EDIFACT ORDERS — international EDI standard.'}
                    </p>
                  </div>

                  {/* Connection fields — SFTP/FTP */}
                  {(poIntegration.protocol === 'SFTP' || poIntegration.protocol === 'FTP') && (
                    <div className="grid grid-cols-2 gap-4">
                      {([
                        ['Host *',            'host',            'text'],
                        ['Port',              'port',            'number'],
                        ['Username',          'username',        'text'],
                        ['Password',          'password',        'password'],
                        ['Target Directory',  'remoteDirectory', 'text'],
                        ['Filename Pattern',  'filenamePattern', 'text'],
                      ] as [string, keyof PoIntegrationConfig, string][]).map(([lbl, key, type]) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{lbl}</label>
                          <input className="input-field" type={type}
                            placeholder={key === 'remoteDirectory' ? '/outbound/po' : key === 'filenamePattern' ? 'PO_{number}_{date}' : ''}
                            value={(poIntegration as any)[key] ?? (key === 'port' ? (poIntegration.protocol === 'SFTP' ? 22 : 21) : '')}
                            onChange={e => updatePoIntegration({ [key]: type === 'number' ? parseInt(e.target.value) : e.target.value })} />
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-5">
                        <Toggle on={poIntegration.active} onChange={v => updatePoIntegration({ active: v })} />
                        <label className="text-sm text-gray-700">Active</label>
                      </div>
                    </div>
                  )}

                  {/* Connection fields — AS2 */}
                  {poIntegration.protocol === 'AS2' && (
                    <div className="grid grid-cols-2 gap-4">
                      {([['AS2 From ID','as2From'],['AS2 To ID','as2To']] as [string, keyof PoIntegrationConfig][]).map(([lbl, key]) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{lbl}</label>
                          <input className="input-field" value={(poIntegration as any)[key] ?? ''}
                            onChange={e => updatePoIntegration({ [key]: e.target.value })} />
                        </div>
                      ))}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Partner URL</label>
                        <input className="input-field" value={poIntegration.as2PartnerUrl ?? ''}
                          onChange={e => updatePoIntegration({ as2PartnerUrl: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Toggle on={poIntegration.active} onChange={v => updatePoIntegration({ active: v })} />
                        <label className="text-sm text-gray-700">Active</label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
