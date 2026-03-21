import { useState, useRef } from 'react';
import { Camera, Upload, FileText, AlertTriangle, Check, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { getLocations, getVendors } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function InvoiceScanPage() {
  const { isMainStore } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef(null);

  const loadMasterData = async () => {
    try {
      const [locsRes, vendorsRes] = await Promise.all([
        getLocations(),
        getVendors()
      ]);
      setLocations(locsRes.data);
      setVendors(vendorsRes.data);
      
      // Default to Main Store
      const mainStore = locsRes.data.find(l => l.type === 'main_store');
      if (mainStore) setSelectedLocation(mainStore.id);
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    await processInvoice(file);
  };

  const processInvoice = async (file) => {
    setScanning(true);
    setError(null);
    setInvoiceData(null);
    
    try {
      await loadMasterData();
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/invoice/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setInvoiceData(response.data);
    } catch (err) {
      console.error('Error scanning invoice:', err);
      setError(err.response?.data?.detail || 'Error processing invoice');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmGRN = async () => {
    if (!selectedLocation || !expiryDate) {
      alert('Please select location and expiry date');
      return;
    }
    
    try {
      setConfirming(true);
      
      // Filter items that are matched with database items
      const itemsToCreate = invoiceData.items.filter(i => i.matched_item_id);
      
      if (itemsToCreate.length === 0) {
        alert('No items matched with database. Please add items manually first.');
        return;
      }
      
      // Create GRNs via the API
      for (const item of itemsToCreate) {
        await api.post('/api/grn', {
          item_id: item.matched_item_id,
          quantity: item.quantity,
          expiry_date: expiryDate,
          location_id: selectedLocation,
          vendor_id: selectedVendor || null,
          purchase_rate: item.rate,
          notes: `From invoice: ${invoiceData.invoice_number || 'N/A'}`
        });
      }
      
      alert(`Created ${itemsToCreate.length} GRN entries successfully!`);
      
      // Reset
      setInvoiceData(null);
      setExpiryDate('');
      
    } catch (err) {
      console.error('Error creating GRN:', err);
      alert(err.response?.data?.detail || 'Error creating GRN entries');
    } finally {
      setConfirming(false);
    }
  };

  const resetScan = () => {
    setInvoiceData(null);
    setError(null);
    setExpiryDate('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isMainStore) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Only Main Store can access invoice scanning</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="invoice-scan-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-violet-400" />
          Invoice Scanner
        </h1>
        <p className="text-slate-400 mt-1">Scan vendor invoice to auto-add stock</p>
      </div>

      {/* Upload Section */}
      {!invoiceData && !scanning && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-violet-600/20 flex items-center justify-center">
              <Camera className="w-10 h-10 text-violet-400" />
            </div>
            
            <h2 className="text-lg font-semibold text-white mb-2">Upload Invoice Image</h2>
            <p className="text-slate-400 text-sm mb-6">
              Take a photo or upload an image of your vendor invoice
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-violet-600 hover:bg-violet-500 px-8"
                data-testid="upload-invoice-btn"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Invoice
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-600/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scanning State */}
      {scanning && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-white mb-2">Processing Invoice...</h2>
            <p className="text-slate-400 text-sm">
              AI is extracting items, quantities, and prices
            </p>
          </div>
        </div>
      )}

      {/* Invoice Results */}
      {invoiceData && (
        <div className="space-y-4">
          {/* Invoice Header */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Invoice Details</h2>
              <Button
                onClick={resetScan}
                variant="outline"
                size="sm"
                className="border-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Scan New
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Vendor</p>
                <p className="text-white font-medium">{invoiceData.vendor_name || 'Not detected'}</p>
              </div>
              <div>
                <p className="text-slate-400">Invoice #</p>
                <p className="text-white font-medium">{invoiceData.invoice_number || 'Not detected'}</p>
              </div>
              <div>
                <p className="text-slate-400">Date</p>
                <p className="text-white font-medium">{invoiceData.invoice_date || 'Not detected'}</p>
              </div>
              <div>
                <p className="text-slate-400">Total Amount</p>
                <p className="text-white font-medium">₹{invoiceData.total_amount?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          {/* Price Variance Alert */}
          {invoiceData.has_price_variances && (
            <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-400">Price Variance Detected!</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    The following items have different prices from standard:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {invoiceData.price_variances.map((v, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="text-white">{v.item_name}</span>
                        <span className="text-slate-400"> - Invoice: ₹{v.invoice_rate}, Standard: ₹{v.standard_price} </span>
                        <span className={v.variance > 0 ? 'text-red-400' : 'text-emerald-400'}>
                          ({v.variance > 0 ? '+' : ''}₹{v.variance}, {v.variance_percent}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Extracted Items</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="text-left p-3 text-sm text-slate-400">Item</th>
                    <th className="text-right p-3 text-sm text-slate-400">Qty</th>
                    <th className="text-right p-3 text-sm text-slate-400">Rate</th>
                    <th className="text-right p-3 text-sm text-slate-400">Amount</th>
                    <th className="text-center p-3 text-sm text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-slate-800">
                      <td className="p-3">
                        <p className="text-white">{item.item_name}</p>
                        {item.matched_item_id && (
                          <p className="text-xs text-emerald-400">Matched</p>
                        )}
                      </td>
                      <td className="p-3 text-right text-white">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 text-right">
                        <span className={item.price_variance ? 'text-amber-400' : 'text-white'}>
                          ₹{item.rate}
                        </span>
                      </td>
                      <td className="p-3 text-right text-white">₹{item.amount}</td>
                      <td className="p-3 text-center">
                        {item.matched_item_id ? (
                          <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-xs text-slate-500">Not matched</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRN Creation Section */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Add to Stock</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Receive at Location *</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Vendor</Label>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select vendor (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Expiry Date *</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <Button
              onClick={handleConfirmGRN}
              disabled={confirming || !selectedLocation || !expiryDate}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-6"
            >
              {confirming ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Creating GRN...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Create GRN for {invoiceData.items.filter(i => i.matched_item_id).length} Items
                </span>
              )}
            </Button>
            
            {invoiceData.items.some(i => !i.matched_item_id) && (
              <p className="text-sm text-amber-400 mt-2 text-center">
                {invoiceData.items.filter(i => !i.matched_item_id).length} item(s) not matched - please add them to Items Master first
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
