import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── JWT interceptors ──────────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    // 401 = token invalid/expired; 403 = Spring Security unauthenticated default before fix
    if ((err.response?.status === 401 || err.response?.status === 403) && typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      // No real token (or dev bypass) — send to login instead of letting the
      // error bubble up and trigger misleading "Backend not reachable" banners.
      if (!token || token.startsWith('bypass-')) {
        localStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
      const refresh = localStorage.getItem('refreshToken');
      if (refresh && !refresh.startsWith('bypass-')) {
        try {
          const res = await axios.post('/api/auth/refresh', null, {
            headers: { Authorization: `Bearer ${refresh}` },
          });
          const newToken = res.data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          err.config.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(err.config);
        } catch {
          localStorage.clear();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        // Real token exists but no valid refresh token — force re-login
        localStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (data: object) =>
  api.post('/auth/login', data).then(r => r.data.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/dashboard/stats').then(r => r.data);

// ── Vendors ───────────────────────────────────────────────────────────────────
export const getVendors   = (params?: object) => api.get('/vendors', { params }).then(r => r.data);
export const getVendor    = (id: number) => api.get(`/vendors/${id}`).then(r => r.data);
export const createVendor = (data: object) => api.post('/vendors', data).then(r => r.data);
export const updateVendor = (id: number, data: object) => api.put(`/vendors/${id}`, data).then(r => r.data);
export const deleteVendor = (id: number) => api.delete(`/vendors/${id}`);

// ── Items / Catalog ───────────────────────────────────────────────────────────
export const getItems   = (params?: object) => api.get('/items', { params }).then(r => r.data);
export const getItem    = (id: number) => api.get(`/items/${id}`).then(r => r.data);
export const createItem = (data: object) => api.post('/items', data).then(r => r.data);
export const updateItem = (id: number, data: object) => api.put(`/items/${id}`, data).then(r => r.data);
export const deleteItem = (id: number) => api.delete(`/items/${id}`);

// ── Catalog Import ────────────────────────────────────────────────────────────
export const uploadCatalog = (vendorId: number, formatType: string, file: File) => {
  const form = new FormData();
  form.append('vendorId', String(vendorId));
  form.append('formatType', formatType);
  form.append('file', file);
  return api.post('/catalog/import/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data.data);
};
export const getImportJobs     = (page = 0, size = 20) =>
  api.get('/catalog/import/jobs', { params: { page, size } }).then(r => r.data.data);
export const getImportJob      = (id: number) =>
  api.get(`/catalog/import/jobs/${id}`).then(r => r.data.data);
export const getImportFailures = (id: number) =>
  api.get(`/catalog/import/jobs/${id}/failures`).then(r => r.data.data);

// ── Integration (SFTP/FTP/AS2/AS4) ───────────────────────────────────────────
export const getIntegrations      = () =>
  api.get('/integrations').then(r => r.data.data);
export const getIntegrationByVendor = (vendorId: number) =>
  api.get(`/integrations/vendor/${vendorId}`).then(r => r.data.data);
export const saveIntegration      = (vendorId: number, data: object) =>
  api.post(`/integrations/vendor/${vendorId}`, data).then(r => r.data.data);
export const updateIntegration    = (id: number, data: object) =>
  api.put(`/integrations/${id}`, data).then(r => r.data.data);
export const deleteIntegration    = (id: number) => api.delete(`/integrations/${id}`);
export const testIntegration      = (id: number) =>
  api.post(`/integrations/${id}/test`).then(r => r.data.data);

// ── Settings — UOM ────────────────────────────────────────────────────────────
export const getUoms      = () => api.get('/settings/uom').then(r => r.data.data);
export const createUom    = (data: object) => api.post('/settings/uom', data).then(r => r.data.data);
export const updateUom    = (id: number, data: object) => api.put(`/settings/uom/${id}`, data).then(r => r.data.data);
export const deleteUom    = (id: number) => api.delete(`/settings/uom/${id}`);

// ── EDI / EDIFACT ─────────────────────────────────────────────────────────────
export const getEdiConfig       = (vendorId: number) =>
  api.get(`/edi/config/vendor/${vendorId}`).then(r => r.data.data).catch(() => null);
export const saveEdiConfig      = (vendorId: number, data: object) =>
  api.post(`/edi/config/vendor/${vendorId}`, data).then(r => r.data.data);
export const updateEdiConfig    = (id: number, data: object) =>
  api.put(`/edi/config/${id}`, data).then(r => r.data.data);
export const getEdiDocuments    = (vendorId?: number, params?: object) =>
  api.get('/edi/documents', { params: { vendorId, ...params } }).then(r => r.data.data).catch(() => []);
export const sendEdiDocument    = (vendorId: number, docType: string, refId: string) =>
  api.post('/edi/documents/send', { vendorId, docType, referenceId: refId }).then(r => r.data.data);

// ── Catalog Feed Config ───────────────────────────────────────────────────────
export const getCatalogFeedConfig  = (vendorId: number) =>
  api.get(`/catalog/feed-config/vendor/${vendorId}`).then(r => r.data.data).catch(() => null);
export const saveCatalogFeedConfig = (vendorId: number, data: object) =>
  api.post(`/catalog/feed-config/vendor/${vendorId}`, data).then(r => r.data.data);
export const getColumnMappings     = (vendorId: number) =>
  api.get(`/catalog/column-mappings/vendor/${vendorId}`).then(r => r.data.data).catch(() => []);
export const saveColumnMappings    = (vendorId: number, data: object[]) =>
  api.post(`/catalog/column-mappings/vendor/${vendorId}`, data).then(r => r.data.data);

// ── Settings — Currency ───────────────────────────────────────────────────────
export const getCurrencies    = () => api.get('/settings/currencies').then(r => r.data.data);
export const createCurrency   = (data: object) => api.post('/settings/currencies', data).then(r => r.data.data);
export const updateCurrency   = (id: number, data: object) => api.put(`/settings/currencies/${id}`, data).then(r => r.data.data);
export const deleteCurrency   = (id: number) => api.delete(`/settings/currencies/${id}`);

// ── Order Guides ──────────────────────────────────────────────────────────────
export const getOrderGuides     = () => api.get('/order-guides').then(r => r.data);
export const getOrderGuide      = (id: number) => api.get(`/order-guides/${id}`).then(r => r.data);
export const getOrderGuideItems = (id: number) => api.get(`/order-guides/${id}/items`).then(r => r.data);
export const createOrderGuide   = (data: object) => api.post('/order-guides', data).then(r => r.data);
export const updateOrderGuide   = (id: number, data: object) => api.put(`/order-guides/${id}`, data).then(r => r.data);
export const deleteOrderGuide   = (id: number) => api.delete(`/order-guides/${id}`);
export const addOrderGuideItem  = (id: number, data: object) => api.post(`/order-guides/${id}/items`, data).then(r => r.data);
export const removeOrderGuideItem = (id: number, itemId: number) => api.delete(`/order-guides/${id}/items/${itemId}`);

// ── Requisitions ──────────────────────────────────────────────────────────────
export const getRequisitions      = (params?: object) => api.get('/requisitions', { params }).then(r => r.data);
export const getRequisition       = (id: number) => api.get(`/requisitions/${id}`).then(r => r.data);
export const createRequisition    = (data: object) => api.post('/requisitions', data).then(r => r.data);
export const updateRequisition    = (id: number, data: object) => api.put(`/requisitions/${id}`, data).then(r => r.data);
export const addRequisitionLine   = (id: number, data: object) => api.post(`/requisitions/${id}/lines`, data).then(r => r.data);
export const removeRequisitionLine = (id: number, lineId: number) => api.delete(`/requisitions/${id}/lines/${lineId}`);
export const submitRequisition    = (id: number) => api.post(`/requisitions/${id}/submit`).then(r => r.data);
export const approveRequisition   = (id: number, data: object) => api.post(`/requisitions/${id}/approve`, data).then(r => r.data);
export const rejectRequisition    = (id: number, data: object) => api.post(`/requisitions/${id}/reject`, data).then(r => r.data);

// ── Purchase Orders ───────────────────────────────────────────────────────────
export const getPurchaseOrders  = (params?: object) => api.get('/purchase-orders', { params }).then(r => r.data);
export const getPurchaseOrder   = (id: number) => api.get(`/purchase-orders/${id}`).then(r => r.data);
export const createPurchaseOrder = (data: object) => api.post('/purchase-orders', data).then(r => r.data);
export const updatePurchaseOrder = (id: number, data: object) => api.put(`/purchase-orders/${id}`, data).then(r => r.data);
export const createPOFromReq    = (reqId: number) => api.post(`/purchase-orders/from-requisition/${reqId}`).then(r => r.data);
export const addPOLine          = (id: number, data: object) => api.post(`/purchase-orders/${id}/lines`, data).then(r => r.data);
export const submitPO           = (id: number) => api.post(`/purchase-orders/${id}/submit`).then(r => r.data);
export const receiveGoods       = (id: number, data: object) => api.post(`/purchase-orders/${id}/receive`, data).then(r => r.data);
export const closePO            = (id: number) => api.post(`/purchase-orders/${id}/close`).then(r => r.data);
export const cancelPO           = (id: number) => api.post(`/purchase-orders/${id}/cancel`).then(r => r.data);

// ── Tax Engine ────────────────────────────────────────────────────────────────
export const calculateTaxForPO  = (poId: number) => api.post(`/tax/calculate-po/${poId}`).then(r => r.data);
export const getTaxSummary      = (poId: number) => api.get(`/tax/summary/${poId}`).then(r => r.data);

// ── Inventory ─────────────────────────────────────────────────────────────────
export const getInventory         = (params?: object) => api.get('/inventory', { params }).then(r => r.data);
export const getInventoryByItemId = (itemId: number) => api.get(`/inventory/item/${itemId}`).then(r => r.data);
export const upsertInventory      = (itemId: number, data: object) => api.post(`/inventory/item/${itemId}`, data).then(r => r.data);
export const adjustInventory      = (id: number, data: object) => api.patch(`/inventory/${id}/adjust`, data).then(r => r.data);

// ── EDI Processing Integrations ───────────────────────────────────────────────
export const getEdiProcessingIntegrations   = () =>
  api.get('/edi/processing-integrations').then(r => r.data.data ?? r.data).catch(() => []);
export const getEdiProcessingIntegration    = (id: string) =>
  api.get(`/edi/processing-integrations/${id}`).then(r => r.data.data ?? r.data);
export const createEdiProcessingIntegration = (data: object) =>
  api.post('/edi/processing-integrations', data).then(r => r.data.data ?? r.data);
export const updateEdiProcessingIntegration = (id: string, data: object) =>
  api.put(`/edi/processing-integrations/${id}`, data).then(r => r.data.data ?? r.data);
export const deleteEdiProcessingIntegration = (id: string) =>
  api.delete(`/edi/processing-integrations/${id}`);
export const runEdiProcessingIntegration    = (id: string) =>
  api.post(`/edi/processing-integrations/${id}/run`).then(r => r.data.data ?? r.data);

// ── EDI Mapping Profiles ──────────────────────────────────────────────────────
export const getEdiMappingProfiles   = (params?: object) =>
  api.get('/edi/mapping-profiles', { params }).then(r => r.data.data ?? r.data).catch(() => []);
export const getEdiMappingProfile    = (id: string) =>
  api.get(`/edi/mapping-profiles/${id}`).then(r => r.data.data ?? r.data);
export const createEdiMappingProfile = (data: object) =>
  api.post('/edi/mapping-profiles', data).then(r => r.data.data ?? r.data);
export const updateEdiMappingProfile = (id: string, data: object) =>
  api.put(`/edi/mapping-profiles/${id}`, data).then(r => r.data.data ?? r.data);
export const patchEdiMappingProfile  = (id: string, data: object) =>
  api.patch(`/edi/mapping-profiles/${id}`, data).then(r => r.data.data ?? r.data);
export const getEdiSegmentsLibrary   = (excludeProfileId?: string) =>
  api.get('/edi/mapping-profiles/segments', { params: { excludeProfileId } })
     .then(r => r.data.data ?? r.data).catch(() => []);

// ── EDI Processing Results ────────────────────────────────────────────────────
export const getEdiProcessingResults = (params?: object) =>
  api.get('/edi/processing-results', { params }).then(r => r.data.data ?? r.data).catch(() => []);
export const getEdiProcessingResult  = (id: string) =>
  api.get(`/edi/processing-results/${id}`).then(r => r.data.data ?? r.data);

// ── PunchOut (cXML / Ariba) ───────────────────────────────────────────────────
export const getPunchOutRequisitions    = (params?: object) =>
  api.get('/procurement/requisitions', { params }).then(r => r.data.data ?? r.data).catch(() => []);
export const getPunchOutOrders          = (params?: object) =>
  api.get('/procurement/orders', { params }).then(r => r.data.data ?? r.data).catch(() => []);
export const getPunchOutOrder           = (orderId: string) =>
  api.get(`/procurement/orders/${orderId}`).then(r => r.data.data ?? r.data);
export const updatePunchOutOrderStatus  = (orderId: string, status: string) =>
  api.patch(`/procurement/orders/${orderId}/status`, { status }).then(r => r.data.data ?? r.data);
export const buildPunchOutCartReturn    = (data: object) =>
  api.post('/punchout/cart-build', data, { responseType: 'text' }).then(r => r.data);
export const buildPunchOutCartCxml      = (data: object) =>
  api.post('/punchout/cart-cxml', data, { responseType: 'text' }).then(r => r.data);

// ── PunchOut Vendor Configuration ──────────────────────────────────────────────
export const getPunchOutVendorConfigs   = () =>
  api.get('/punchout/vendors').then(r => r.data.data ?? r.data ?? []).catch(() => []);
export const createPunchOutVendorConfig = (data: object) =>
  api.post('/punchout/vendors', data).then(r => r.data.data ?? r.data);
export const updatePunchOutVendorConfig = (id: string | number, data: object) =>
  api.put(`/punchout/vendors/${id}`, data).then(r => r.data.data ?? r.data);
export const deletePunchOutVendorConfig = (id: string | number) =>
  api.delete(`/punchout/vendors/${id}`);
export const testPunchOutVendorConfig   = (id: string | number) =>
  api.post(`/punchout/vendors/${id}/test`).then(r => r.data.data ?? r.data);

// ── OCR / Invoice Processing ──────────────────────────────────────────────────
// These call the OCR feed service (runs on port 8081, proxied at /ocr-api)
const ocrApi = axios.create({
  baseURL: '/ocr-api',
  headers: { 'Content-Type': 'application/json' },
});
ocrApi.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export const getOcrDocuments = (params?: {
  page?: number; size?: number; status?: string; search?: string; documentType?: string;
}) => ocrApi.get('/documents', { params }).then(r => r.data);

export const getOcrDocument = (id: string) =>
  ocrApi.get(`/documents/${id}`).then(r => r.data);

export const uploadOcrDocument = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return ocrApi.post('/documents/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const reprocessOcrDocument = (id: string) =>
  ocrApi.post(`/documents/${id}/reprocess`).then(r => r.data);

export const validateOcrDocument = (id: string, corrections: Record<string, string>) =>
  ocrApi.post(`/documents/${id}/validate`, corrections).then(r => r.data);

export const getOcrQueueStats = () =>
  ocrApi.get('/documents/stats').then(r => r.data);

export const saveOcrSftpConfig   = (data: object) => ocrApi.post('/integration/sftp', data).then(r => r.data);
export const testOcrSftpConn     = (data: object) => ocrApi.post('/integration/sftp/test', data).then(r => r.data);
export const saveOcrEmailConfig  = (data: object) => ocrApi.post('/integration/email', data).then(r => r.data);
export const saveOcrSettings     = (data: object) => ocrApi.post('/integration/ocr-settings', data).then(r => r.data);

// Link OCR-processed invoice to procurement vendor / PO
export const linkOcrDocumentToPo = (id: string, payload: { vendorId?: number; poId?: number; poReference?: string }) =>
  api.post(`/ocr/documents/${id}/link`, payload).then(r => r.data.data ?? r.data);

// ── Customers ─────────────────────────────────────────────────────────────────
export const getCustomers    = ()            => api.get('/customers').then(r => r.data);
export const getCustomer     = (id: number)  => api.get(`/customers/${id}`).then(r => r.data);
export const createCustomer  = (data: object) => api.post('/customers', data).then(r => r.data);
export const updateCustomer  = (id: number, data: object) => api.put(`/customers/${id}`, data).then(r => r.data);
export const deleteCustomer  = (id: number)  => api.delete(`/customers/${id}`);

// ── Companies ─────────────────────────────────────────────────────────────────
export const getCompanies    = (customerId?: number) =>
  api.get('/companies', { params: customerId ? { customerId } : {} }).then(r => r.data);
export const getCompany      = (id: number)  => api.get(`/companies/${id}`).then(r => r.data);
export const createCompany   = (data: object) => api.post('/companies', data).then(r => r.data);
export const updateCompany   = (id: number, data: object) => api.put(`/companies/${id}`, data).then(r => r.data);
export const deleteCompany   = (id: number)  => api.delete(`/companies/${id}`);

// ── Positions ─────────────────────────────────────────────────────────────────
export const getPositions    = (companyId?: number) =>
  api.get('/positions', { params: companyId ? { companyId } : {} }).then(r => r.data);
export const getPosition     = (id: number)  => api.get(`/positions/${id}`).then(r => r.data);
export const createPosition  = (data: object) => api.post('/positions', data).then(r => r.data);
export const updatePosition  = (id: number, data: object) => api.put(`/positions/${id}`, data).then(r => r.data);
export const deletePosition  = (id: number)  => api.delete(`/positions/${id}`);

// ── Persons ───────────────────────────────────────────────────────────────────
export const getPersons      = (params?: { companyId?: number; search?: string; page?: number; size?: number }) =>
  api.get('/persons', { params }).then(r => r.data);
export const getPerson       = (id: number)  => api.get(`/persons/${id}`).then(r => r.data);
export const createPerson    = (data: object) => api.post('/persons', data).then(r => r.data);
export const updatePerson    = (id: number, data: object) => api.put(`/persons/${id}`, data).then(r => r.data);
export const deletePerson    = (id: number)  => api.delete(`/persons/${id}`);

// ── Org Units ─────────────────────────────────────────────────────────────────
export const getOrgUnits     = (params?: { companyId?: number; rootOnly?: boolean }) =>
  api.get('/org-units', { params }).then(r => r.data);
export const getOrgUnit      = (id: number)  => api.get(`/org-units/${id}`).then(r => r.data);
export const getOrgUnitChildren = (id: number, companyId: number) =>
  api.get(`/org-units/${id}/children`, { params: { companyId } }).then(r => r.data);
export const createOrgUnit   = (data: object) => api.post('/org-units', data).then(r => r.data);
export const updateOrgUnit   = (id: number, data: object) => api.put(`/org-units/${id}`, data).then(r => r.data);
export const deleteOrgUnit   = (id: number)  => api.delete(`/org-units/${id}`);

// ── PO Delivery Preferences (per vendor) ─────────────────────────────────────
export const getPoDeliveryPreferences  = (vendorId: number) =>
  api.get(`/vendors/${vendorId}/po-delivery`).then(r => r.data).catch(() => null);
export const savePoDeliveryPreferences = (vendorId: number, data: object) =>
  api.put(`/vendors/${vendorId}/po-delivery`, data).then(r => r.data);

// ── PO Integration Config (vendor's FTP/SFTP target for automated PO push) ──
export const getPoIntegrationConfig  = (vendorId: number) =>
  api.get(`/vendors/${vendorId}/po-integration`).then(r => r.data).catch(() => null);
export const savePoIntegrationConfig = (vendorId: number, data: object) =>
  api.put(`/vendors/${vendorId}/po-integration`, data).then(r => r.data);
export const testPoIntegrationConn   = (vendorId: number) =>
  api.post(`/vendors/${vendorId}/po-integration/test`).then(r => r.data);

// ── Approval Engine ───────────────────────────────────────────────────────────
export const getApprovalPolicy       = () =>
  api.get('/approval/policy').then(r => r.data.data ?? r.data).catch(() => null);
export const createApprovalPolicy    = (data: object) =>
  api.post('/approval/policy', data).then(r => r.data.data ?? r.data);
export const updateApprovalPolicy    = (id: string, data: object) =>
  api.put(`/approval/policy/${id}`, data).then(r => r.data.data ?? r.data);
export const activateApprovalPolicy  = (id: string) =>
  api.post(`/approval/policy/${id}/activate`).then(r => r.data.data ?? r.data);

export const getApprovalRules        = (policyId: string) =>
  api.get(`/approval/policy/${policyId}/rules`).then(r => r.data.data ?? r.data ?? []).catch(() => []);
export const createApprovalRule      = (policyId: string, data: object) =>
  api.post(`/approval/policy/${policyId}/rules`, data).then(r => r.data.data ?? r.data);
export const updateApprovalRule      = (ruleId: string, data: object) =>
  api.put(`/approval/rules/${ruleId}`, data).then(r => r.data.data ?? r.data);
export const deleteApprovalRule      = (ruleId: string) =>
  api.delete(`/approval/rules/${ruleId}`);
export const reorderApprovalRules    = (policyId: string, orderedIds: string[]) =>
  api.put(`/approval/policy/${policyId}/rules/reorder`, { orderedIds }).then(r => r.data.data ?? r.data);

// ── Vendor Inbox (vendor portal — POs sent to vendor) ────────────────────────
export const getVendorInbox      = (params?: { status?: string; page?: number; size?: number }) =>
  api.get('/vendor-inbox', { params }).then(r => r.data).catch(() => ({ content: [], totalPages: 0, totalElements: 0 }));
export const markInboxRead       = (id: string) =>
  api.patch(`/vendor-inbox/${id}/read`).then(r => r.data).catch(() => null);
export const acknowledgeInboxPo  = (id: string) =>
  api.post(`/vendor-inbox/${id}/acknowledge`).then(r => r.data).catch(() => null);

export default api;
