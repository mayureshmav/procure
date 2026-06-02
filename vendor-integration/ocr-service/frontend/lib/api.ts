import axios from 'axios';
import type { OcrDocument, PageResponse } from '@/types';

const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Documents ────────────────────────────────────────────────────────────────

export const getDocuments = (params: {
  page?: number;
  size?: number;
  status?: string;
  search?: string;
  documentType?: string;
}) => http.get<PageResponse<OcrDocument>>('/documents', { params }).then((r) => r.data);

export const getDocument = (id: string) =>
  http.get<OcrDocument>(`/documents/${id}`).then((r) => r.data);

export const reprocessDocument = (id: string) =>
  http.post<OcrDocument>(`/documents/${id}/reprocess`).then((r) => r.data);

export const validateDocument = (id: string, corrections: Record<string, string>) =>
  http.post<OcrDocument>(`/documents/${id}/validate`, corrections).then((r) => r.data);

export const uploadDocument = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<OcrDocument>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

// ─── Integration config ───────────────────────────────────────────────────────

export const saveSftpConfig = (data: unknown) =>
  http.post('/integration/sftp', data).then((r) => r.data);

export const testSftpConnection = (data: unknown) =>
  http.post<{ success: boolean; message: string }>('/integration/sftp/test', data).then((r) => r.data);

export const saveEmailConfig = (data: unknown) =>
  http.post('/integration/email', data).then((r) => r.data);

export const saveOcrSettings = (data: unknown) =>
  http.post('/integration/ocr-settings', data).then((r) => r.data);

// ─── Queue stats ──────────────────────────────────────────────────────────────

export const getQueueStats = () =>
  http.get<{
    total: number;
    pending: number;
    processing: number;
    successful: number;
    failed: number;
    duplicate: number;
  }>('/documents/stats').then((r) => r.data);
