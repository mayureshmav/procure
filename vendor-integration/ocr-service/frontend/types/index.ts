export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'DUPLICATE';
export type DocumentType = 'INVOICE' | 'CREDIT_MEMO' | 'UNKNOWN';
export type SourceType = 'SFTP' | 'EMAIL' | 'MANUAL';

export interface ExtractedField {
  fieldName: string;
  value: string;
  confidence: number;
  flagged: boolean;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
}

export interface OcrDocument {
  id: string;
  fileName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  sourceType: SourceType;
  receivedAt: string;
  processedAt: string | null;
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  poReference: string | null;
  currency: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  grandTotal: number | null;
  paymentTerms: string | null;
  dueDate: string | null;
  bankDetails: string | null;
  lineItems: LineItem[];
  extractedFields: ExtractedField[];
  errorMessage: string | null;
  isDuplicate: boolean;
  overallConfidence: number;
  auditLog: AuditEntry[];
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
