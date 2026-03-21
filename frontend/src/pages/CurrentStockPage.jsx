import { useState, useEffect, useRef } from 'react';
import { Package, AlertTriangle, Check, Search, Edit2, X, TrendingDown, Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// Category color helper
function getCategoryColor(category) {
  const colors = {
    'Beverage': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Indian Grocery': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Chinese Grocery': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Continental Grocery': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Continental grocery': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Housekeeping': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'Dairy': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Seafood': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    'Packaging': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Non Veg': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'Vegetables': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Mala Grocery': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'MALA GROCERY': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'Fruits': 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  };
  return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

export default function CurrentStockPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [stockData, setStockData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showEditDialog, setShowEditDialog] = useState(null);
  const [editParStock, setEditParStock] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Opening Stock Upload state
  const [activeTab, setActiveTab] = useState('stock');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);
  
  // PAR Stock Update state
  const [updatingParStock, setUpdatingParStock] = useState(false);
  const [parStockResult, setParStockResult] = useState(null);
  const [showParStockDialog, setShowParStockDialog] = useState(false);
  const [parStockDates, setParStockDates] = useState({
    start_date: '2026-03-01',
    end_date: '2026-03-08',
    par_days: 10
  });
  
  // Stock Adjustment state (February feature - Admin only)
  const [showAdjustDialog, setShowAdjustDialog] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('Physical stock count adjustment');
  const [adjusting, setAdjusting] = useState(false);

  // Update PAR Stock from Consumption
  const updateParStockFromConsumption = async (dryRun = true) => {
    try {
      setUpdatingParStock(true);
      const params = new URLSearchParams({
        start_date: parStockDates.start_date,
        end_date: parStockDates.end_date,
        par_days: parStockDates.par_days,
        dry_run: dryRun
      });
      
      const response = await api.post(`/api/admin/update-par-stock-from-consumption?${params.toString()}`);
      setParStockResult(response.data);
      
      if (!dryRun) {
        // Refresh stock data after update
        fetchData();
      }
    } catch (error) {
      console.error('Error updating PAR stock:', error);
      alert('Error updating PAR stock: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUpdatingParStock(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockRes, catsRes] = await Promise.all([
        api.get('/api/stock/current?include_perishables=true'),
        api.get('/api/categories')
      ]);
      setStockData(stockRes.data);
      setCategories(catsRes.data.map(c => c.name));
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      setExporting(true);
      const response = await api.get('/api/export/current-stock', {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with date
      const today = new Date().toISOString().split('T')[0];
      link.download = `Current_Stock_${today}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting stock:', error);
      alert('Error exporting stock data');
    } finally {
      setExporting(false);
    }
  };

  const filteredStock = stockData.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.item_name.toLowerCase().includes(query)) return false;
    }
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  const belowParItems = stockData.filter(item => item.status === 'below_par');
  const okItems = stockData.filter(item => item.status === 'ok');

  const openEditDialog = (item) => {
    setShowEditDialog(item);
    setEditParStock(item.par_stock?.toString() || '');
  };

  const handleSaveParStock = async () => {
    if (!showEditDialog) return;
    
    try {
      setSaving(true);
      await api.put(`/api/items/${showEditDialog.item_id}/par-stock`, null, {
        params: { par_stock: parseFloat(editParStock) || 0 }
      });
      setShowEditDialog(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating par stock:', error);
      alert('Error updating par stock');
    } finally {
      setSaving(false);
    }
  };

  // Stock Adjustment functions (February feature)
  const openAdjustDialog = (item) => {
    setShowAdjustDialog(item);
    setAdjustQuantity(item.current_stock?.toString() || '0');
    setAdjustReason('Physical stock count adjustment');
  };

  const handleAdjustStock = async () => {
    if (!showAdjustDialog) return;
    
    const newQty = parseFloat(adjustQuantity);
    if (isNaN(newQty) || newQty < 0) {
      alert('Please enter a valid quantity (0 or more)');
      return;
    }
    
    try {
      setAdjusting(true);
      const response = await api.post('/api/stock/adjust', {
        item_id: showAdjustDialog.item_id,
        new_quantity: newQty,
        reason: adjustReason || 'Physical stock count adjustment'
      });
      
      alert(`Stock adjusted successfully!\n\nPrevious: ${response.data.previous_stock}\nNew: ${response.data.new_stock}\nAdjustment: ${response.data.adjustment > 0 ? '+' : ''}${response.data.adjustment}`);
      setShowAdjustDialog(null);
      await fetchData();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock: ' + (error.response?.data?.detail || error.message));
    } finally {
      setAdjusting(false);
    }
  };

  // Opening Stock Upload functions
  const downloadOpeningStockTemplate = async () => {
    try {
      const response = await api.get('/api/stock/opening/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'opening_stock_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error downloading template');
    }
  };

  const handleOpeningStockUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setUploading(true);
      setUploadResult(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/stock/opening/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadResult(response.data);
      await fetchData();
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadResult({
        message: 'Upload failed',
        created: 0,
        skipped: 0,
        errors: [error.response?.data?.detail || 'Error uploading file'],
        total_errors: 1
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Export Stock Movement (IN/OUT Ledger Report)
  const exportStockMovement = async () => {
    try {
      // Default to last 7 days for ledger report
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      const startDate = new Date(today.setDate(today.getDate() - 6)).toISOString().split('T')[0];
      
      const response = await api.get(`/api/export/stock-movement?start_date=${startDate}&end_date=${endDate}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Stock_Ledger_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting stock ledger:', error);
      alert('Error exporting stock ledger');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="current-stock-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-cyan-400" />
            Current Stock
          </h1>
          <p className="text-slate-400 mt-1">View stock levels and upload opening stock</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab(activeTab === 'stock' ? 'upload' : 'stock')}
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            className={activeTab === 'upload' ? 'bg-cyan-600 hover:bg-cyan-500' : 'border-slate-700'}
            data-testid="toggle-upload-tab-btn"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Opening Stock
          </Button>
          {activeTab === 'stock' && (
            <>
              <Button
                onClick={exportStockMovement}
                variant="outline"
                className="border-slate-700 hover:bg-slate-800"
                data-testid="export-ledger-btn"
              >
                <FileText className="w-5 h-5 mr-2" />
                Stock Ledger (7 Days)
              </Button>
              <Button
                onClick={exportToExcel}
                disabled={exporting || stockData.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500"
                data-testid="export-stock-btn"
              >
                <Download className="w-5 h-5 mr-2" />
                {exporting ? 'Exporting...' : 'Export to Excel'}
              </Button>
              <Button
                onClick={() => setShowParStockDialog(true)}
                className="bg-purple-600 hover:bg-purple-500"
                data-testid="update-par-stock-btn"
              >
                <TrendingDown className="w-5 h-5 mr-2" />
                Update PAR Stock
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Upload Opening Stock Section */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              Upload Opening Stock
            </h2>
            <p className="text-slate-400 mb-4">
              Upload an Excel file with your existing stock that was present before using this app. 
              This will create stock entries (lots) in the Main Store.
            </p>
            
            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-white mb-2">Instructions:</h3>
              <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                <li>Item names must match <strong className="text-white">exactly</strong> with items in the Items Master</li>
                <li>If an item doesn't exist, add it first via the Items page</li>
                <li>Quantity is required for each item</li>
                <li>Expiry date is optional (defaults to 1 year from now)</li>
                <li>Stock will be added to the Main Store location</li>
              </ul>
            </div>

            {/* Download Template & Upload */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={downloadOpeningStockTemplate}
                variant="outline"
                className="border-slate-700 hover:bg-slate-800"
                data-testid="download-opening-stock-template-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleOpeningStockUpload}
                  className="hidden"
                  id="opening-stock-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500"
                  data-testid="upload-opening-stock-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Excel File'}
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Results */}
          {uploadResult && (
            <div className={`rounded-xl border p-6 ${
              uploadResult.created > 0 
                ? 'bg-emerald-600/10 border-emerald-500/30' 
                : 'bg-red-600/10 border-red-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {uploadResult.created > 0 ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">{uploadResult.message}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-emerald-400">{uploadResult.created}</p>
                      <p className="text-sm text-slate-400">Items Created</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-amber-400">{uploadResult.skipped}</p>
                      <p className="text-sm text-slate-400">Items Skipped</p>
                    </div>
                  </div>

                  {/* Created Items */}
                  {uploadResult.created_items?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-emerald-400 mb-2">Created Stock:</h4>
                      <div className="bg-slate-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {uploadResult.created_items.map((item, idx) => (
                          <div key={idx} className="text-sm text-slate-300 py-1 border-b border-slate-700 last:border-0">
                            {item.item_name}: <span className="text-emerald-400">{item.quantity}</span> units
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {uploadResult.errors?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-2">
                        Errors ({uploadResult.total_errors}):
                      </h4>
                      <div className="bg-slate-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {uploadResult.errors.map((error, idx) => (
                          <p key={idx} className="text-sm text-red-300 py-1">{error}</p>
                        ))}
                        {uploadResult.total_errors > uploadResult.errors.length && (
                          <p className="text-sm text-slate-500 mt-2">
                            ...and {uploadResult.total_errors - uploadResult.errors.length} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadResult(null)}
                  className="border-slate-700"
                >
                  <X className="w-4 h-4 mr-1" /> Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Stock View */}
      {activeTab === 'stock' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <Package className="w-6 h-6 text-slate-400 mb-2" />
              <p className="text-2xl font-bold text-white">{stockData.length}</p>
              <p className="text-sm text-slate-400">Total Items</p>
            </div>
            <div className="p-4 rounded-xl bg-cyan-600/10 border border-cyan-500/30">
              <Download className="w-6 h-6 text-cyan-400 mb-2" />
              <p className="text-2xl font-bold text-cyan-400">
                {stockData.filter(i => i.todays_grn > 0).length}
              </p>
              <p className="text-sm text-cyan-400">Today's GRN Items</p>
            </div>
        <div className="p-4 rounded-xl bg-red-600/10 border border-red-500/30">
          <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-red-400">{belowParItems.length}</p>
          <p className="text-sm text-red-400">Below Par Stock</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30">
          <Check className="w-6 h-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{okItems.length}</p>
          <p className="text-sm text-emerald-400">Stock OK</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="pl-10 bg-slate-800 border-slate-700"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stock Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-600">
            All ({filteredStock.length})
          </TabsTrigger>
          <TabsTrigger value="below_par" className="data-[state=active]:bg-red-600">
            Below Par ({belowParItems.length})
          </TabsTrigger>
          <TabsTrigger value="ok" className="data-[state=active]:bg-emerald-600">
            Stock OK ({okItems.length})
          </TabsTrigger>
        </TabsList>

        {['all', 'below_par', 'ok'].map((tab) => {
          let items = filteredStock;
          if (tab === 'below_par') items = filteredStock.filter(i => i.status === 'below_par');
          if (tab === 'ok') items = filteredStock.filter(i => i.status === 'ok');
          
          return (
            <TabsContent key={tab} value={tab} className="space-y-2">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-slate-400 uppercase">
                <div className="col-span-3">Item</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1 text-right">Current</div>
                <div className="col-span-1 text-right">Today GRN</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-2 text-right">Par Stock</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              {items.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No items found</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.item_id}
                    className={`p-4 rounded-xl border ${
                      item.status === 'below_par' 
                        ? 'bg-red-600/5 border-red-500/30' 
                        : 'bg-slate-900/50 border-slate-800'
                    }`}
                  >
                    {/* Mobile View */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{item.item_name}</span>
                        {item.status === 'below_par' ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            Below Par
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                            OK
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Total: </span>
                          <span className={`font-semibold ${item.status === 'below_par' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {item.current_stock} {item.unit}
                          </span>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAdjustDialog(item)}
                              className="text-amber-400 hover:text-amber-300 p-0 h-5 w-5"
                              title="Edit Stock (Admin)"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Par: </span>
                          <span className="text-white">{item.par_stock || '-'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            className="text-slate-400 hover:text-white p-0 h-5 w-5"
                            title="Edit Par Stock"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {item.status === 'below_par' && item.shortage > 0 && (
                        <p className="text-xs text-red-400">
                          Shortage: {item.shortage} {item.unit}
                        </p>
                      )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <span className="font-medium text-white">{item.item_name}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-slate-300">
                          {item.current_stock - (item.todays_grn || 0)}
                        </span>
                        <span className="text-slate-500 text-xs ml-1">{item.unit}</span>
                      </div>
                      <div className="col-span-1 text-right">
                        {item.todays_grn > 0 ? (
                          <span className="font-semibold text-emerald-400">+{item.todays_grn}</span>
                        ) : (
                          <span className="text-slate-500">NIL</span>
                        )}
                      </div>
                      <div className="col-span-1 text-right flex items-center justify-end gap-1">
                        <span className={`font-semibold ${item.status === 'below_par' ? 'text-red-400' : 'text-cyan-400'}`}>
                          {item.current_stock}
                        </span>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAdjustDialog(item)}
                            className="text-amber-400 hover:text-amber-300 p-1 h-6 w-6"
                            title="Edit Stock (Admin)"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="col-span-2 text-right flex items-center justify-end gap-2">
                        <span className="text-white">{item.par_stock || '-'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          className="text-slate-400 hover:text-white p-1 h-6 w-6"
                          title="Edit Par Stock"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="col-span-2 text-right">
                        {item.status === 'below_par' ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 flex items-center gap-1 justify-end">
                            <TrendingDown className="w-3 h-3" />
                            -{item.shortage}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                            OK
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
        </>
      )}

      {/* Edit Par Stock Dialog */}
      <Dialog open={!!showEditDialog} onOpenChange={() => setShowEditDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-cyan-400" />
              Edit Par Stock
            </DialogTitle>
          </DialogHeader>

          {showEditDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-800/50">
                <p className="font-medium text-white">{showEditDialog.item_name}</p>
                <p className="text-sm text-slate-400">
                  Current Stock: {showEditDialog.current_stock} {showEditDialog.unit}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Par Stock (Minimum Level)</Label>
                <Input
                  type="number"
                  step="1"
                  value={editParStock}
                  onChange={(e) => setEditParStock(e.target.value)}
                  placeholder="Enter par stock quantity"
                  className="bg-slate-800 border-slate-700"
                />
                <p className="text-xs text-slate-500">
                  Alert will trigger when stock falls below this level
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(null)}
                  className="flex-1 border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveParStock}
                  disabled={saving}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog (Admin Only) */}
      <Dialog open={!!showAdjustDialog} onOpenChange={() => setShowAdjustDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-amber-400" />
              Edit Stock (Admin Only)
            </DialogTitle>
          </DialogHeader>

          {showAdjustDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-600/10 border border-amber-500/30">
                <p className="text-sm text-amber-400">
                  Update the stock quantity to match your physical count.
                  This will adjust the inventory accordingly.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50">
                <p className="font-medium text-white">{showAdjustDialog.item_name}</p>
                <p className="text-sm text-slate-400">
                  Current Stock in App: <span className="text-cyan-400 font-semibold">{showAdjustDialog.current_stock} {showAdjustDialog.unit}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Actual Physical Stock</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder="Enter actual physical stock quantity"
                  className="bg-slate-800 border-slate-700 text-lg"
                  data-testid="adjust-quantity-input"
                />
                {adjustQuantity && parseFloat(adjustQuantity) !== showAdjustDialog.current_stock && (
                  <p className={`text-sm font-medium ${
                    parseFloat(adjustQuantity) > showAdjustDialog.current_stock 
                      ? 'text-emerald-400' 
                      : 'text-red-400'
                  }`}>
                    Adjustment: {parseFloat(adjustQuantity) > showAdjustDialog.current_stock ? '+' : ''}
                    {(parseFloat(adjustQuantity) - showAdjustDialog.current_stock).toFixed(2)} {showAdjustDialog.unit}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Reason for Adjustment</Label>
                <Input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g., Physical stock count adjustment"
                  className="bg-slate-800 border-slate-700"
                  data-testid="adjust-reason-input"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustDialog(null)}
                  className="flex-1 border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || !adjustQuantity}
                  className="flex-1 bg-amber-600 hover:bg-amber-500"
                  data-testid="confirm-adjust-btn"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PAR Stock Update Dialog */}
      <Dialog open={showParStockDialog} onOpenChange={setShowParStockDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-purple-400" />
              Update PAR Stock from Consumption
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Calculate 10-day PAR stock based on actual consumption from kitchen requisitions.
              This will update the PAR STOCK column for all items.
            </p>
            
            {/* Date Range Selection */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Start Date</Label>
                <Input
                  type="date"
                  value={parStockDates.start_date}
                  onChange={(e) => setParStockDates({...parStockDates, start_date: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">End Date</Label>
                <Input
                  type="date"
                  value={parStockDates.end_date}
                  onChange={(e) => setParStockDates({...parStockDates, end_date: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">PAR Days</Label>
                <Input
                  type="number"
                  value={parStockDates.par_days}
                  onChange={(e) => setParStockDates({...parStockDates, par_days: parseInt(e.target.value) || 10})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => updateParStockFromConsumption(true)}
                disabled={updatingParStock}
                variant="outline"
                className="flex-1 border-purple-600 text-purple-400 hover:bg-purple-600/20"
              >
                {updatingParStock ? 'Calculating...' : 'Preview Changes'}
              </Button>
              <Button
                onClick={() => updateParStockFromConsumption(false)}
                disabled={updatingParStock || !parStockResult}
                className="flex-1 bg-purple-600 hover:bg-purple-500"
              >
                {updatingParStock ? 'Updating...' : 'Apply Updates'}
              </Button>
            </div>
            
            {/* Results */}
            {parStockResult && (
              <div className="space-y-4">
                {/* Summary */}
                <div className={`p-4 rounded-lg border ${parStockResult.dry_run ? 'bg-amber-600/10 border-amber-500/30' : 'bg-emerald-600/10 border-emerald-500/30'}`}>
                  <p className={`font-medium ${parStockResult.dry_run ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {parStockResult.dry_run ? '⚠️ Preview Mode' : '✅ Updates Applied'}
                  </p>
                  <p className="text-slate-300 text-sm mt-1">
                    Period: {parStockResult.period?.start_date} to {parStockResult.period?.end_date} ({parStockResult.period?.days} days)
                  </p>
                  <p className="text-slate-300 text-sm">
                    Items to update: {parStockResult.summary?.items_to_update || 0}
                  </p>
                  {!parStockResult.dry_run && (
                    <p className="text-emerald-400 text-sm font-medium mt-1">
                      ✓ {parStockResult.summary?.items_actually_updated || 0} items updated
                    </p>
                  )}
                </div>
                
                {/* Category Summary */}
                {parStockResult.category_summary && parStockResult.category_summary.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Category Summary</h4>
                    <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                      {parStockResult.category_summary.map((cat, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>{cat.category}</span>
                          <span className="text-purple-400">{cat.items} items, PAR: {cat.total_par_stock}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Sample Updates */}
                {parStockResult.updates && parStockResult.updates.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Sample Items ({Math.min(20, parStockResult.updates.length)} of {parStockResult.updates.length})</h4>
                    <div className="space-y-1 text-sm max-h-60 overflow-y-auto">
                      {parStockResult.updates.slice(0, 20).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300 py-1 border-b border-slate-700/50">
                          <span className="truncate flex-1">{item.item_name}</span>
                          <span className="text-slate-500 mx-2">{item.consumed_qty} consumed</span>
                          <span className="text-purple-400 font-medium">PAR: {item.new_par_stock} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
