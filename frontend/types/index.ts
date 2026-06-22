// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  role: 'VENDOR_USER' | 'VENDOR_ADMIN' | 'SYSTEM_ADMIN';
  vendorId: number | null;
  vendorName: string | null;
  // ── Multi-tenant context (populated after V4 migration) ───────────────────
  customerId?:    number | null;
  customerName?:  string | null;
  companyId?:     number | null;
  companyName?:   string | null;
  positionId?:    number | null;
  positionName?:  string | null;
  personId?:      number | null;
  /** Raw JSON string of AccessMatrix from the user's Position */
  accessMatrix?:  string | null;
}

export interface AuthRequest {
  username: string;
  password: string;
}

// ── Vendor ────────────────────────────────────────────────────────────────────
export type PoEmailFormat  = 'PDF' | 'HTML';
export type PoFileFormat   = 'CSV' | 'CXML' | 'JSON' | 'EDI_X12' | 'EDI_EDIFACT';

export interface PoDeliveryPreferences {
  emailEnabled:        boolean;
  emailFormat:         PoEmailFormat;
  emailTo?:            string;
  portalEnabled:       boolean;
  integrationEnabled:  boolean;
}

export interface PoIntegrationConfig {
  id?:               number;
  vendorId?:         number;
  active:            boolean;
  protocol:          'SFTP' | 'FTP' | 'AS2' | 'AS4';
  host?:             string;
  port?:             number;
  username?:         string;
  password?:         string;
  remoteDirectory?:  string;
  fileFormat:        PoFileFormat;
  filenamePattern?:  string;
  as2From?:          string;
  as2To?:            string;
  as2PartnerUrl?:    string;
}

export type VendorInboxStatus = 'UNREAD' | 'READ' | 'ACKNOWLEDGED';
export type VendorInboxType   = 'PURCHASE_ORDER' | 'AMENDMENT' | 'CANCELLATION';

export interface VendorInboxMessage {
  id:                string;
  vendorId:          number;
  vendorName:        string;
  poId?:             number;
  poNumber?:         string;
  subject:           string;
  type:              VendorInboxType;
  status:            VendorInboxStatus;
  sentAt:            string;
  readAt?:           string;
  acknowledgedAt?:   string;
  totalAmount?:      number;
  currency?:         string;
  lineCount?:        number;
  deliveryChannels?: string[];
}

export interface Vendor {
  id?:           number;
  code?:         string;
  name:          string;
  contactName?:  string;
  email?:        string;
  phone?:        string;
  address?:      string;
  paymentTerms?: string;
  category?:     string;
  status:        'ACTIVE' | 'INACTIVE';
  createdAt?:    string;
  poDelivery?:   PoDeliveryPreferences;
}

// ── UOM & Currency ────────────────────────────────────────────────────────────
export type UomType = 'WEIGHT' | 'VOLUME' | 'EACH' | 'LENGTH' | 'AREA';

export interface UomMaster {
  id?: number;
  code: string;
  description: string;
  uomType: UomType;
  catchWeightEligible: boolean;
  createdAt?: string;
}

export interface CurrencyMaster {
  id?: number;
  code: string;
  name: string;
  symbol?: string;
  decimalPlaces: number;
  active: boolean;
}

// ── Item / Product (unified) ──────────────────────────────────────────────────
export type ProductStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'DISCONTINUED' | 'SEASONAL' | 'NEW' | 'ON_HOLD';
export type StorageTemp    = 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'CONTROLLED';
export type CatchWeightPriceMethod = 'PER_WEIGHT_UNIT' | 'NOMINAL_FIXED' | 'ACTUAL_INVOICED';

export interface Item {
  id?: number;
  // Identification
  sku: string;
  vendorSku?: string;
  name: string;
  description?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  // Barcodes
  gtin?: string;
  upc?: string;
  ean?: string;
  // Vendor
  vendor?: Vendor;
  // UOM & Pricing
  uom: string;
  uomMaster?: UomMaster;
  unitPrice: number;
  costPrice?: number;
  rrp?: number;
  currencyCode?: string;
  currency?: CurrencyMaster;
  taxCode?: string;
  taxRatePct?: number;
  // Catch Weight
  catchWeight?: boolean;
  catchWeightMin?: number;
  catchWeightMax?: number;
  catchWeightAvg?: number;
  catchWeightNominal?: number;
  catchWeightTolerancePct?: number;
  catchWeightPriceMethod?: CatchWeightPriceMethod;
  // Pack
  caseQty?: number;
  innerPackQty?: number;
  packSizeDescription?: string;
  // Portions
  portionSize?: number;
  portionsPerPack?: number;
  // Ordering Rules
  minOrderQty?: number;
  maxOrderQty?: number;
  orderIncrement?: number;
  leadTimeDays?: number;
  // Date Lifecycle
  effectiveDate?: string;
  expireDate?: string;
  discontinueDate?: string;
  newProductUntil?: string;
  // Status
  productStatus?: ProductStatus;
  isActive?: boolean;
  // Storage & Handling
  storageTemp?: StorageTemp;
  storageTempMinC?: number;
  storageTempMaxC?: number;
  shelfLifeDays?: number;
  hazmat?: boolean;
  hazmatClass?: string;
  allergens?: string;       // JSON string
  dietaryFlags?: string;    // JSON string
  // Dimensions
  grossWeight?: number;
  netWeight?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  // Substitution
  substituteSku?: string;
  substituteAllowed?: boolean;
  // Audit
  lastImportedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // Relations
  priceBreaks?: ProductPriceBreak[];
}

// ── Price Breaks ──────────────────────────────────────────────────────────────
export type BreakType = 'QTY' | 'AMOUNT';

export interface ProductPriceBreak {
  id?: number;
  productId?: number;
  breakType: BreakType;
  tierSequence: number;
  minValue: number;
  maxValue?: number;
  unitPrice: number;
  discountPct?: number;
  effectiveDate?: string;
  expireDate?: string;
  active?: boolean;
}

// ── Order Guide ───────────────────────────────────────────────────────────────
export interface OrderGuide {
  id?: number;
  name: string;
  description?: string;
  isShared?: boolean;
  createdBy?: string;
  createdAt?: string;
  items?: OrderGuideItem[];
}

export interface OrderGuideItem {
  id?: number;
  orderGuide?: OrderGuide;
  item: Item;
  defaultQty: number;
  targetPrice?: number;
}

// ── Requisition ───────────────────────────────────────────────────────────────
export interface RequisitionLine {
  id?: number;
  item?: Item;
  vendor?: Vendor;
  description: string;
  quantity: number;
  unitPrice: number;
  uom?: string;
  totalPrice?: number;
  glAccount?: string;
}

export interface Requisition {
  id?: number;
  reqNumber?: string;
  title: string;
  requestedBy?: string;
  department?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  notes?: string;
  totalAmount?: number;
  createdAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  lines?: RequisitionLine[];
}

// ── Purchase Order ────────────────────────────────────────────────────────────
export interface PurchaseOrderLine {
  id?: number;
  item?: Item;
  description: string;
  orderedQty: number;
  receivedQty?: number;
  unitPrice: number;
  uom?: string;
  totalPrice?: number;
  glAccount?: string;
  taxAmount?: number;
  taxClass?: string;
}

export type PoOrderType =
  | 'STANDARD'    // Regular PO — sent to vendor
  | 'CONFIRMING'  // Internal documentation only — NOT sent to vendor
  | 'BLANKET'     // Framework agreement with recurring releases
  | 'STOREROOM'   // Inventory replenishment to reorder point
  | 'PLANNED'     // Pre-scheduled for future release
  | 'SERVICE'     // Services only — no goods receipt, uses acceptance
  | 'EMERGENCY';  // Urgent — bypasses approval, requires justification

export interface PurchaseOrder {
  id?: number;
  poNumber?: string;
  vendor: Vendor;
  requisition?: Requisition;
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED';
  orderType?: PoOrderType;
  deliveryDate?: string;
  notes?: string;
  totalAmount?: number;
  createdAt?: string;
  submittedAt?: string;
  lines?: PurchaseOrderLine[];
  // Blanket
  blanketMaxAmount?: number;
  blanketExpiryDate?: string;
  blanketReleasesCount?: number;
  // Storeroom
  storeroomLocation?: string;
  storeroomItemId?: number;
  // Confirming
  confirmingReason?: string;
  confirmingOriginalDate?: string;
  // Planned
  plannedReleaseDate?: string;
  // Emergency
  emergencyJustification?: string;
  emergencyAuthorisedBy?: string;
  // Service
  serviceDescription?: string;
  serviceAcceptanceDate?: string;
  serviceAcceptedBy?: string;
  // Tax Engine
  taxAmount?: number;
  taxCurrency?: string;
  taxJurisdiction?: string;
  taxAuditId?: string;
  taxCalculatedAt?: string;
}

// ── Tax Engine ────────────────────────────────────────────────────────────────
export interface TaxLineSummary {
  lineId: number;
  description: string;
  netAmount: number;
  taxAmount: number;
  taxClass?: string;
}

export interface TaxSummary {
  poId: number;
  poNumber: string;
  subTotal: number;
  taxAmount: number;
  totalWithTax: number;
  taxCurrency: string;
  taxJurisdiction?: string;
  taxAuditId?: string;
  taxCalculatedAt?: string;
  lines: TaxLineSummary[];
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export interface InventoryItem {
  id?: number;
  item: Item;
  onHandQty: number;
  reorderPoint: number;
  reorderQty: number;
  location?: string;
  lastUpdated?: string;
  lowStock?: boolean;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalVendors: number;
  totalItems: number;
  pendingReqs: number;
  openPOs: number;
  lowStockItems: number;
  draftReqs: number;
  approvedReqs: number;
  receivedPOs: number;
}

// ── Catalog Import ────────────────────────────────────────────────────────────
export type ImportStatus  = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
export type FileFormatType = 'CSV' | 'JSON' | 'CXML' | 'EDI' | 'XLSX';
export type SourceType     = 'MANUAL_UPLOAD' | 'SFTP' | 'LINK';

export interface ImportJob {
  id: number;
  jobRef: string;
  sourceType: SourceType;
  formatType: FileFormatType;
  status: ImportStatus;
  fileName?: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  vendor?: Vendor;
  uploadedBy?: { username: string };
}

export interface FailureLog {
  id: number;
  rowNumber?: number;
  sku?: string;
  fieldName?: string;
  rawValue?: string;
  errorCode: string;
  errorMessage: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Approval Engine ───────────────────────────────────────────────────────────

/** Document types the approval engine can gate */
export type ApprovalDocumentType =
  | 'REQUISITION'
  | 'PO_STANDARD'
  | 'PO_BLANKET'
  | 'PO_EMERGENCY'
  | 'PO_SERVICE'
  | 'PO_CONFIRMING'
  | 'PO_PLANNED'
  | 'PO_STOREROOM';

/** Fields that can be used as rule conditions */
export type ApprovalConditionField =
  | 'SPEND_AMOUNT'
  | 'PO_TYPE'
  | 'DEPARTMENT'
  | 'GL_ACCOUNT'
  | 'VENDOR'
  | 'COST_CENTER'
  | 'CATEGORY';

export type ApprovalConditionOperator =
  | 'GT' | 'GTE' | 'LT' | 'LTE' | 'EQ' | 'NEQ'
  | 'IN' | 'NOT_IN'
  | 'BETWEEN'
  | 'STARTS_WITH' | 'CONTAINS';

export type ApprovalStepType    = 'POSITION' | 'DIRECT_MANAGER' | 'SPECIFIC_PERSON';
export type ApprovalMode        = 'ANY_ONE' | 'ALL' | 'MAJORITY';
export type ApprovalTimeout     = 'ESCALATE' | 'AUTO_APPROVE' | 'AUTO_REJECT' | 'REMIND';
export type ApprovalPolicyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ApprovalCondition {
  id?:       string;
  field:     ApprovalConditionField;
  operator:  ApprovalConditionOperator;
  value:     string;
  valueTo?:  string;  // used when operator === 'BETWEEN'
}

export interface ApprovalStep {
  id?:                    string;
  stepNumber:             number;
  label?:                 string;
  stepType:               ApprovalStepType;
  positionIds?:           number[];
  personIds?:             number[];
  approvalMode:           ApprovalMode;
  approvalLimitAmount?:   number;   // max spend this step can approve; null = unlimited
  timeoutHours?:          number;
  onTimeout?:             ApprovalTimeout;
}

export interface ApprovalRule {
  id?:            string;
  policyId?:      string;
  name:           string;
  description?:   string;
  priority:       number;    // lower = evaluated first
  active:         boolean;
  stopOnMatch:    boolean;   // if true, no further rules are evaluated after match
  documentTypes:  ApprovalDocumentType[];
  conditions:     ApprovalCondition[];
  steps:          ApprovalStep[];
  createdAt?:     string;
  updatedAt?:     string;
}

export interface ApprovalPolicy {
  id?:           string;
  name:          string;
  description?:  string;
  status:        ApprovalPolicyStatus;
  effectiveDate?: string;
  rules?:        ApprovalRule[];
  createdAt?:    string;
  updatedAt?:    string;
}

// ── Integration ───────────────────────────────────────────────────────────────
export type ProtocolType = 'FTP' | 'SFTP' | 'AS2' | 'AS4';

export type IntegrationPartyType = 'VENDOR' | 'COMPANY';

export type IntegrationPurpose =
  | 'EDI_EDIFACT'   // Electronic invoice, PO & ASN exchange via X12 or UN/EDIFACT
  | 'CATALOG'       // Automated product catalogue & pricing sync
  | 'OCR'           // SFTP/email pickup of scanned invoices for OCR extraction
  | 'PO_DELIVERY'   // Automated outbound push of purchase orders
  | 'GENERAL';      // Generic file transfer

export interface Integration {
  id?: number;
  // Party
  partyType?: IntegrationPartyType;
  vendor?: Vendor;
  companyId?: number;
  companyName?: string;
  // Purpose
  purpose?: IntegrationPurpose;
  // Protocol
  protocolType: ProtocolType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKeyPath?: string;
  remoteDirectory?: string;
  archiveDirectory?: string;
  filePattern?: string;
  // FTP
  ftpMode?: 'ACTIVE' | 'PASSIVE';
  ftpUseTls?: boolean;
  // AS2
  as2From?: string;
  as2To?: string;
  as2PartnerUrl?: string;
  as2EncryptionAlg?: string;
  as2SigningAlg?: string;
  as2MdnMode?: string;
  // AS4
  as4PartyId?: string;
  as4PartnerPartyId?: string;
  as4EndpointUrl?: string;
  as4SecurityMode?: string;
  //
  active: boolean;
  lastPolledAt?: string;
  // Purpose-specific quick config
  ediStandard?: EdiStandard;
  catalogFileFormat?: FileFormatType;
  poFileFormat?: PoFileFormat;
}

// ── EDI / EDIFACT ─────────────────────────────────────────────────────────────
export type EdiStandard   = 'X12' | 'EDIFACT';
export type EdiDirection  = 'INBOUND' | 'OUTBOUND' | 'BOTH';
export type EdiAckMode    = 'SYNC' | 'ASYNC' | 'NONE';

/** X12 transaction-set codes + EDIFACT message types supported */
export type EdiDocType =
  | '832'   | '850'  | '855'  | '856'  | '810'  | '997'   // X12
  | 'PRICAT'| 'ORDERS'| 'ORDRSP'| 'DESADV'| 'INVOIC'| 'CONTRL'; // EDIFACT

export interface EdiTransactionSet {
  docType:      EdiDocType;
  enabled:      boolean;
  direction:    EdiDirection;
  ackRequired:  boolean;
  ackMode?:     EdiAckMode;
  version?:     string;
  description?: string;
}

export interface EdiInterchangeConfig {
  id?:              number;
  vendorId?:        number;
  standard:         EdiStandard;
  active:           boolean;
  // ── X12 ISA ────────────────────────────────────────────────────────────────
  isaSenderQual?:        string;   // ISA05 — typically '01','ZZ','08'
  isaSenderId?:          string;   // ISA06
  isaReceiverQual?:      string;   // ISA07
  isaReceiverId?:        string;   // ISA08
  isaAuthInfoQual?:      string;   // ISA01
  isaAuthInfo?:          string;   // ISA02
  isaSecurityInfoQual?:  string;   // ISA03
  isaSecurityInfo?:      string;   // ISA04
  isaVersion?:           string;   // ISA12 — e.g. '00401','00501'
  isaUsageIndicator?:    'P' | 'T'; // ISA15 P=Production T=Test
  isaAckRequested?:      boolean;  // ISA14
  // ── X12 GS (Functional Group) ──────────────────────────────────────────────
  gsApplicationSenderId?:   string;
  gsApplicationReceiverId?: string;
  gsResponsibleAgency?:     string; // typically 'X'
  // ── EDIFACT UNB (Interchange) ──────────────────────────────────────────────
  unbSyntaxId?:          string;   // e.g. 'UNOA','UNOB'
  unbSyntaxVersion?:     string;   // '1','2','3','4'
  unbSenderId?:          string;   // UNB-S002
  unbSenderQual?:        string;   // UNB-S002 qualifier
  unbRecipientId?:       string;   // UNB-S003
  unbRecipientQual?:     string;   // UNB-S003 qualifier
  unbTestIndicator?:     boolean;  // UNB-0035
  // ── Transaction Sets / Message Types ──────────────────────────────────────
  transactionSets?: EdiTransactionSet[];
}

/** Live EDI document record (inbound or outbound) */
export type EdiDocStatus = 'QUEUED' | 'SENT' | 'RECEIVED' | 'ACKNOWLEDGED' | 'FAILED' | 'REJECTED';
export type EdiAckStatus = 'PENDING' | 'ACCEPTED' | 'ACCEPTED_WITH_ERRORS' | 'REJECTED' | 'NOT_REQUIRED';

export interface EdiDocument {
  id:           number;
  vendorId?:    number;
  vendorName?:  string;
  docType:      EdiDocType;
  direction:    EdiDirection;
  referenceId?: string;
  controlNumber?: string;
  status:       EdiDocStatus;
  ackStatus?:   EdiAckStatus;
  ackReceivedAt?: string;
  fileSizeBytes?: number;
  errorMessage?:  string;
  createdAt:    string;
  processedAt?: string;
}

// ── Catalog Feed Config ───────────────────────────────────────────────────────
export type MergeMode = 'SKIP' | 'UPDATE' | 'REPLACE';

export interface CatalogColumnMapping {
  id?:           number;
  sourceColumn:  string;
  targetField:   string;
  required?:     boolean;
  defaultValue?: string;
  transform?:    string; // e.g. 'UPPERCASE', 'TRIM', 'ROUND_2'
}

export interface CatalogFeedConfig {
  id?:                    number;
  vendorId?:              number;
  autoImport:             boolean;
  pollFrequencyMinutes?:  number;
  defaultFormatType?:     FileFormatType;
  mergeMode:              MergeMode;
  archiveAfterImport:     boolean;
  archiveDirectory?:      string;
  notifyOnComplete?:      boolean;
  notifyEmail?:           string;
  columnMappings?:        CatalogColumnMapping[];
}

// ── API wrapper ───────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDI Processing Engine — types merged from EDI EDIFACT project
// ═══════════════════════════════════════════════════════════════════════════════

// ── EDI Integration (processing engine partner connection) ────────────────────
export type EdiIntegrationType  = 'EDI_X12' | 'EDIFACT' | 'XRECHNUNG' | 'CXML';
export type EdiFileType         = 'INVOICE' | 'CREDIT_MEMO';
export type EdiTransportProto   = 'SFTP' | 'FTP' | 'AS2' | 'AS4';
export type EdiAuthMethod       = 'PASSWORD' | 'SSH_KEY' | 'CERTIFICATE';
export type EdiIntegrationStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';
export type EdiResultStatus     = 'SUCCESS' | 'PARTIAL' | 'FAILED';

export type FtpTlsMode      = 'NONE' | 'EXPLICIT' | 'IMPLICIT';
export type FtpTransferMode = 'ASCII' | 'BINARY';
export type As2MdnMode      = 'SYNC' | 'ASYNC' | 'NONE';
export type As2SignAlgo     = 'SHA1' | 'SHA256' | 'SHA384' | 'SHA512';
export type As2EncryptAlgo  = 'DES3' | 'RC2' | 'AES128' | 'AES192' | 'AES256';
export type ErrorStrategy   = 'SKIP' | 'STOP' | 'QUARANTINE';
export type BackoffStrategy = 'FIXED' | 'LINEAR' | 'EXPONENTIAL';

export interface EdiTransportConfig {
  protocol: EdiTransportProto;

  // ── Common ──────────────────────────────────────────────────────────────
  host: string;
  port: number;
  username?: string;
  password?: string;
  sshKeyRef?: string;
  certificateRef?: string;
  remoteInboxPath: string;
  remoteArchivePath?: string;
  remoteErrorPath?: string;
  processedSuffix: string;
  fileFilterPattern?: string;        // e.g. *.edi, invoice_*.xml
  maxFileSizeKb?: number;
  connectionTimeoutSecs?: number;
  socketTimeoutSecs?: number;

  // ── SFTP specific ────────────────────────────────────────────────────────
  serverFingerprint?: string;        // SHA256:xxx — verified on connect
  knownHostsRef?: string;            // vault path to known_hosts file
  preferredCiphers?: string;         // comma-separated cipher list
  keepAliveIntervalSecs?: number;
  compressionEnabled?: boolean;
  strictHostKeyChecking?: boolean;

  // ── FTP specific ─────────────────────────────────────────────────────────
  passiveMode?: boolean;
  tlsMode?: FtpTlsMode;              // NONE | EXPLICIT (FTPS) | IMPLICIT
  transferMode?: FtpTransferMode;    // ASCII | BINARY
  maxConcurrentConnections?: number;
  dataChannelProtection?: string;    // P (private) | C (clear)

  // ── AS2 specific ─────────────────────────────────────────────────────────
  as2Id?: string;                    // our AS2 station ID
  as2PartnerId?: string;             // partner's AS2 ID
  as2Url?: string;                   // partner's AS2 HTTP endpoint
  as2MdnMode?: As2MdnMode;           // SYNC | ASYNC | NONE
  as2MdnUrl?: string;                // our async MDN receive URL
  as2SignAlgorithm?: As2SignAlgo;
  as2EncryptAlgorithm?: As2EncryptAlgo;
  as2Compress?: boolean;
  as2MessageSubject?: string;        // default: "EDI Message"
  as2ContentType?: string;           // default: application/edi-x12

  // ── AS4 specific ─────────────────────────────────────────────────────────
  as4PartyId?: string;               // our ebMS party ID
  as4PartyRole?: string;             // e.g. Sender
  as4PartnerPartyId?: string;
  as4PartnerPartyRole?: string;      // e.g. Receiver
  as4Url?: string;                   // partner MSH endpoint
  as4WsdlUrl?: string;
  as4ServiceName?: string;
  as4ServiceType?: string;
  as4Action?: string;
  as4AgreementRef?: string;
  as4MessagePartitionChannel?: string;
  as4ReceiptUrl?: string;            // our receipt callback URL
  as4CompressionType?: string;       // application/gzip | none
  as4WsSecurityEnabled?: boolean;
}

export interface EdiSecurityConfig {
  authMethod: EdiAuthMethod;
  tlsRequired: boolean;
  encryptionEnabled: boolean;
  signatureRequired: boolean;
  // Certificate / key details
  ourCertificateRef?: string;        // vault path to our signing cert
  partnerCertificateRef?: string;    // vault path to partner's public cert
  keystoreRef?: string;              // vault path to JKS/PKCS12 keystore
  keystorePassword?: string;
  truststoreRef?: string;
  truststorePassword?: string;
  tlsMinVersion?: string;            // TLSv1.2 | TLSv1.3
  tlsCipherSuites?: string;          // comma-separated
}

export interface EdiScheduleConfig {
  enabled: boolean;
  cron: string;
  timezone: string;
  // Read-only — set by the backend
  nextRunAt?: string;
  lastRunAt?: string;
  lastRunStatus?: EdiResultStatus;
}

export interface EdiFileHandlingConfig {
  errorStrategy: ErrorStrategy;       // SKIP | STOP | QUARANTINE
  duplicateDetection: boolean;
  duplicateWindowHours?: number;      // look-back window for duplicate check
  maxFileSizeKb?: number;
  expectedEncodings?: string;         // UTF-8, ISO-8859-1, etc.
  decompress?: boolean;               // auto-unzip inbound archives
}

export interface EdiRetryConfig {
  maxAttempts: number;
  initialIntervalSecs: number;
  backoffStrategy: BackoffStrategy;
  backoffMultiplier?: number;         // for EXPONENTIAL
  maxIntervalSecs?: number;
  notifyAfterAttempts?: number;       // send alert after N retries
}

export interface EdiNotificationConfig {
  productionSupportEmail: string;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

export interface EdiProcessingIntegration {
  id: string;
  name: string;
  description?: string;
  vendorId?: number;
  integrationType: EdiIntegrationType;
  status: EdiIntegrationStatus;
  transport: EdiTransportConfig;
  security: EdiSecurityConfig;
  schedule: EdiScheduleConfig;
  fileHandling: EdiFileHandlingConfig;
  retry: EdiRetryConfig;
  notifications: EdiNotificationConfig;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: EdiResultStatus;
}

// ── Parsed Invoice / Credit Memo document model ───────────────────────────────
export interface EdiPartyRef {
  id?: string;
  idQualifier?: string;
  name: string;
  street?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface EdiChargeAllowance {
  type: 'CHARGE' | 'ALLOWANCE';
  description?: string;
  amount: number;
}

export interface EdiTaxLine {
  taxType: string;
  ratePercent: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface EdiInvoiceLine {
  lineNumber: number;
  buyerItemId?: string;
  sellerItemId?: string;
  description?: string;
  quantity: number;
  unitOfMeasure?: string;
  unitPrice: number;
  lineNetAmount: number;
  taxRatePercent?: number;
}

export interface EdiInvoiceDocument {
  documentType: EdiFileType;
  documentNumber: string;
  documentDate: string;
  currency: string;
  buyer: EdiPartyRef;
  seller: EdiPartyRef;
  remitTo?: EdiPartyRef;
  purchaseOrderNumber?: string;
  paymentTermsDays?: number;
  lines: EdiInvoiceLine[];
  chargesAndAllowances: EdiChargeAllowance[];
  taxLines: EdiTaxLine[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
}

// ── Integration Mapping Engine ────────────────────────────────────────────────
export type EdiFormatType =
  | 'EDI_X12' | 'EDIFACT' | 'XRECHNUNG' | 'CXML' | 'JSON' | 'CSV';
export type EdiMappingDirection  = 'INBOUND' | 'OUTBOUND' | 'BOTH';
export type EdiDataType =
  | 'STRING' | 'NUMERIC' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'CODE';
export type EdiTransformationType =
  | 'PASSTHROUGH' | 'TRIM' | 'PAD' | 'SUBSTRING'
  | 'DATE_REFORMAT' | 'NUMERIC_SCALE' | 'CODE_MAP'
  | 'CONCATENATE' | 'SPLIT' | 'CONSTANT';

export interface EdiTransformationRule {
  type: EdiTransformationType;
  width?: number;
  padChar?: string;
  side?: 'LEFT' | 'RIGHT';
  start?: number;
  end?: number;
  fromFormat?: string;
  toFormat?: string;
  factor?: number;
  delimiter?: string;
  index?: number;
  value?: string;
}

export interface EdiValidationRule {
  pattern?: string;
  minValue?: number;
  maxValue?: number;
  allowedValues?: string[];
}

export interface EdiCodeMap {
  id: string;
  elementRef: string;
  ediCode: string;
  appCode: string;
  description?: string;
}

export interface EdiElementDefinition {
  elementRef: string;
  segmentRef: string;
  elementCode: string;
  elementName: string;
  dbColumn: string;
  dataType: EdiDataType;
  minLength?: number;
  maxLength?: number;
  mandatory: boolean;
  direction: EdiMappingDirection;
  defaultValue?: string;
  sequenceNum: number;
  transformationJson?: EdiTransformationRule;
  validationJson?: EdiValidationRule;
  codeMaps?: EdiCodeMap[];
}

export interface EdiSegmentDefinition {
  segmentRef: string;
  segmentCode: string;
  segmentName: string;
  dbTable: string;
  primaryKeyCol: string;
  foreignKeyCol?: string;
  loopId?: string;
  maxOccurrences?: number;
  elements: EdiElementDefinition[];
}

export interface EdiMappingProfile {
  mappingProfileId: string;
  integrationId: string;
  integrationName: string;
  formatType: EdiFormatType;
  documentType: EdiFileType;
  transactionCode: string;
  direction: EdiMappingDirection;
  version?: string;
  effectiveDate: string;
  expiryDate?: string;
  enabled: boolean;
  segments: EdiSegmentDefinition[];
  createdAt: string;
  updatedAt: string;
}

// ── Processing Results ────────────────────────────────────────────────────────
export interface EdiProcessingLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface EdiValidationIssue {
  field: string;
  segment?: string;
  severity: 'WARN' | 'ERROR';
  message: string;
}

export interface EdiProcessingResult {
  id: string;
  integrationId: string;
  integrationName: string;
  integrationType: EdiIntegrationType;
  fileType: EdiFileType;
  sourceFileName: string;
  renamedTo?: string;
  pickedUpAt: string;
  completedAt?: string;
  status: EdiResultStatus;
  document?: EdiInvoiceDocument;
  issues: EdiValidationIssue[];
  log: EdiProcessingLogEntry[];
  rawSnippet?: string;
}

// ── PunchOut (cXML / Ariba) ───────────────────────────────────────────────────

export interface PunchOutSession {
  id: number;
  sessionToken: string;
  buyerCookie: string;
  operation: 'create' | 'edit' | 'inspect';
  userExtrinsicsJson?: string;   // JSON string — parse to get email, name, etc.
  shipToJson?: string;           // JSON string — delivery address hint
  browserFormPostUrl: string;
  used: boolean;
  expiresAt: string;             // ISO timestamp
  createdAt: string;
}

export interface PunchOutLineItem {
  lineNumber?: number;
  supplierPartId: string;
  supplierPartAuxId?: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  description: string;
  unitOfMeasure?: string;
  unspscCode?: string;
  manufacturerPartId?: string;
  manufacturerName?: string;
  imageUrl?: string;
}

export interface PunchOutRequisition {
  id: number;
  buyerCookie: string;
  totalAmount: number;
  currency: string;
  shippingAmount?: number;
  taxAmount?: number;
  operationAllowed: string;
  status: 'PENDING' | 'CONVERTED' | 'CANCELLED';
  lineItems: PunchOutLineItem[];
  createdAt: string;
}

export interface PunchOutOrder {
  id: number;
  orderId: string;
  orderDate: string;
  orderType: 'new' | 'update' | 'delete';
  agreementId?: string;
  buyerIdentity: string;
  totalAmount: number;
  currency: string;
  status: 'RECEIVED' | 'PROCESSING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
  shipTo?: Record<string, string>;
  billTo?: Record<string, string>;
  lineItems: PunchOutLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PunchOutCartItem {
  supplierPartId: string;
  supplierPartAuxId?: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  description: string;
  unitOfMeasure?: string;
  unspscCode?: string;
  manufacturerPartId?: string;
  manufacturerName?: string;
  imageUrl?: string;
}

export interface PunchOutCartReturnRequest {
  buyerCookie: string;
  operationAllowed?: 'create' | 'edit';
  totalAmount: number;
  currency?: string;
  shippingAmount?: number;
  taxAmount?: number;
  items: PunchOutCartItem[];
}

// ── PunchOut Vendor Configuration ─────────────────────────────────────────────

export type PunchOutDeploymentMode = 'TEST' | 'PRODUCTION';
export type PunchOutTestStatus     = 'OK' | 'FAILED';

/**
 * Per-vendor cXML PunchOut setup — stored once per registered PunchOut vendor.
 * Drives the cXML Sender/Receiver identity block, endpoint routing, and
 * APSS account binding for each supplier.
 */
export interface PunchOutVendorConfig {
  id?:               number | string;
  // Vendor link
  vendorId?:         number;
  vendorName?:       string;
  // Branding shown in the catalogue frame
  displayName?:      string;
  logoUrl?:          string;
  // Operational status
  active:            boolean;
  deploymentMode:    PunchOutDeploymentMode;  // TEST or PRODUCTION
  // ── cXML Header — Sender (buyer) identity ────────────────────────────────
  fromDomain?:       string;   // e.g. "AribaNetworkUserId", "DUNS", "NetworkId"
  fromIdentity?:     string;   // our network ID / email / DUNS number
  // ── cXML Header — Receiver (vendor) identity ─────────────────────────────
  toDomain?:         string;   // vendor's qualifier
  toIdentity?:       string;   // vendor's network ID
  // ── Authentication ────────────────────────────────────────────────────────
  sharedSecret?:     string;   // cXML shared secret (password element)
  // ── Endpoints ─────────────────────────────────────────────────────────────
  punchoutSetupUrl?: string;   // vendor's PunchOutSetupRequest HTTP endpoint
  ordersUrl?:        string;   // vendor's OrderRequest delivery URL
  returnUrl?:        string;   // our browser form-post return URL (auto-generated if blank)
  // ── Account & Contract ────────────────────────────────────────────────────
  apssAccountNumber?: string;  // Ariba Network ID (ANID) e.g. AN01234567890123
  contractNumber?:    string;  // optional procurement contract reference
  // ── Settings ──────────────────────────────────────────────────────────────
  defaultCurrency?:  string;
  // ── Metadata ──────────────────────────────────────────────────────────────
  createdAt?:        string;
  updatedAt?:        string;
  lastTestedAt?:     string;
  testStatus?:       PunchOutTestStatus | null;
}

// ── OCR / Invoice Processing ──────────────────────────────────────────────────
export type OcrDocumentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'DUPLICATE';
export type OcrDocumentType   = 'INVOICE' | 'CREDIT_MEMO' | 'UNKNOWN';
export type OcrSourceType     = 'SFTP' | 'EMAIL' | 'MANUAL';

export interface OcrExtractedField {
  fieldName:  string;
  value:      string;
  confidence: number;
  flagged:    boolean;
}

export interface OcrLineItem {
  description: string;
  quantity:    number;
  unitPrice:   number;
  totalAmount: number;
  taxRate:     number;
  taxAmount:   number;
  discount:    number;
}

export interface OcrAuditEntry {
  timestamp: string;
  action:    string;
  user:      string;
  details:   string;
}

export interface OcrDocument {
  id:                string;
  fileName:          string;
  documentType:      OcrDocumentType;
  status:            OcrDocumentStatus;
  sourceType:        OcrSourceType;
  receivedAt:        string;
  processedAt:       string | null;
  vendorName:        string | null;
  invoiceNumber:     string | null;
  invoiceDate:       string | null;
  poReference:       string | null;
  currency:          string | null;
  subtotal:          number | null;
  taxAmount:         number | null;
  grandTotal:        number | null;
  paymentTerms:      string | null;
  dueDate:           string | null;
  bankDetails:       string | null;
  lineItems:         OcrLineItem[];
  extractedFields:   OcrExtractedField[];
  errorMessage:      string | null;
  isDuplicate:       boolean;
  overallConfidence: number;
  auditLog:          OcrAuditEntry[];
  // Procurement linkage (set after matching)
  linkedVendorId?:   number | null;
  linkedPoId?:       number | null;
  matchedPo?:        string | null;
}

export interface OcrQueueStats {
  total:      number;
  pending:    number;
  processing: number;
  successful: number;
  failed:     number;
  duplicate:  number;
}

// ── Multi-Tenant Foundation ───────────────────────────────────────────────────

export interface Customer {
  customerId:    number;
  customerCode:  string;
  customerName:  string;
  status:        'ACTIVE' | 'INACTIVE';
  createdAt?:    string;
}

export interface Company {
  companyId:    number;
  companyCode:  string;
  companyName:  string;
  customer?:    { customerId: number; customerName: string };
  legalEntity?: string;
  country?:     string;
  currency?:    string;
  address?:     string;
  status:       'ACTIVE' | 'INACTIVE';
  createdAt?:   string;
}

// ── Access Matrix ─────────────────────────────────────────────────────────────
// Each module key maps to a permission object.
export type ModulePermission = {
  view?:    boolean;
  create?:  boolean;
  edit?:    boolean;
  delete?:  boolean;
  approve?: boolean;
  import?:  boolean;
  adjust?:  boolean;
  manage?:  boolean;
  upload?:  boolean;
};

export interface AccessMatrix {
  dashboard?:      { view?: boolean };
  vendors?:        ModulePermission;
  catalog?:        ModulePermission;
  orderGuides?:    ModulePermission;
  requisitions?:   ModulePermission;
  purchaseOrders?: ModulePermission;
  inventory?:      ModulePermission;
  integration?:    ModulePermission;
  logs?:           ModulePermission;
  settings?:       ModulePermission;
  orgStructure?:   ModulePermission;
  orgDocuments?:   ModulePermission;
  orgAnalytics?:   ModulePermission;
  persons?:        ModulePermission;
  positions?:      ModulePermission;
  vendorInbox?:    ModulePermission;
}

export interface Position {
  positionId:    number;
  positionCode:  string;
  positionName:  string;
  company?:      { companyId: number; companyName: string };
  description?:  string;
  accessMatrix:  string;  // JSON string — parse to AccessMatrix
  isSystemRole:  boolean;
  status:        'ACTIVE' | 'INACTIVE';
  createdAt?:    string;
}

export type OrgUnitType = 'DIVISION' | 'LEGAL_ENTITY' | 'BU' | 'OU' | 'DEPARTMENT' | 'SUB_DEPARTMENT';

export interface OrgUnit {
  orgUnitId:    number;
  unitCode:     string;
  unitName:     string;
  unitType:     OrgUnitType;
  company?:     { companyId: number; companyName: string };
  parent?:      { orgUnitId: number; unitName: string } | null;
  manager?:     { personId: number; firstName: string; lastName: string } | null;
  costCenter?:  string;
  description?: string;
  sortOrder:    number;
  status:       'ACTIVE' | 'INACTIVE';
  children?:    OrgUnit[];
}

export interface Person {
  personId:      number;
  employeeCode:  string;
  firstName:     string;
  lastName:      string;
  email:         string;
  phone?:        string;
  company?:      { companyId: number; companyName: string };
  position?:     { positionId: number; positionName: string } | null;
  orgUnit?:      { orgUnitId: number; unitName: string } | null;
  manager?:      { personId: number; firstName: string; lastName: string } | null;
  hireDate?:     string | null;
  status:        'ACTIVE' | 'INACTIVE';
  createdAt?:    string;
}

// Extend AuthResponse to include tenant fields
export interface TenantAuthContext {
  customerId?:    number | null;
  customerName?:  string | null;
  companyId?:     number | null;
  companyName?:   string | null;
  positionId?:    number | null;
  positionName?:  string | null;
  personId?:      number | null;
  accessMatrix?:  AccessMatrix;
}
