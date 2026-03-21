import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  FileText, ShoppingCart, AlertTriangle, Check, RefreshCw, 
  Package, TrendingDown, Building2, Plus, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../lib/api';

export default function AutoPOPage() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [expandedVendors, setExpandedVendors] = useState({});
  const [creatingPO, setCreatingPO] = useState(false);
  const [forecastDays, setForecastDays] = useState(3);
  const [parDays, setParDays] = useState(10);
  
  // Items without vendor
  const [showNoVendorDialog, setShowNoVendorDialog] = useState(false);
  const [itemsWithoutVendor, setItemsWithoutVendor] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assigningVendor, setAssigningVendor] = useState(false);
  const [selectedVendorForAssign, setSelectedVendorForAssign] = useState('');
  const [selectedItemsForAssign, setSelectedItemsForAssign] = useState({});

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auto-po/suggestions', {
        params: { days_forecast: forecastDays, par_days: parDays }
      });
      setSuggestions(response.data);
      
      // Auto-expand first vendor
      if (response.data.vendor_suggestions?.length > 0) {
        setExpandedVendors({ [response.data.vendor_suggestions[0].vendor_id]: true });
      }
      
      // Auto-select all items
      const newSelected = {};
      response.data.vendor_suggestions?.forEach(vendor => {
        vendor.items.forEach(item => {
          newSelected[`${vendor.vendor_id}_${item.item_id}`] = true;
        });
      });
      setSelectedItems(newSelected);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      alert('Error fetching suggestions: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchItemsWithoutVendor = async () => {
    try {
      const response = await api.get('/api/auto-po/items-without-vendor');
      setItemsWithoutVendor(response.data.items || []);
      setVendors(response.data.vendors || []);
    } catch (error) {
      console.error('Error fetching items without vendor:', error);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    fetchItemsWithoutVendor();
  }, []);

  const toggleVendor = (vendorId) => {
    setExpandedVendors(prev => ({ ...prev, [vendorId]: !prev[vendorId] }));
  };

  const toggleItem = (vendorId, itemId) => {
    const key = `${vendorId}_${itemId}`;
    setSelectedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllVendorItems = (vendorId, items, select) => {
    const newSelected = { ...selectedItems };
    items.forEach(item => {
      newSelected[`${vendorId}_${item.item_id}`] = select;
    });
    setSelectedItems(newSelected);
  };

  const getSelectedItemsForVendor = (vendorId, items) => {
    return items.filter(item => selectedItems[`${vendorId}_${item.item_id}`]);
  };

  const createPO = async (vendorId, vendorName) => {
    const vendor = suggestions.vendor_suggestions.find(v => v.vendor_id === vendorId);
    if (!vendor) return;

    const selectedItemIds = getSelectedItemsForVendor(vendorId, vendor.items).map(i => i.item_id);
    if (selectedItemIds.length === 0) {
      alert('Please select at least one item');
      return;
    }

    try {
      setCreatingPO(vendorId);
      const response = await api.post('/api/auto-po/create-po', null, {
        params: {
          vendor_id: vendorId,
          item_ids: selectedItemIds.join(',')
        }
      });
      
      alert(`PO ${response.data.po_number} created successfully!\n\nVendor: ${response.data.vendor_name}\nItems: ${response.data.items_count}\nTotal: ₹${response.data.total_amount.toLocaleString()}`);
      
      // Refresh suggestions
      fetchSuggestions();
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Error creating PO: ' + (error.response?.data?.detail || error.message));
    } finally {
      setCreatingPO(false);
    }
  };

  const assignVendorToItems = async () => {
    if (!selectedVendorForAssign) {
      alert('Please select a vendor');
      return;
    }

    const selectedIds = Object.keys(selectedItemsForAssign).filter(k => selectedItemsForAssign[k]);
    if (selectedIds.length === 0) {
      alert('Please select at least one item');
      return;
    }

    try {
      setAssigningVendor(true);
      await api.post('/api/auto-po/assign-vendor', null, {
        params: {
          vendor_id: selectedVendorForAssign,
          item_ids: selectedIds.join(',')
        }
      });
      
      alert(`Successfully assigned ${selectedIds.length} items to vendor`);
      setShowNoVendorDialog(false);
      setSelectedItemsForAssign({});
      setSelectedVendorForAssign('');
      fetchItemsWithoutVendor();
      fetchSuggestions();
    } catch (error) {
      console.error('Error assigning vendor:', error);
      alert('Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setAssigningVendor(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-400" />
            Auto PO Suggestions
          </h1>
          <p className="text-slate-400 mt-1">
            Auto-generate purchase orders based on PAR stock analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-slate-400 text-sm">Forecast Days:</Label>
            <Input
              type="number"
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value) || 3)}
              className="w-16 bg-slate-800 border-slate-700"
            />
          </div>
          <Button
            onClick={fetchSuggestions}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {suggestions && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-white">{suggestions.summary?.items_with_par || 0}</p>
              <p className="text-sm text-slate-400">Items with PAR</p>
            </CardContent>
          </Card>
          <Card className="bg-red-600/10 border-red-500/30">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-red-400">{suggestions.summary?.items_needing_reorder || 0}</p>
              <p className="text-sm text-red-400/70">Need Reorder</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-600/10 border-purple-500/30">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-purple-400">{suggestions.summary?.vendors_count || 0}</p>
              <p className="text-sm text-purple-400/70">Vendors</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-600/10 border-emerald-500/30">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-emerald-400">₹{(suggestions.summary?.total_suggested_value || 0).toLocaleString()}</p>
              <p className="text-sm text-emerald-400/70">Total Value</p>
            </CardContent>
          </Card>
          <Card 
            className="bg-amber-600/10 border-amber-500/30 cursor-pointer hover:bg-amber-600/20"
            onClick={() => setShowNoVendorDialog(true)}
          >
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-amber-400">{suggestions.summary?.items_without_vendor || 0}</p>
              <p className="text-sm text-amber-400/70">No Vendor Assigned</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-300 font-medium">How Auto PO Works</p>
            <p className="text-sm text-blue-400/70 mt-1">
              Items are suggested for reorder if their projected stock (Current - Daily Consumption × {forecastDays} days) 
              falls below PAR stock. Order quantity = PAR Stock - Current Stock + buffer for lead time.
            </p>
          </div>
        </div>
      </div>

      {/* Vendor-wise Suggestions */}
      <div className="space-y-4">
        {suggestions?.vendor_suggestions?.map((vendor) => {
          const isExpanded = expandedVendors[vendor.vendor_id];
          const selectedCount = getSelectedItemsForVendor(vendor.vendor_id, vendor.items).length;
          const selectedValue = getSelectedItemsForVendor(vendor.vendor_id, vendor.items)
            .reduce((sum, i) => sum + i.order_value, 0);
          
          return (
            <Card key={vendor.vendor_id} className="bg-slate-900/50 border-slate-800 overflow-hidden">
              {/* Vendor Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50"
                onClick={() => toggleVendor(vendor.vendor_id)}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-white font-semibold">{vendor.vendor_name}</h3>
                    <p className="text-sm text-slate-400">
                      {vendor.total_items} items • ₹{vendor.total_value.toLocaleString()} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                    {selectedCount} selected • ₹{selectedValue.toLocaleString()}
                  </Badge>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      createPO(vendor.vendor_id, vendor.vendor_name);
                    }}
                    disabled={creatingPO === vendor.vendor_id || selectedCount === 0}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    {creatingPO === vendor.vendor_id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Create PO
                      </>
                    )}
                  </Button>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </div>

              {/* Items List */}
              {isExpanded && (
                <div className="border-t border-slate-800">
                  {/* Select All */}
                  <div className="p-2 bg-slate-800/30 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vendor.items.every(i => selectedItems[`${vendor.vendor_id}_${i.item_id}`])}
                        onChange={(e) => selectAllVendorItems(vendor.vendor_id, vendor.items, e.target.checked)}
                        className="rounded border-slate-600"
                      />
                      Select All
                    </label>
                  </div>
                  
                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/50">
                        <tr>
                          <th className="w-10 p-2"></th>
                          <th className="text-left p-2 text-xs text-slate-400">Item</th>
                          <th className="text-left p-2 text-xs text-slate-400">Category</th>
                          <th className="text-right p-2 text-xs text-slate-400">Current</th>
                          <th className="text-right p-2 text-xs text-slate-400">PAR</th>
                          <th className="text-right p-2 text-xs text-slate-400">Daily Avg</th>
                          <th className="text-right p-2 text-xs text-slate-400">Projected</th>
                          <th className="text-right p-2 text-xs text-slate-400">Order Qty</th>
                          <th className="text-right p-2 text-xs text-slate-400">Value</th>
                          <th className="text-center p-2 text-xs text-slate-400">Urgency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendor.items.map((item) => (
                          <tr 
                            key={item.item_id} 
                            className="border-t border-slate-800/50 hover:bg-slate-800/30"
                          >
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!selectedItems[`${vendor.vendor_id}_${item.item_id}`]}
                                onChange={() => toggleItem(vendor.vendor_id, item.item_id)}
                                className="rounded border-slate-600"
                              />
                            </td>
                            <td className="p-2 text-white text-sm">{item.item_name}</td>
                            <td className="p-2 text-slate-400 text-sm">{item.category}</td>
                            <td className="p-2 text-right text-slate-300 text-sm">{item.current_stock} {item.unit}</td>
                            <td className="p-2 text-right text-purple-400 text-sm">{item.par_stock}</td>
                            <td className="p-2 text-right text-slate-400 text-sm">{item.daily_consumption}</td>
                            <td className={`p-2 text-right text-sm ${item.projected_stock_after_days <= 0 ? 'text-red-400' : 'text-amber-400'}`}>
                              {item.projected_stock_after_days}
                            </td>
                            <td className="p-2 text-right text-emerald-400 font-medium text-sm">{item.suggested_order_qty}</td>
                            <td className="p-2 text-right text-white text-sm">₹{item.order_value.toLocaleString()}</td>
                            <td className="p-2 text-center">
                              <Badge className={`text-xs ${getUrgencyColor(item.urgency)}`}>
                                {item.urgency}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {suggestions?.vendor_suggestions?.length === 0 && (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-medium">All items are well stocked!</p>
            <p className="text-slate-400 text-sm mt-1">No items need reordering at this time.</p>
          </div>
        )}
      </div>

      {/* Items Without Vendor Dialog */}
      <Dialog open={showNoVendorDialog} onOpenChange={setShowNoVendorDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Items Without Vendor ({itemsWithoutVendor.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              These items don't have a vendor assigned. Assign vendors to include them in Auto PO suggestions.
            </p>

            {/* Vendor Selection */}
            <div className="flex items-center gap-3">
              <Select value={selectedVendorForAssign} onValueChange={setSelectedVendorForAssign}>
                <SelectTrigger className="w-64 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select Vendor" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={assignVendorToItems}
                disabled={assigningVendor || !selectedVendorForAssign}
                className="bg-purple-600 hover:bg-purple-500"
              >
                {assigningVendor ? 'Assigning...' : 'Assign Selected'}
              </Button>
            </div>

            {/* Items List */}
            <div className="max-h-96 overflow-y-auto border border-slate-800 rounded-lg">
              <table className="w-full">
                <thead className="bg-slate-800 sticky top-0">
                  <tr>
                    <th className="w-10 p-2">
                      <input
                        type="checkbox"
                        checked={itemsWithoutVendor.length > 0 && itemsWithoutVendor.every(i => selectedItemsForAssign[i.item_id])}
                        onChange={(e) => {
                          const newSelected = {};
                          itemsWithoutVendor.forEach(i => {
                            newSelected[i.item_id] = e.target.checked;
                          });
                          setSelectedItemsForAssign(newSelected);
                        }}
                        className="rounded border-slate-600"
                      />
                    </th>
                    <th className="text-left p-2 text-xs text-slate-400">Item Name</th>
                    <th className="text-left p-2 text-xs text-slate-400">Category</th>
                    <th className="text-right p-2 text-xs text-slate-400">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsWithoutVendor.slice(0, 100).map((item) => (
                    <tr key={item.item_id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!selectedItemsForAssign[item.item_id]}
                          onChange={() => setSelectedItemsForAssign(prev => ({
                            ...prev,
                            [item.item_id]: !prev[item.item_id]
                          }))}
                          className="rounded border-slate-600"
                        />
                      </td>
                      <td className="p-2 text-white text-sm">{item.name}</td>
                      <td className="p-2 text-slate-400 text-sm">{item.category}</td>
                      <td className="p-2 text-right text-slate-300 text-sm">₹{item.standard_price || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
