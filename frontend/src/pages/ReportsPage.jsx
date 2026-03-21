import { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Package, Building2, Store, ChevronDown, ChevronUp, FileSpreadsheet, Camera, MapPin, Clock, Image, Warehouse, TrendingUp, Check } from 'lucide-react';
import { getLocations, getItems, getVendorLedger, getKitchenLedger } from '../lib/api';
import { getVendors } from '../lib/api';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('vendor-ledger');
  const [vendorLedgerData, setVendorLedgerData] = useState(null);
  const [kitchenLedgerData, setKitchenLedgerData] = useState(null);
  const [mainStoreStockData, setMainStoreStockData] = useState(null);
  const [perishableVendorLedger, setPerishableVendorLedger] = useState(null);
  const [consumptionAnalysis, setConsumptionAnalysis] = useState(null);
  const [poDpComparison, setPoDpComparison] = useState(null);
  const [outletWiseComparison, setOutletWiseComparison] = useState(null);
  const [expandedOutlets, setExpandedOutlets] = useState({});
  const [showPhotoDialog, setShowPhotoDialog] = useState(null);
  const [locations, setLocations] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState({});
  const [expandedKitchens, setExpandedKitchens] = useState({});
  const [expandedPerishableVendors, setExpandedPerishableVendors] = useState({});
  const [expandedPerishableKitchens, setExpandedPerishableKitchens] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Filters
  const [filters, setFilters] = useState({
    location_id: 'all',
    category: 'all',
    start_date: '',
    end_date: '',
    type: 'all',
    vendor_id: 'all',
    kitchen_id: 'all',
    include_daily_perishables: true  // New filter for Kitchen Ledger
  });

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [locsRes, itemsRes, vendorsRes] = await Promise.all([
          getLocations(),
          getItems(),
          getVendors()
        ]);
        setLocations(locsRes.data);
        setKitchens(locsRes.data.filter(l => l.type === 'kitchen'));
        setItems(itemsRes.data);
        setVendors(vendorsRes.data);
      } catch (error) {
        console.error('Error fetching master data:', error);
      }
    };
    fetchMasterData();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vendor-ledger') {
        const params = {};
        if (filters.vendor_id !== 'all') params.vendor_id = filters.vendor_id;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        const response = await getVendorLedger(params);
        setVendorLedgerData(response.data);
      } else if (activeTab === 'kitchen-ledger') {
        const params = {};
        if (filters.kitchen_id !== 'all') params.kitchen_id = filters.kitchen_id;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        params.include_daily_perishables = filters.include_daily_perishables;
        const response = await getKitchenLedger(params);
        setKitchenLedgerData(response.data);
      } else if (activeTab === 'mainstore-stock') {
        const response = await api.get('/api/reports/stock-in-hand');
        setMainStoreStockData(response.data);
      } else if (activeTab === 'perishable-vendor') {
        const params = {};
        if (filters.vendor_id !== 'all') params.vendor_id = filters.vendor_id;
        if (filters.kitchen_id !== 'all') params.kitchen_id = filters.kitchen_id;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        const response = await api.get('/api/reports/daily-perishables-vendor-ledger', { params });
        setPerishableVendorLedger(response.data);
      } else if (activeTab === 'consumption') {
        const params = { days_of_data: 30, par_stock_days: 10 };
        if (filters.kitchen_id !== 'all') params.kitchen_id = filters.kitchen_id;
        if (filters.category !== 'all') params.category = filters.category;
        const response = await api.get('/api/reports/consumption-analysis', { params });
        setConsumptionAnalysis(response.data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const toggleVendorExpand = (vendorId) => {
    setExpandedVendors(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }));
  };

  const toggleKitchenExpand = (kitchenId) => {
    setExpandedKitchens(prev => ({
      ...prev,
      [kitchenId]: !prev[kitchenId]
    }));
  };

  // Download Kitchen Consumption Excel
  const downloadKitchenConsumption = async () => {
    if (filters.kitchen_id === 'all') {
      alert('Please select a specific kitchen/outlet to download');
      return;
    }
    
    try {
      setDownloading(true);
      
      const params = new URLSearchParams();
      params.append('kitchen_id', filters.kitchen_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/api/reports/kitchen-consumption/download?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get kitchen name for filename
      const kitchen = kitchens.find(k => k.id === filters.kitchen_id);
      const kitchenName = kitchen?.name?.replace(/\s+/g, '_') || 'outlet';
      const dateRange = filters.start_date && filters.end_date 
        ? `_${filters.start_date}_to_${filters.end_date}` 
        : '';
      
      link.setAttribute('download', `Consumption_${kitchenName}${dateRange}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    } finally {
      setDownloading(false);
    }
  };

  // Download Kitchen Ledger Excel
  const downloadKitchenLedger = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      if (filters.kitchen_id !== 'all') params.append('kitchen_id', filters.kitchen_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/api/export/kitchen-ledger?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Kitchen_Ledger_${filters.start_date || 'all'}_${filters.end_date || 'all'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    } finally {
      setDownloading(false);
    }
  };

  // Download Daily Perishables Excel
  const downloadDailyPerishables = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      if (filters.kitchen_id !== 'all') params.append('kitchen_id', filters.kitchen_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/api/export/daily-perishables?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Daily_Perishables_${filters.start_date || 'all'}_${filters.end_date || 'all'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    } finally {
      setDownloading(false);
    }
  };

  // Download Purchase Orders Excel
  const downloadPurchaseOrders = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/api/export/purchase-orders?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Purchase_Orders_${filters.start_date || 'all'}_${filters.end_date || 'all'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    } finally {
      setDownloading(false);
    }
  };

  // Download Vendor Ledger Excel
  const downloadVendorLedger = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      if (filters.vendor_id !== 'all') params.append('vendor_id', filters.vendor_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/api/export/vendor-ledger?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Vendor_Ledger_${filters.start_date || 'all'}_${filters.end_date || 'all'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    } finally {
      setDownloading(false);
    }
  };

  // Download Daywise Kitchen GRN Summary Excel
  const downloadDaywiseKitchenGRN = async () => {
    if (!filters.start_date) {
      alert('Please select a date');
      return;
    }
    
    try {
      setDownloading(true);
      const response = await api.get(`/api/export/daywise-kitchen-grn?date=${filters.start_date}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Kitchen_GRN_Summary_${filters.start_date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    } finally {
      setDownloading(false);
    }
  };

  // Download Daywise Main Store Input Excel
  const downloadDaywiseMainStoreInput = async () => {
    if (!filters.start_date) {
      alert('Please select a date');
      return;
    }
    
    try {
      setDownloading(true);
      const response = await api.get(`/api/export/daywise-mainstore-input?date=${filters.start_date}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MainStore_Input_${filters.start_date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    } finally {
      setDownloading(false);
    }
  };

  // Download Main Store Stock Excel
  const downloadMainStoreStock = async () => {
    try {
      setDownloading(true);
      const response = await api.get('/api/export/stock-mainstore', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Stock_MainStore_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-emerald-400" />
          Reports
        </h1>
        <p className="text-slate-400 mt-1">Inventory reports, ledgers and analytics</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700 w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="vendor-ledger" className="data-[state=active]:bg-violet-600" data-testid="vendor-ledger-tab">
            <Building2 className="w-4 h-4 mr-2" />
            Vendor Ledger
          </TabsTrigger>
          <TabsTrigger value="kitchen-ledger" className="data-[state=active]:bg-orange-600" data-testid="kitchen-ledger-tab">
            <Store className="w-4 h-4 mr-2" />
            Kitchen Ledger
          </TabsTrigger>
          <TabsTrigger value="daywise-reports" className="data-[state=active]:bg-cyan-600" data-testid="daywise-reports-tab">
            <Calendar className="w-4 h-4 mr-2" />
            Daywise Reports
          </TabsTrigger>
          <TabsTrigger value="mainstore-stock" className="data-[state=active]:bg-emerald-600" data-testid="mainstore-stock-tab">
            <Warehouse className="w-4 h-4 mr-2" />
            Stock in Hand Main Store
          </TabsTrigger>
          <TabsTrigger value="perishable-vendor" className="data-[state=active]:bg-rose-600" data-testid="perishable-vendor-tab">
            <Package className="w-4 h-4 mr-2" />
            Daily Perishables Vendor
          </TabsTrigger>
          <TabsTrigger value="consumption" className="data-[state=active]:bg-purple-600" data-testid="consumption-tab">
            <TrendingUp className="w-4 h-4 mr-2" />
            Consumption Analysis
          </TabsTrigger>
          <TabsTrigger value="po-dp-comparison" className="data-[state=active]:bg-orange-600" data-testid="po-dp-comparison-tab">
            <BarChart3 className="w-4 h-4 mr-2" />
            PO vs DP Comparison
          </TabsTrigger>
          <TabsTrigger value="outlet-wise" className="data-[state=active]:bg-pink-600" data-testid="outlet-wise-tab">
            <MapPin className="w-4 h-4 mr-2" />
            Outlet-wise Analysis
          </TabsTrigger>
        </TabsList>

        {/* ============ VENDOR LEDGER ============ */}
        <TabsContent value="vendor-ledger" className="space-y-4" data-testid="vendor-ledger-content">
          {/* Filters */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Vendor</Label>
                <Select 
                  value={filters.vendor_id} 
                  onValueChange={(val) => setFilters({ ...filters, vendor_id: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="vendor-filter">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Start Date</Label>
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                  data-testid="start-date-filter"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">End Date</Label>
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                  data-testid="end-date-filter"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={loadReport} disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-500" data-testid="generate-vendor-ledger">
                  {loading ? 'Loading...' : 'Generate Ledger'}
                </Button>
                <Button 
                  onClick={downloadVendorLedger} 
                  disabled={downloading} 
                  variant="outline"
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                  data-testid="download-vendor-ledger-btn"
                  title="Download Vendor Ledger Excel"
                >
                  {downloading ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      Excel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Vendor Ledger Results */}
          {vendorLedgerData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/30">
                  <p className="text-2xl font-bold text-white">{vendorLedgerData.summary?.total_vendors || 0}</p>
                  <p className="text-sm text-violet-400">Vendors</p>
                </div>
                {/* MAIN STORE Section */}
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                  <p className="text-2xl font-bold text-white">{vendorLedgerData.summary?.total_po_count || 0}</p>
                  <p className="text-sm text-blue-400">Main Store POs</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                  <p className="text-2xl font-bold text-white">₹{(vendorLedgerData.summary?.grand_total_po_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-blue-400">Main Store PO Value</p>
                </div>
                <div className="p-4 rounded-xl bg-cyan-600/10 border border-cyan-500/30">
                  <p className="text-2xl font-bold text-white">{vendorLedgerData.summary?.total_main_store_grn_count || 0}</p>
                  <p className="text-sm text-cyan-400">Main Store GRNs</p>
                </div>
                <div className="p-4 rounded-xl bg-cyan-600/10 border border-cyan-500/30">
                  <p className="text-2xl font-bold text-white">₹{(vendorLedgerData.summary?.grand_total_main_store_grn_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-cyan-400">Main Store GRN Value</p>
                </div>
                {/* KITCHEN Section */}
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-white">{vendorLedgerData.summary?.total_kitchen_po_count || 0}</p>
                  <p className="text-sm text-amber-400">DP PO Count</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-white">₹{(vendorLedgerData.summary?.grand_total_kitchen_po_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-amber-400">DP PO Value</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-white">{vendorLedgerData.summary?.total_daily_perishable_count || 0}</p>
                  <p className="text-sm text-amber-400">Daily Perishables</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-white">₹{(vendorLedgerData.summary?.grand_total_daily_perishable_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-amber-400">DP GRN Value</p>
                </div>
              </div>

              {/* Vendor Cards */}
              {(vendorLedgerData.vendors || []).length === 0 ? (
                <p className="text-slate-400 text-center py-8">No vendor data found for the selected filters</p>
              ) : (
                <div className="space-y-4">
                  {(vendorLedgerData.vendors || []).map(vendor => (
                    <div key={vendor.vendor_id} className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden" data-testid={`vendor-card-${vendor.vendor_id}`}>
                      {/* Vendor Header */}
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50"
                        onClick={() => toggleVendorExpand(vendor.vendor_id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-violet-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{vendor.vendor_name}</h3>
                            <p className="text-sm text-slate-400">
                              {vendor.vendor_contact && `${vendor.vendor_contact} • `}
                              {vendor.vendor_gst && `GST: ${vendor.vendor_gst}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden md:block">
                            <p className="text-sm text-slate-400">{vendor.po_count || 0} POs • {vendor.main_store_grn_count || 0} GRNs • {vendor.daily_perishable_count || 0} DPs</p>
                            <div className="flex gap-3 items-center">
                              <div className="text-right">
                                <p className="text-xs text-slate-500">PO</p>
                                <p className="text-sm font-medium text-blue-400">₹{(vendor.total_po_value || 0).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500">GRN</p>
                                <p className="text-sm font-medium text-cyan-400">₹{(vendor.total_main_store_grn_value || 0).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500">DP</p>
                                <p className="text-sm font-medium text-amber-400">₹{(vendor.total_daily_perishable_value || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                          {expandedVendors[vendor.vendor_id] ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Mobile Summary */}
                      <div className="px-4 pb-2 md:hidden">
                        <p className="text-sm text-slate-400">{vendor.po_count || 0} POs • {vendor.main_store_grn_count || 0} GRNs • {vendor.daily_perishable_count || 0} DPs</p>
                        <p className="text-xs text-slate-400">
                          PO: <span className="text-blue-400">₹{(vendor.total_po_value || 0).toLocaleString()}</span> | 
                          GRN: <span className="text-cyan-400">₹{(vendor.total_main_store_grn_value || 0).toLocaleString()}</span> | 
                          DP: <span className="text-amber-400">₹{(vendor.total_daily_perishable_value || 0).toLocaleString()}</span>
                        </p>
                      </div>

                      {/* Expanded Details */}
                      {expandedVendors[vendor.vendor_id] && (
                        <div className="border-t border-slate-800 p-4 space-y-4">
                          {/* PO Section */}
                          {(vendor.purchase_orders || []).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-blue-400 mb-2">Purchase Orders ({vendor.po_count || 0})</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-800/50">
                                    <tr>
                                      <th className="text-left p-2 text-slate-400">PO #</th>
                                      <th className="text-left p-2 text-slate-400">Date</th>
                                      <th className="text-right p-2 text-slate-400">Items</th>
                                      <th className="text-right p-2 text-slate-400">PO Amount</th>
                                      <th className="text-center p-2 text-slate-400">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(vendor.purchase_orders || []).map(po => (
                                      <tr key={po.id} className="border-t border-slate-800">
                                        <td className="p-2 text-white font-mono">{po.po_number}</td>
                                        <td className="p-2 text-slate-400">{po.date}</td>
                                        <td className="p-2 text-right text-slate-300">{po.items_count}</td>
                                        <td className="p-2 text-right text-blue-400">₹{(po.total_amount || 0).toLocaleString()}</td>
                                        <td className="p-2 text-center">
                                          <span className={`px-2 py-1 rounded-full text-xs ${
                                            po.status === 'received' ? 'bg-emerald-500/20 text-emerald-400' :
                                            po.status === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                                            po.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                            'bg-blue-500/20 text-blue-400'
                                          }`}>
                                            {po.status.toUpperCase()}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-slate-800/30">
                                    <tr>
                                      <td colSpan="3" className="p-2 text-right text-slate-400 font-medium">PO Total:</td>
                                      <td className="p-2 text-right text-blue-400 font-bold">₹{(vendor.total_po_value || 0).toLocaleString()}</td>
                                      <td></td>
                                    </tr>
                                    <tr className="border-t border-slate-700">
                                      <td colSpan="3" className="p-2 text-right text-slate-400 font-medium">GRN Received:</td>
                                      <td className="p-2 text-right text-emerald-400 font-bold">₹{(vendor.total_grn_value || 0).toLocaleString()}</td>
                                      <td></td>
                                    </tr>
                                    <tr className="border-t border-slate-700">
                                      <td colSpan="3" className="p-2 text-right text-slate-400 font-medium">Difference (PO - GRN):</td>
                                      <td className={`p-2 text-right font-bold ${((vendor.total_po_value || 0) - (vendor.total_grn_value || 0)) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        ₹{((vendor.total_po_value || 0) - (vendor.total_grn_value || 0)).toLocaleString()}
                                      </td>
                                      <td></td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* GRN Section */}
                          {(vendor.grn_entries || []).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-emerald-400 mb-2">Materials Received - GRN & Daily Perishables ({vendor.grn_count || 0})</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-800/50">
                                    <tr>
                                      <th className="text-left p-2 text-slate-400">Ref #</th>
                                      <th className="text-left p-2 text-slate-400">Date</th>
                                      <th className="text-left p-2 text-slate-400">Item</th>
                                      <th className="text-left p-2 text-slate-400">Category</th>
                                      <th className="text-left p-2 text-slate-400">Kitchen</th>
                                      <th className="text-right p-2 text-slate-400">Qty</th>
                                      <th className="text-right p-2 text-slate-400">Rate</th>
                                      <th className="text-right p-2 text-slate-400">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(vendor.grn_entries || []).map((grn, idx) => (
                                      <tr key={`${grn.lot_id}-${idx}`} className={`border-t border-slate-800 ${grn.type === 'Daily Perishable' ? 'bg-amber-900/10' : ''}`}>
                                        <td className="p-2 text-white font-mono text-xs">
                                          {grn.lot_number}
                                          {grn.type === 'Daily Perishable' && <span className="ml-1 text-amber-400 text-xs">(DP)</span>}
                                        </td>
                                        <td className="p-2 text-slate-400">{grn.date}</td>
                                        <td className="p-2 text-white">{grn.item_name}</td>
                                        <td className="p-2 text-slate-400">{grn.category}</td>
                                        <td className="p-2 text-slate-400 text-xs">{grn.kitchen_name || 'Main Store'}</td>
                                        <td className="p-2 text-right text-slate-300">{grn.quantity} {grn.unit}</td>
                                        <td className="p-2 text-right text-slate-300">₹{grn.rate || 0}</td>
                                        <td className="p-2 text-right text-white">₹{(grn.amount || 0).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-slate-800/30">
                                    <tr>
                                      <td colSpan="7" className="p-2 text-right text-slate-400 font-medium">Total (GRN + DP):</td>
                                      <td className="p-2 text-right text-emerald-400 font-bold">₹{(vendor.total_grn_value || 0).toLocaleString()}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}

                          {(vendor.purchase_orders || []).length === 0 && (vendor.grn_entries || []).length === 0 && (
                            <p className="text-slate-500 text-center py-4">No transactions found for this vendor</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ============ KITCHEN LEDGER ============ */}
        <TabsContent value="kitchen-ledger" className="space-y-4" data-testid="kitchen-ledger-content">
          {/* Filters */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Kitchen</Label>
                <Select 
                  value={filters.kitchen_id} 
                  onValueChange={(val) => setFilters({ ...filters, kitchen_id: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="kitchen-filter">
                    <SelectValue placeholder="All Kitchens" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Kitchens</SelectItem>
                    {kitchens.map(k => (
                      <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Start Date</Label>
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">End Date</Label>
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="include-perishables"
                  checked={filters.include_daily_perishables}
                  onChange={(e) => setFilters({ ...filters, include_daily_perishables: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800"
                />
                <Label htmlFor="include-perishables" className="text-slate-300 text-sm cursor-pointer">
                  Include Daily Perishables
                </Label>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={loadReport} disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-500" data-testid="generate-kitchen-ledger">
                  {loading ? 'Loading...' : 'Generate Ledger'}
                </Button>
                <Button 
                  onClick={downloadKitchenLedger} 
                  disabled={downloading} 
                  variant="outline"
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                  data-testid="download-kitchen-ledger-btn"
                  title="Download Kitchen Ledger Excel"
                >
                  {downloading ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      Excel
                    </>
                  )}
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      setDownloading(true);
                      const params = new URLSearchParams();
                      if (filters.start_date) params.append('start_date', filters.start_date);
                      if (filters.end_date) params.append('end_date', filters.end_date);
                      if (filters.kitchen_id !== 'all') params.append('kitchen_id', filters.kitchen_id);
                      
                      const response = await api.get(`/api/export/kitchen-ledger-itemwise?${params.toString()}`, {
                        responseType: 'blob'
                      });
                      
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `Kitchen_Ledger_Itemwise_${filters.start_date || 'all'}_${filters.end_date || 'all'}.xlsx`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (error) {
                      console.error('Error downloading itemwise report:', error);
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  disabled={downloading} 
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-600/20"
                  data-testid="download-kitchen-ledger-itemwise-btn"
                  title="Download Item-wise Report by Category"
                >
                  {downloading ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      Itemwise
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Kitchen Ledger Results */}
          {kitchenLedgerData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-orange-600/10 border border-orange-500/30">
                  <p className="text-2xl font-bold text-white">{kitchenLedgerData.summary.total_kitchens}</p>
                  <p className="text-sm text-orange-400">Kitchens</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                  <p className="text-2xl font-bold text-white">{kitchenLedgerData.summary.total_dispatches}</p>
                  <p className="text-sm text-blue-400">Dispatches</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30">
                  <p className="text-2xl font-bold text-white">{kitchenLedgerData.summary.grand_total_quantity.toLocaleString()}</p>
                  <p className="text-sm text-emerald-400">Total Qty Issued</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-white">₹{kitchenLedgerData.summary.grand_total_value.toLocaleString()}</p>
                  <p className="text-sm text-amber-400">Total Value</p>
                </div>
              </div>

              {/* Kitchen Cards */}
              {kitchenLedgerData.kitchens.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No kitchen data found for the selected filters</p>
              ) : (
                <div className="space-y-4">
                  {kitchenLedgerData.kitchens.map(kitchen => (
                    <div key={kitchen.kitchen_id} className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden" data-testid={`kitchen-card-${kitchen.kitchen_id}`}>
                      {/* Kitchen Header */}
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50"
                        onClick={() => toggleKitchenExpand(kitchen.kitchen_id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center">
                            <Store className="w-6 h-6 text-orange-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{kitchen.kitchen_name}</h3>
                            {kitchen.kitchen_address && (
                              <p className="text-sm text-slate-400">{kitchen.kitchen_address}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden md:block">
                            <p className="text-sm text-slate-400">
                              Req: {kitchen.requisition_count || 0} | Dispatch: {kitchen.issued_count || kitchen.dispatch_count || 0}
                            </p>
                            <p className="text-lg font-semibold text-emerald-400">
                              ₹{(kitchen.total_issued_value || kitchen.total_value || 0).toLocaleString()}
                            </p>
                          </div>
                          {expandedKitchens[kitchen.kitchen_id] ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Mobile Summary */}
                      <div className="px-4 pb-2 md:hidden">
                        <p className="text-sm text-slate-400">
                          {kitchen.issued_count || kitchen.dispatch_count || 0} dispatches • 
                          <span className="text-emerald-400">₹{(kitchen.total_issued_value || kitchen.total_value || 0).toLocaleString()}</span>
                        </p>
                      </div>

                      {/* Expanded Details */}
                      {expandedKitchens[kitchen.kitchen_id] && (
                        <div className="border-t border-slate-800 p-4 space-y-4">
                          {/* Category-wise Summary */}
                          {(kitchen.categories || []).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-orange-400 mb-3">Category-wise Breakdown</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {kitchen.categories.map(cat => (
                                  <div key={cat.category} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <p className="text-xs text-slate-400 truncate">{cat.category}</p>
                                    <p className="text-lg font-semibold text-white">{cat.total_quantity.toLocaleString()}</p>
                                    <p className="text-sm text-emerald-400">₹{cat.total_value.toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Detailed Dispatch Entries */}
                          {(kitchen.dispatch_entries || []).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-blue-400 mb-2">Dispatch Details ({kitchen.issued_count || kitchen.dispatch_count || 0})</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-800/50">
                                    <tr>
                                      <th className="text-left p-2 text-slate-400">Date</th>
                                      <th className="text-left p-2 text-slate-400">Item</th>
                                      <th className="text-left p-2 text-slate-400">Category</th>
                                      <th className="text-right p-2 text-slate-400">Qty</th>
                                      <th className="text-right p-2 text-slate-400">Rate</th>
                                      <th className="text-right p-2 text-slate-400">Value</th>
                                      <th className="text-left p-2 text-slate-400">Challan</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {kitchen.dispatch_entries.map((entry, idx) => (
                                      <tr key={idx} className="border-t border-slate-800">
                                        <td className="p-2 text-slate-400">{entry.date}</td>
                                        <td className="p-2 text-white">{entry.item_name}</td>
                                        <td className="p-2 text-slate-400">{entry.category}</td>
                                        <td className="p-2 text-right text-slate-300">{entry.quantity} {entry.unit}</td>
                                        <td className="p-2 text-right text-slate-300">₹{entry.rate}</td>
                                        <td className="p-2 text-right text-white">₹{entry.value.toLocaleString()}</td>
                                        <td className="p-2 text-slate-400 font-mono text-xs">{entry.challan_number || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-slate-800/30">
                                    <tr>
                                      <td colSpan="5" className="p-2 text-right text-slate-400 font-medium">Total:</td>
                                      <td className="p-2 text-right text-emerald-400 font-bold">₹{(kitchen.total_issued_value || 0).toLocaleString()}</td>
                                      <td></td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}

                          {(kitchen.dispatch_entries || []).length === 0 && (
                            <p className="text-slate-500 text-center py-4">No dispatches found for this kitchen</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ============ DAYWISE REPORTS ============ */}
        <TabsContent value="daywise-reports" className="space-y-4" data-testid="daywise-reports-content">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Daywise GRN Reports</h2>
            <p className="text-slate-400 mb-6">Download daywise summary reports for kitchen receiving and main store inputs.</p>
            
            {/* Date Selector */}
            <div className="mb-6">
              <Label className="text-slate-300 mb-2 block">Select Date</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="bg-slate-800 border-slate-700 max-w-xs"
                data-testid="daywise-date-picker"
              />
            </div>
            
            {/* Report Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Kitchen GRN Summary */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-900/30 to-cyan-800/10 border border-cyan-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-cyan-600/20 rounded-lg">
                    <Store className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-semibold">Kitchen GRN Summary</h3>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  Daywise receiving summary for all kitchens. Shows amounts by category split into Main Store dispatches and Daily Perishables.
                </p>
                <ul className="text-slate-400 text-xs mb-4 space-y-1">
                  <li>• Kitchens as rows</li>
                  <li>• Main Store categories: Grocery, Beverage, Dairy, Seafood, Packaging</li>
                  <li>• Daily Perishables: Vegetables, Non Veg, Noodles, Dairy</li>
                </ul>
                <Button 
                  onClick={downloadDaywiseKitchenGRN}
                  disabled={downloading || !filters.start_date}
                  className="w-full bg-cyan-600 hover:bg-cyan-500"
                  data-testid="download-kitchen-grn-btn"
                >
                  {downloading ? (
                    <span className="animate-spin mr-2">⟳</span>
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  )}
                  Download Kitchen GRN Excel
                </Button>
              </div>
              
              {/* Main Store Input Summary */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-600/20 rounded-lg">
                    <Building2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold">Main Store Input Summary</h3>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  Daywise GRN (goods received) summary for Main Store. Shows vendor-wise material amounts by category.
                </p>
                <ul className="text-slate-400 text-xs mb-4 space-y-1">
                  <li>• Vendors as rows</li>
                  <li>• All categories as columns</li>
                  <li>• Total amounts per vendor and category</li>
                </ul>
                <Button 
                  onClick={downloadDaywiseMainStoreInput}
                  disabled={downloading || !filters.start_date}
                  className="w-full bg-emerald-600 hover:bg-emerald-500"
                  data-testid="download-mainstore-input-btn"
                >
                  {downloading ? (
                    <span className="animate-spin mr-2">⟳</span>
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  )}
                  Download Main Store Input Excel
                </Button>
              </div>
            </div>
            
            {!filters.start_date && (
              <p className="text-amber-400 text-sm mt-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Please select a date to download reports
              </p>
            )}
          </div>
        </TabsContent>

        {/* ============ MAIN STORE STOCK ============ */}
        <TabsContent value="mainstore-stock" className="space-y-4" data-testid="mainstore-stock-content">
          {/* Header with refresh */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Stock in Hand - Main Store</h2>
                <p className="text-slate-400 text-sm">Category-wise stock summary at Main Store location</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadReport} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500" data-testid="refresh-mainstore-stock">
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
                <Button 
                  onClick={downloadMainStoreStock} 
                  disabled={downloading} 
                  variant="outline"
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                  data-testid="download-mainstore-stock-btn"
                  title="Download Stock Excel with item details"
                >
                  {downloading ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      Excel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Store Stock Results */}
          {mainStoreStockData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30">
                  <p className="text-2xl font-bold text-white">{mainStoreStockData.categories?.length || 0}</p>
                  <p className="text-sm text-emerald-400">Categories</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                  <p className="text-2xl font-bold text-white">{mainStoreStockData.summary?.total_items || 0}</p>
                  <p className="text-sm text-blue-400">Total Items</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-white">₹{(mainStoreStockData.summary?.total_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-amber-400">Total Value</p>
                </div>
                <div className={`p-4 rounded-xl ${mainStoreStockData.summary?.items_without_price > 0 ? 'bg-red-600/10 border border-red-500/30' : 'bg-slate-600/10 border border-slate-500/30'}`}>
                  <p className={`text-2xl font-bold ${mainStoreStockData.summary?.items_without_price > 0 ? 'text-red-400' : 'text-white'}`}>
                    {mainStoreStockData.summary?.items_without_price || 0}
                  </p>
                  <p className={`text-sm ${mainStoreStockData.summary?.items_without_price > 0 ? 'text-red-400' : 'text-slate-400'}`}>Items w/o Price</p>
                </div>
              </div>

              {/* Category Table */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left p-3 text-sm text-slate-400">#</th>
                        <th className="text-left p-3 text-sm text-slate-400">Category</th>
                        <th className="text-right p-3 text-sm text-slate-400">Items</th>
                        <th className="text-right p-3 text-sm text-slate-400">Total Qty</th>
                        <th className="text-right p-3 text-sm text-slate-400">Value (₹)</th>
                        <th className="text-right p-3 text-sm text-slate-400">No Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(mainStoreStockData.categories || []).map((cat, idx) => (
                        <tr key={cat.category} className="border-t border-slate-800 hover:bg-slate-800/30">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 text-white font-medium">{cat.category}</td>
                          <td className="p-3 text-right text-slate-300">{cat.item_count}</td>
                          <td className="p-3 text-right text-slate-300">{cat.total_quantity.toLocaleString()}</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">₹{cat.total_value.toLocaleString()}</td>
                          <td className={`p-3 text-right ${cat.items_without_price > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                            {cat.items_without_price || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-800/30">
                      <tr>
                        <td colSpan="2" className="p-3 text-right text-slate-400 font-medium">Grand Total:</td>
                        <td className="p-3 text-right text-white font-bold">{mainStoreStockData.summary?.total_items || 0}</td>
                        <td className="p-3 text-right text-slate-400">-</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">₹{(mainStoreStockData.summary?.total_value || 0).toLocaleString()}</td>
                        <td className="p-3 text-right text-red-400 font-bold">{mainStoreStockData.summary?.items_without_price || 0}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {(mainStoreStockData.categories || []).length === 0 && (
                <p className="text-slate-400 text-center py-8">No stock found at Main Store</p>
              )}
            </div>
          )}

          {!mainStoreStockData && !loading && (
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-8 text-center">
              <Warehouse className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Click Refresh to load Main Store stock data</p>
            </div>
          )}
        </TabsContent>

        {/* ============ DAILY PERISHABLES VENDOR LEDGER ============ */}
        <TabsContent value="perishable-vendor" className="space-y-4" data-testid="perishable-vendor-content">
          {/* Filters */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Vendor</Label>
                <Select value={filters.vendor_id} onValueChange={(value) => setFilters({...filters, vendor_id: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="perishable-vendor-select">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Kitchen/Outlet</Label>
                <Select value={filters.kitchen_id} onValueChange={(value) => setFilters({...filters, kitchen_id: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="perishable-kitchen-select">
                    <SelectValue placeholder="All Kitchens" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Kitchens</SelectItem>
                    {kitchens.map(kitchen => (
                      <SelectItem key={kitchen.id} value={kitchen.id}>{kitchen.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Start Date</Label>
                <Input 
                  type="date" 
                  value={filters.start_date}
                  onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  data-testid="perishable-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">End Date</Label>
                <Input 
                  type="date" 
                  value={filters.end_date}
                  onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  data-testid="perishable-end-date"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={loadReport} 
                  disabled={loading}
                  className="bg-rose-600 hover:bg-rose-500 flex-1"
                  data-testid="perishable-refresh-btn"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      setDownloading(true);
                      const params = new URLSearchParams();
                      if (filters.vendor_id !== 'all') params.append('vendor_id', filters.vendor_id);
                      if (filters.kitchen_id !== 'all') params.append('kitchen_id', filters.kitchen_id);
                      if (filters.start_date) params.append('start_date', filters.start_date);
                      if (filters.end_date) params.append('end_date', filters.end_date);
                      
                      const response = await api.get(`/api/export/daily-perishables-vendor-ledger?${params.toString()}`, {
                        responseType: 'blob'
                      });
                      
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `Daily_Perishables_Vendor_Ledger.xlsx`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (error) {
                      console.error('Error downloading:', error);
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  disabled={downloading}
                  variant="outline"
                  className="border-rose-500 text-rose-400 hover:bg-rose-500/10"
                  data-testid="perishable-excel-btn"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {perishableVendorLedger ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-rose-600/10 border border-rose-500/30">
                  <p className="text-2xl font-bold text-white">{perishableVendorLedger.summary?.total_vendors || 0}</p>
                  <p className="text-sm text-rose-400">Vendors</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30 md:col-span-2">
                  <p className="text-2xl font-bold text-white">₹{(perishableVendorLedger.summary?.grand_total || 0).toLocaleString()}</p>
                  <p className="text-sm text-amber-400">Total Amount Payable</p>
                </div>
              </div>

              {/* Vendor List */}
              <div className="space-y-4">
                {(perishableVendorLedger.vendors || []).map(vendor => (
                  <div key={vendor.vendor_id} className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    {/* Vendor Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-slate-800/30 flex items-center justify-between"
                      onClick={() => setExpandedPerishableVendors(prev => ({...prev, [vendor.vendor_id]: !prev[vendor.vendor_id]}))}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-600/20 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{vendor.vendor_name}</h3>
                          <p className="text-sm text-slate-400">{vendor.kitchens?.length || 0} kitchens • {vendor.total_items} entries</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-bold text-rose-400">₹{vendor.total_amount.toLocaleString()}</p>
                        {expandedPerishableVendors[vendor.vendor_id] ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Kitchen Details */}
                    {expandedPerishableVendors[vendor.vendor_id] && (
                      <div className="border-t border-slate-800">
                        {(vendor.kitchens || []).map(kitchen => (
                          <div key={kitchen.kitchen_id} className="border-b border-slate-800/50 last:border-b-0">
                            {/* Kitchen Header */}
                            <div 
                              className="p-3 px-6 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 flex items-center justify-between"
                              onClick={() => setExpandedPerishableKitchens(prev => ({
                                ...prev, 
                                [`${vendor.vendor_id}-${kitchen.kitchen_id}`]: !prev[`${vendor.vendor_id}-${kitchen.kitchen_id}`]
                              }))}
                            >
                              <div className="flex items-center gap-3">
                                <Store className="w-4 h-4 text-orange-400" />
                                <span className="text-white font-medium">{kitchen.kitchen_name}</span>
                                <span className="text-xs text-slate-500">({kitchen.item_count} items)</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-orange-400 font-semibold">₹{kitchen.total_amount.toLocaleString()}</span>
                                {expandedPerishableKitchens[`${vendor.vendor_id}-${kitchen.kitchen_id}`] ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {/* Item Details */}
                            {expandedPerishableKitchens[`${vendor.vendor_id}-${kitchen.kitchen_id}`] && (
                              <div className="px-6 py-3 bg-slate-900/30">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-slate-500 border-b border-slate-700">
                                      <th className="text-left py-2">Item</th>
                                      <th className="text-right py-2">Qty</th>
                                      <th className="text-right py-2">Avg Rate</th>
                                      <th className="text-right py-2">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(kitchen.items || []).map((item, idx) => (
                                      <tr key={idx} className="border-b border-slate-800/30 last:border-b-0">
                                        <td className="py-2 text-slate-300">{item.item_name}</td>
                                        <td className="py-2 text-right text-slate-400">{item.total_quantity} {item.unit}</td>
                                        <td className="py-2 text-right text-slate-400">₹{item.avg_rate}</td>
                                        <td className="py-2 text-right text-emerald-400 font-medium">₹{item.total_amount.toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Click Refresh to load Daily Perishables Vendor Ledger</p>
              <p className="text-sm text-slate-500 mt-1">Filter by vendor, kitchen, or date range</p>
            </div>
          )}
        </TabsContent>

        {/* ============ CONSUMPTION ANALYSIS ============ */}
        <TabsContent value="consumption" className="space-y-4" data-testid="consumption-content">
          {/* Info Banner */}
          <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-purple-300 font-medium">PAR Stock Analysis - Kitchen Requisitions</p>
                <p className="text-sm text-purple-400/70 mt-1">
                  Analyzes last 30 days of kitchen requisitions to calculate 10-day PAR stock for Main Store.
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Kitchen/Outlet</Label>
                <Select value={filters.kitchen_id} onValueChange={(value) => setFilters({...filters, kitchen_id: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="All Kitchens" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Kitchens</SelectItem>
                    {kitchens.map(kitchen => (
                      <SelectItem key={kitchen.id} value={kitchen.id}>{kitchen.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Category</Label>
                <Select value={filters.category || 'all'} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Indian Grocery">Indian Grocery</SelectItem>
                    <SelectItem value="Chinese Grocery">Chinese Grocery</SelectItem>
                    <SelectItem value="Vegetables">Vegetables</SelectItem>
                    <SelectItem value="Non Veg">Non Veg</SelectItem>
                    <SelectItem value="Dairy">Dairy</SelectItem>
                    <SelectItem value="Beverage">Beverage</SelectItem>
                    <SelectItem value="Packaging">Packaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 md:col-span-2">
                <Button 
                  onClick={loadReport} 
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-500 flex-1"
                  data-testid="consumption-refresh-btn"
                >
                  {loading ? 'Analyzing...' : 'Calculate PAR Stock'}
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      setDownloading(true);
                      const params = new URLSearchParams({ days_of_data: 30, par_stock_days: 10 });
                      if (filters.kitchen_id !== 'all') params.append('kitchen_id', filters.kitchen_id);
                      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
                      
                      const response = await api.get(`/api/export/consumption-analysis?${params.toString()}`, {
                        responseType: 'blob'
                      });
                      
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', 'PAR_Stock_Analysis_10days.xlsx');
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (error) {
                      console.error('Error downloading:', error);
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  disabled={downloading}
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  data-testid="consumption-excel-btn"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {consumptionAnalysis ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-purple-600/10 border border-purple-500/30">
                  <p className="text-2xl font-bold text-white">{consumptionAnalysis.analysis_period?.days_analyzed || 0}</p>
                  <p className="text-sm text-purple-400">Days Analyzed</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                  <p className="text-2xl font-bold text-white">{consumptionAnalysis.summary?.unique_items || 0}</p>
                  <p className="text-sm text-blue-400">Unique Items</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-white">{(consumptionAnalysis.summary?.daily_avg_qty || 0).toLocaleString()}</p>
                  <p className="text-sm text-amber-400">Daily Avg Qty</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30">
                  <p className="text-2xl font-bold text-white">{(consumptionAnalysis.summary?.par_stock_10_days_qty || 0).toLocaleString()}</p>
                  <p className="text-sm text-emerald-400">10-Day PAR Stock</p>
                </div>
              </div>

              {/* Category-wise Breakdown */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-400" />
                    Category-wise PAR Stock (Requisitions Only)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left p-3 text-sm text-slate-400">Category</th>
                        <th className="text-right p-3 text-sm text-slate-400">Items</th>
                        <th className="text-right p-3 text-sm text-slate-400">Total Qty</th>
                        <th className="text-right p-3 text-sm text-slate-400">Daily Avg Qty</th>
                        <th className="text-right p-3 text-sm text-slate-400">10-Day PAR Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(consumptionAnalysis.by_category || []).map((cat, idx) => (
                        <tr 
                          key={cat.category} 
                          className="border-t border-slate-800 hover:bg-slate-800/30 cursor-pointer"
                          onClick={() => setExpandedCategories(prev => ({...prev, [cat.category]: !prev[cat.category]}))}
                        >
                          <td className="p-3 text-white font-medium flex items-center gap-2">
                            {expandedCategories[cat.category] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {cat.category}
                          </td>
                          <td className="p-3 text-right text-slate-300">{cat.unique_items}</td>
                          <td className="p-3 text-right text-slate-300">{cat.total_quantity.toLocaleString()}</td>
                          <td className="p-3 text-right text-amber-400">{cat.daily_avg_qty.toLocaleString()}</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">{cat.par_stock_10_days_qty?.toLocaleString() || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-800/30">
                      <tr>
                        <td className="p-3 text-white font-bold">TOTAL</td>
                        <td className="p-3 text-right text-white font-bold">{consumptionAnalysis.summary?.unique_items}</td>
                        <td className="p-3 text-right text-white font-bold">{(consumptionAnalysis.summary?.total_quantity || 0).toLocaleString()}</td>
                        <td className="p-3 text-right text-amber-400 font-bold">{(consumptionAnalysis.summary?.daily_avg_qty || 0).toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">{(consumptionAnalysis.summary?.par_stock_10_days_qty || 0).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Top Items by Quantity */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    Top 20 Items by Quantity Requisitioned
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left p-3 text-slate-400">#</th>
                        <th className="text-left p-3 text-slate-400">Item</th>
                        <th className="text-left p-3 text-slate-400">Category</th>
                        <th className="text-left p-3 text-slate-400">Unit</th>
                        <th className="text-right p-3 text-slate-400">Total Qty</th>
                        <th className="text-right p-3 text-slate-400">Daily Avg</th>
                        <th className="text-right p-3 text-slate-400">10-Day PAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(consumptionAnalysis.by_item || []).slice(0, 20).map((item, idx) => (
                        <tr key={item.item_id || idx} className="border-t border-slate-800/50">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 text-white">{item.item_name}</td>
                          <td className="p-3 text-slate-400">{item.category}</td>
                          <td className="p-3 text-slate-400">{item.unit}</td>
                          <td className="p-3 text-right text-slate-300">{item.total_quantity}</td>
                          <td className="p-3 text-right text-amber-400">{item.daily_avg_qty}</td>
                          <td className="p-3 text-right text-emerald-400 font-medium">{item.par_stock_10_days_qty || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
              <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Click "Calculate PAR Stock" to generate the report</p>
              <p className="text-sm text-slate-500 mt-1">Based on 30 days of kitchen requisitions to Main Store</p>
            </div>
          )}
        </TabsContent>

        {/* ============ PO vs DP COMPARISON ============ */}
        <TabsContent value="po-dp-comparison" className="space-y-4" data-testid="po-dp-comparison-content">
          {/* Filters */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Vendor (Required)</Label>
                <Select 
                  value={filters.vendor_id} 
                  onValueChange={(val) => setFilters({ ...filters, vendor_id: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="po-dp-vendor-filter">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">Select a Vendor</SelectItem>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Start Date</Label>
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                  data-testid="po-dp-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">End Date</Label>
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                  data-testid="po-dp-end-date"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={async () => {
                    if (filters.vendor_id === 'all') {
                      alert('Please select a vendor');
                      return;
                    }
                    setLoading(true);
                    try {
                      const params = new URLSearchParams();
                      params.append('vendor_id', filters.vendor_id);
                      if (filters.start_date) params.append('start_date', filters.start_date);
                      if (filters.end_date) params.append('end_date', filters.end_date);
                      const response = await api.get(`/api/reports/po-vs-dp-comparison?${params.toString()}`);
                      setPoDpComparison(response.data);
                    } catch (error) {
                      console.error('Error:', error);
                      alert('Error generating report');
                    } finally {
                      setLoading(false);
                    }
                  }} 
                  disabled={loading || filters.vendor_id === 'all'} 
                  className="flex-1 bg-orange-600 hover:bg-orange-500" 
                  data-testid="generate-po-dp-comparison"
                >
                  {loading ? 'Loading...' : 'Compare PO vs DP'}
                </Button>
                <Button 
                  onClick={async () => {
                    if (filters.vendor_id === 'all') {
                      alert('Please select a vendor');
                      return;
                    }
                    setDownloading(true);
                    try {
                      const params = new URLSearchParams();
                      params.append('vendor_id', filters.vendor_id);
                      if (filters.start_date) params.append('start_date', filters.start_date);
                      if (filters.end_date) params.append('end_date', filters.end_date);
                      const response = await api.get(`/api/export/po-vs-dp-comparison?${params.toString()}`, {
                        responseType: 'blob'
                      });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `PO_vs_DP_Comparison_${filters.start_date || 'all'}_${filters.end_date || 'all'}.xlsx`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (error) {
                      console.error('Download error:', error);
                      alert('Error downloading file');
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  disabled={downloading || filters.vendor_id === 'all'}
                  variant="outline"
                  className="border-orange-600 text-orange-400 hover:bg-orange-600/20"
                  data-testid="download-po-dp-comparison"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {poDpComparison && poDpComparison.success ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                  <p className="text-2xl font-bold text-white">₹{(poDpComparison.summary?.total_po_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-blue-400">Total PO Value</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-white">₹{(poDpComparison.summary?.total_dp_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-amber-400">Total DP Value</p>
                </div>
                <div className="p-4 rounded-xl bg-red-600/10 border border-red-500/30">
                  <p className="text-2xl font-bold text-white">₹{(poDpComparison.summary?.total_short_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-red-400">Total Short Value</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-600/10 border border-slate-500/30">
                  <p className="text-2xl font-bold text-white">{poDpComparison.summary?.total_items || 0}</p>
                  <p className="text-sm text-slate-400">Total Items</p>
                </div>
              </div>

              {/* Status Summary */}
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full text-sm bg-red-600/20 text-red-400 border border-red-500/30">
                  🔴 Short: {poDpComparison.summary?.items_short || 0}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-yellow-600/20 text-yellow-400 border border-yellow-500/30">
                  🟡 Excess: {poDpComparison.summary?.items_excess || 0}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-green-600/20 text-green-400 border border-green-500/30">
                  🟢 Matched: {(poDpComparison.summary?.total_items || 0) - (poDpComparison.summary?.items_short || 0) - (poDpComparison.summary?.items_excess || 0) - (poDpComparison.summary?.items_not_delivered || 0) - (poDpComparison.summary?.items_extra_no_po || 0)}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-gray-600/20 text-gray-400 border border-gray-500/30">
                  ⚫ Not Delivered: {poDpComparison.summary?.items_not_delivered || 0}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  🟣 Extra (No PO): {poDpComparison.summary?.items_extra_no_po || 0}
                </span>
              </div>

              {/* Items Table */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-lg font-semibold text-white">{poDpComparison.vendor_name} - Item-wise Comparison</h3>
                  <p className="text-sm text-slate-400">{poDpComparison.date_range}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left p-3 text-slate-400">Item Name</th>
                        <th className="text-right p-3 text-slate-400">PO Qty</th>
                        <th className="text-right p-3 text-slate-400">DP Qty</th>
                        <th className="text-right p-3 text-slate-400">Short Qty</th>
                        <th className="text-right p-3 text-slate-400">PO Value</th>
                        <th className="text-right p-3 text-slate-400">DP Value</th>
                        <th className="text-right p-3 text-slate-400">Short Value</th>
                        <th className="text-center p-3 text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(poDpComparison.items || []).map((item, idx) => (
                        <tr key={idx} className={`border-t border-slate-800 ${
                          item.status === 'SHORT' ? 'bg-red-900/10' :
                          item.status === 'EXCESS' ? 'bg-yellow-900/10' :
                          item.status === 'NOT DELIVERED' ? 'bg-gray-900/10' :
                          item.status === 'EXTRA (No PO)' ? 'bg-purple-900/10' :
                          ''
                        }`}>
                          <td className="p-3 text-white">{item.item_name}</td>
                          <td className="p-3 text-right text-blue-400">{item.ordered_qty}</td>
                          <td className="p-3 text-right text-amber-400">{item.delivered_qty}</td>
                          <td className={`p-3 text-right font-medium ${item.short_qty > 0 ? 'text-red-400' : item.short_qty < 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                            {item.short_qty > 0 ? `+${item.short_qty}` : item.short_qty}
                          </td>
                          <td className="p-3 text-right text-slate-300">₹{(item.ordered_value || 0).toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-300">₹{(item.delivered_value || 0).toLocaleString()}</td>
                          <td className={`p-3 text-right font-medium ${item.short_value > 0 ? 'text-red-400' : item.short_value < 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                            ₹{Math.abs(item.short_value || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === 'SHORT' ? 'bg-red-600/20 text-red-400' :
                              item.status === 'EXCESS' ? 'bg-yellow-600/20 text-yellow-400' :
                              item.status === 'MATCHED' ? 'bg-green-600/20 text-green-400' :
                              item.status === 'NOT DELIVERED' ? 'bg-gray-600/20 text-gray-400' :
                              item.status === 'EXTRA (No PO)' ? 'bg-purple-600/20 text-purple-400' :
                              'bg-slate-600/20 text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a vendor and click "Compare PO vs DP" to see item-wise comparison</p>
              <p className="text-sm text-slate-500 mt-1">Identifies short deliveries, excess items, and mismatches</p>
            </div>
          )}
        </TabsContent>

        {/* ============ OUTLET-WISE ANALYSIS ============ */}
        <TabsContent value="outlet-wise" className="space-y-4" data-testid="outlet-wise-content">
          {/* Filters */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Vendor (Required)</Label>
                <Select 
                  value={filters.vendor_id} 
                  onValueChange={(val) => setFilters({ ...filters, vendor_id: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="outlet-vendor-filter">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">Select a Vendor</SelectItem>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Start Date</Label>
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                  data-testid="outlet-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">End Date</Label>
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                  data-testid="outlet-end-date"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={async () => {
                    if (filters.vendor_id === 'all') {
                      alert('Please select a vendor');
                      return;
                    }
                    setLoading(true);
                    try {
                      const params = new URLSearchParams();
                      params.append('vendor_id', filters.vendor_id);
                      if (filters.start_date) params.append('start_date', filters.start_date);
                      if (filters.end_date) params.append('end_date', filters.end_date);
                      const response = await api.get(`/api/reports/outlet-wise-po-dp?${params.toString()}`);
                      setOutletWiseComparison(response.data);
                    } catch (error) {
                      console.error('Error:', error);
                      alert('Error generating report');
                    } finally {
                      setLoading(false);
                    }
                  }} 
                  disabled={loading || filters.vendor_id === 'all'} 
                  className="flex-1 bg-pink-600 hover:bg-pink-500" 
                  data-testid="generate-outlet-analysis"
                >
                  {loading ? 'Loading...' : 'Analyze Outlets'}
                </Button>
                <Button 
                  onClick={async () => {
                    if (filters.vendor_id === 'all') {
                      alert('Please select a vendor');
                      return;
                    }
                    setDownloading(true);
                    try {
                      const params = new URLSearchParams();
                      params.append('vendor_id', filters.vendor_id);
                      if (filters.start_date) params.append('start_date', filters.start_date);
                      if (filters.end_date) params.append('end_date', filters.end_date);
                      const response = await api.get(`/api/export/outlet-wise-po-dp?${params.toString()}`, {
                        responseType: 'blob'
                      });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `Outlet_Analysis_${filters.start_date || 'all'}_${filters.end_date || 'all'}.xlsx`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch (error) {
                      console.error('Download error:', error);
                      alert('Error downloading file');
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  disabled={downloading || filters.vendor_id === 'all'}
                  variant="outline"
                  className="border-pink-600 text-pink-400 hover:bg-pink-600/20"
                  data-testid="download-outlet-analysis"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {outletWiseComparison && outletWiseComparison.success ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-slate-600/10 border border-slate-500/30">
                  <p className="text-2xl font-bold text-white">{outletWiseComparison.summary?.total_outlets || 0}</p>
                  <p className="text-sm text-slate-400">Total Outlets</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                  <p className="text-2xl font-bold text-white">₹{(outletWiseComparison.summary?.total_po_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-blue-400">Total PO Value</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-white">₹{(outletWiseComparison.summary?.total_dp_value || 0).toLocaleString()}</p>
                  <p className="text-sm text-amber-400">Total DP Value</p>
                </div>
                <div className="p-4 rounded-xl bg-red-600/10 border border-red-500/30">
                  <p className="text-2xl font-bold text-white">{outletWiseComparison.summary?.outlets_without_po || 0}</p>
                  <p className="text-sm text-red-400">Outlets Without PO</p>
                </div>
                <div className="p-4 rounded-xl bg-green-600/10 border border-green-500/30">
                  <p className="text-2xl font-bold text-white">{outletWiseComparison.summary?.outlets_with_grn || 0}</p>
                  <p className="text-sm text-green-400">Outlets With GRN</p>
                </div>
              </div>

              {/* Outlet Cards */}
              <div className="space-y-3">
                {(outletWiseComparison.outlets || []).map((outlet, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    {/* Outlet Header */}
                    <div 
                      className={`p-4 cursor-pointer ${
                        outlet.outlet_status === 'RECEIVING WITHOUT PO' ? 'bg-red-900/20' :
                        outlet.outlet_status === 'EXCESS DELIVERY' ? 'bg-yellow-900/20' :
                        outlet.outlet_status === 'SHORT DELIVERY' ? 'bg-orange-900/20' :
                        'bg-slate-800/30'
                      }`}
                      onClick={() => setExpandedOutlets(prev => ({...prev, [outlet.location_id]: !prev[outlet.location_id]}))}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <MapPin className={`w-5 h-5 ${
                            outlet.outlet_status === 'RECEIVING WITHOUT PO' ? 'text-red-400' :
                            outlet.outlet_status === 'EXCESS DELIVERY' ? 'text-yellow-400' :
                            outlet.outlet_status === 'SHORT DELIVERY' ? 'text-orange-400' :
                            'text-green-400'
                          }`} />
                          <div>
                            <h3 className="text-white font-medium">{outlet.location_name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              outlet.outlet_status === 'RECEIVING WITHOUT PO' ? 'bg-red-600/20 text-red-400' :
                              outlet.outlet_status === 'EXCESS DELIVERY' ? 'bg-yellow-600/20 text-yellow-400' :
                              outlet.outlet_status === 'SHORT DELIVERY' ? 'bg-orange-600/20 text-orange-400' :
                              'bg-green-600/20 text-green-400'
                            }`}>
                              {outlet.outlet_status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden md:block">
                            <div className="flex gap-4">
                              <div>
                                <p className="text-xs text-slate-500">PO ({outlet.po_count})</p>
                                <p className="text-sm font-medium text-blue-400">₹{(outlet.total_po_value || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">DP ({outlet.dp_entries})</p>
                                <p className="text-sm font-medium text-amber-400">₹{(outlet.total_dp_value || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">GRN</p>
                                <p className={`text-sm font-medium ${outlet.has_grn ? 'text-green-400' : 'text-red-400'}`}>
                                  {outlet.has_grn ? `✓ ${outlet.grn_count}` : '✗ None'}
                                </p>
                              </div>
                            </div>
                          </div>
                          {expandedOutlets[outlet.location_id] ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                      {/* Mobile summary */}
                      <div className="mt-2 md:hidden flex gap-4 text-xs">
                        <span className="text-blue-400">PO: ₹{(outlet.total_po_value || 0).toLocaleString()}</span>
                        <span className="text-amber-400">DP: ₹{(outlet.total_dp_value || 0).toLocaleString()}</span>
                        <span className={outlet.has_grn ? 'text-green-400' : 'text-red-400'}>
                          GRN: {outlet.has_grn ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>

                    {/* Outlet Items (expanded) */}
                    {expandedOutlets[outlet.location_id] && (
                      <div className="p-4 border-t border-slate-800">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-800/50">
                              <tr>
                                <th className="text-left p-2 text-slate-400">Item</th>
                                <th className="text-right p-2 text-slate-400">PO Qty</th>
                                <th className="text-right p-2 text-slate-400">DP Qty</th>
                                <th className="text-right p-2 text-slate-400">Diff</th>
                                <th className="text-right p-2 text-slate-400">PO Value</th>
                                <th className="text-right p-2 text-slate-400">DP Value</th>
                                <th className="text-center p-2 text-slate-400">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(outlet.items || []).map((item, iIdx) => (
                                <tr key={iIdx} className={`border-t border-slate-800 ${
                                  item.status === 'NO PO' ? 'bg-red-900/10' :
                                  item.status === 'SHORT' ? 'bg-orange-900/10' :
                                  item.status === 'EXCESS' ? 'bg-yellow-900/10' :
                                  item.status === 'NOT DELIVERED' ? 'bg-gray-900/10' :
                                  ''
                                }`}>
                                  <td className="p-2 text-white">{item.item_name}</td>
                                  <td className="p-2 text-right text-blue-400">{item.ordered_qty}</td>
                                  <td className="p-2 text-right text-amber-400">{item.delivered_qty}</td>
                                  <td className={`p-2 text-right ${item.short_qty > 0 ? 'text-orange-400' : item.short_qty < 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                    {item.short_qty !== 0 ? (item.short_qty > 0 ? '+' : '') + item.short_qty : '-'}
                                  </td>
                                  <td className="p-2 text-right text-slate-300">₹{(item.ordered_value || 0).toLocaleString()}</td>
                                  <td className="p-2 text-right text-slate-300">₹{(item.delivered_value || 0).toLocaleString()}</td>
                                  <td className="p-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                                      item.status === 'NO PO' ? 'bg-red-600/20 text-red-400' :
                                      item.status === 'SHORT' ? 'bg-orange-600/20 text-orange-400' :
                                      item.status === 'EXCESS' ? 'bg-yellow-600/20 text-yellow-400' :
                                      item.status === 'NOT DELIVERED' ? 'bg-gray-600/20 text-gray-400' :
                                      'bg-green-600/20 text-green-400'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
              <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a vendor and click "Analyze Outlets" to see outlet-wise comparison</p>
              <p className="text-sm text-slate-500 mt-1">Shows which outlets are receiving without PO, quantities per outlet, and GRN status</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Photo Dialog for viewing GRN verification photos */}
      <Dialog open={!!showPhotoDialog} onOpenChange={() => setShowPhotoDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-4xl max-h-[95vh] overflow-y-auto p-2">
          <DialogHeader className="p-4">
            <DialogTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              GRN Verification - {showPhotoDialog?.po_number}
            </DialogTitle>
          </DialogHeader>
          
          {showPhotoDialog && (
            <div className="space-y-4 p-4">
              {/* Large Photo */}
              {showPhotoDialog.photo && (
                <img 
                  src={showPhotoDialog.photo} 
                  alt="GRN Verification" 
                  className="w-full rounded-lg border border-slate-700"
                />
              )}
              
              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Date & Time</p>
                    <p className="text-white">
                      {showPhotoDialog.capture_time 
                        ? new Date(showPhotoDialog.capture_time).toLocaleString()
                        : 'Not recorded'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-slate-400 text-sm">GPS Location</p>
                    <p className="text-white text-sm">
                      {showPhotoDialog.gps_location
                        ? `${showPhotoDialog.gps_location.latitude?.toFixed(6)}, ${showPhotoDialog.gps_location.longitude?.toFixed(6)}`
                        : 'Not recorded'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="text-slate-400 text-sm">PO Number</p>
                    <p className="text-white">{showPhotoDialog.po_number || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Google Maps Link */}
              {showPhotoDialog.gps_location && showPhotoDialog.gps_location.latitude && (
                <a 
                  href={`https://www.google.com/maps?q=${showPhotoDialog.gps_location.latitude},${showPhotoDialog.gps_location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  View Location on Google Maps
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
