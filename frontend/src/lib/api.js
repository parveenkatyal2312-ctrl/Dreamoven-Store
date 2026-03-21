import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout for slow endpoints
});

// Health check
export const healthCheck = () => api.get('/api/health');

// Dashboard stats
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// Items
export const getItems = (params) => api.get('/api/items', { params });
export const createItem = (data) => api.post('/api/items', data);
export const deleteItem = (id) => api.delete(`/api/items/${id}`);

// Locations
export const getLocations = (params) => api.get('/api/locations', { params });
export const createLocation = (data) => api.post('/api/locations', data);

// Vendors
export const getVendors = () => api.get('/api/vendors');
export const createVendor = (data) => api.post('/api/vendors', data);

// Categories
export const getCategories = () => api.get('/api/categories');
export const createCategory = (name) => api.post('/api/categories', null, { params: { name } });

// GRN
export const createGRN = (data) => api.post('/api/grn', data);
export const getGRNList = (params) => api.get('/api/grn', { params });

// Lots
export const getLots = (params) => api.get('/api/lots', { params });
export const getLotById = (id) => api.get(`/api/lots/${id}`);
export const getLotByQR = (qrData) => api.get(`/api/lots/scan/${encodeURIComponent(qrData)}`);

// Issue
export const createIssue = (data) => api.post('/api/issue', data);
export const createFEFOIssue = (params) => api.post('/api/issue/fefo', null, { params });
export const getIssueList = (params) => api.get('/api/issue', { params });

// Transfer
export const createTransfer = (data) => api.post('/api/transfer', data);
export const getTransferList = (params) => api.get('/api/transfer', { params });

// Alerts
export const getExpiryAlerts = () => api.get('/api/alerts/expiry');

// Waste
export const recordWaste = (params) => api.post('/api/waste', null, { params });

// Reports
export const getStockOnHand = (params) => api.get('/api/reports/stock-on-hand', { params });
export const getMovementLedger = (params) => api.get('/api/reports/movement-ledger', { params });
export const getWastageReport = (params) => api.get('/api/reports/wastage', { params });
export const getVendorLedger = (params) => api.get('/api/reports/vendor-ledger', { 
  params: { ...params, fast: true },
  timeout: 120000  // 2 minute timeout for vendor ledger
});
export const getKitchenLedger = (params) => api.get('/api/reports/kitchen-ledger', { params });

// Seed data
export const seedData = () => api.post('/api/seed');

export default api;
