import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Send, Check, AlertTriangle, Clock, Package, Minus, FileText, Download, MapPin, Calendar, ChevronsUpDown, Trash2, XCircle, AlertOctagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getItems, getLocations } from '../lib/api';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';

// Quantity Toggle Component for Kitchen users
function QuantityToggle({ value, onChange, min = 0, step = 1 }) {
  const numValue = parseInt(value) || 0;
  
  const decrease = () => {
    const newVal = Math.max(min, numValue - step);
    onChange(newVal.toString());
  };
  
  const increase = () => {
    onChange((numValue + step).toString());
  };
  
  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      onChange(val);
    }
  };
  
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={decrease}
        className="w-8 h-8 p-0 border-slate-600 hover:bg-slate-700"
        data-testid="qty-decrease"
      >
        <Minus className="w-4 h-4" />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleInputChange}
        className="w-16 text-center bg-slate-800 border-slate-700 px-1"
        data-testid="qty-input"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={increase}
        className="w-8 h-8 p-0 border-slate-600 hover:bg-slate-700"
        data-testid="qty-increase"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Category badge color helper
function getCategoryColor(category) {
  const colors = {
    'Beverage': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Indian Grocery': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Chinese Grocery': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Continental Grocery': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Continental grocery': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Housekeeping': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'Dairy': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Dairy Product': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Seafood': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    'Packaging': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Non Veg': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'Vegetables': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

// Searchable Item Combobox Component with Stock Status
function ItemCombobox({ items, value, onSelect, category, stockData = {} }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter items by category if specified
  const filteredByCategory = category 
    ? items.filter(i => i.category === category)
    : items;
  
  // Further filter by search query
  const filteredItems = searchQuery
    ? filteredByCategory.filter(i => 
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredByCategory;
  
  const selectedItem = items.find(i => i.id === value);
  const selectedStock = selectedItem ? (stockData[selectedItem.id] || 0) : 0;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between bg-slate-700 border-slate-500 hover:bg-slate-600 text-white text-left font-normal ${
            selectedItem && selectedStock === 0 ? 'border-red-500 bg-red-900/20' : ''
          }`}
          data-testid="req-item-combobox-trigger"
        >
          <span className="truncate flex items-center gap-2">
            {selectedItem ? (
              <>
                {`${selectedItem.name} (${selectedItem.unit})`}
                {selectedStock === 0 ? (
                  <span className="text-red-400 text-xs font-semibold px-1.5 py-0.5 bg-red-600/30 rounded">OUT OF STOCK</span>
                ) : (
                  <span className="text-emerald-400 text-xs">[{selectedStock} available]</span>
                )}
              </>
            ) : "Search or select item..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-slate-700 border-slate-500" align="start">
        <Command className="bg-slate-700">
          <CommandInput 
            placeholder="Type to search items..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="text-white bg-slate-600 border-slate-500"
            data-testid="req-item-search-input"
          />
          <CommandList className="max-h-[200px] bg-slate-700">
            <CommandEmpty className="py-4 text-center text-slate-300">
              No items found.
            </CommandEmpty>
            <CommandGroup>
              {filteredItems.slice(0, 50).map((item) => {
                const itemStock = stockData[item.id] || 0;
                const isOutOfStock = itemStock === 0;
                
                return (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => {
                      if (isOutOfStock) {
                        // Show alert for out of stock
                        alert(`⚠️ OUT OF STOCK\n\n"${item.name}" is currently out of stock in the Main Store.\n\nPlease select a different item.`);
                        return;
                      }
                      onSelect(item.id);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className={`cursor-pointer text-white data-[selected=true]:bg-emerald-600 py-2 ${
                      isOutOfStock 
                        ? 'opacity-60 bg-red-900/20 hover:bg-red-900/30' 
                        : 'hover:bg-emerald-600'
                    }`}
                    data-testid={`req-item-option-${item.id}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {isOutOfStock ? (
                        <XCircle className="h-4 w-4 text-red-400" />
                      ) : (
                        <Check
                          className={`h-4 w-4 ${value === item.id ? "opacity-100 text-emerald-300" : "opacity-0"}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`truncate text-sm font-medium ${isOutOfStock ? 'text-slate-400 line-through' : ''}`}>
                            {item.name}
                          </p>
                          {isOutOfStock ? (
                            <span className="text-red-400 text-xs font-bold ml-2">OUT OF STOCK</span>
                          ) : (
                            <span className="text-emerald-400 text-xs ml-2">{itemStock} avail.</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className={`px-1.5 py-0.5 rounded border ${getCategoryColor(item.category)}`}>
                            {item.category || 'Uncategorized'}
                          </span>
                          <span className="text-slate-300">{item.unit}</span>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function RequisitionsPage() {
  const { user, isKitchen, isMainStore } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDispatchDialog, setShowDispatchDialog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Stock data from main store - {item_id: available_quantity}
  const [stockData, setStockData] = useState({});
  const [loadingStock, setLoadingStock] = useState(false);
  
  // Create form
  const [reqItems, setReqItems] = useState([{ item_id: '', quantity: '', notes: '', category: '' }]);
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');

  // Dispatch form
  const [dispatchItems, setDispatchItems] = useState([]);
  const [dispatchNotes, setDispatchNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, itemsRes] = await Promise.all([
        api.get('/api/requisitions'),
        getItems()
      ]);
      setRequisitions(reqRes.data);
      setItems(itemsRes.data);
      
      // Extract unique categories
      const uniqueCats = [...new Set(itemsRes.data.map(i => i.category))].filter(Boolean).sort();
      setCategories(uniqueCats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch main store stock data for requisition creation
  const fetchStockData = async () => {
    try {
      setLoadingStock(true);
      const response = await api.get('/api/stock/current');
      // Convert to lookup object {item_id: current_stock}
      const stockLookup = {};
      response.data.forEach(item => {
        stockLookup[item.item_id] = item.current_stock || 0;
      });
      setStockData(stockLookup);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoadingStock(false);
    }
  };

  // Open create dialog and fetch stock data
  const openCreateDialog = () => {
    setShowCreateDialog(true);
    fetchStockData(); // Fetch latest stock when opening dialog
  };

  // Delete single requisition (admin only)
  const deleteRequisition = async (req) => {
    if (!window.confirm(`Are you sure you want to delete ${req.serial_number}?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/api/requisitions/${req.id}`);
      alert(`${req.serial_number} deleted successfully`);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting requisition:', error);
      alert('Error deleting requisition: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Bulk delete requisitions by month (admin only)
  const bulkDeleteRequisitions = async (month, year, status = null) => {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const confirmMsg = status 
      ? `Delete all ${status.toUpperCase()} requisitions from ${monthName} ${year}?`
      : `Delete ALL requisitions from ${monthName} ${year}?`;
    
    if (!window.confirm(`${confirmMsg}\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      const params = new URLSearchParams({ month, year });
      if (status) params.append('status', status);
      
      const response = await api.delete(`/api/requisitions/bulk?${params.toString()}`);
      alert(response.data.message);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error bulk deleting requisitions:', error);
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const addReqItem = () => {
    setReqItems([...reqItems, { item_id: '', quantity: '', notes: '', category: '' }]);
  };

  const removeReqItem = (index) => {
    if (reqItems.length > 1) {
      setReqItems(reqItems.filter((_, i) => i !== index));
    }
  };

  const updateReqItem = (index, field, value) => {
    const updated = [...reqItems];
    
    // If updating quantity, check against available stock
    if (field === 'quantity' && updated[index].item_id) {
      const itemId = updated[index].item_id;
      const availableStock = stockData[itemId] || 0;
      const requestedQty = parseFloat(value) || 0;
      
      if (availableStock === 0) {
        alert(`⚠️ OUT OF STOCK\n\nThis item is currently out of stock in the Main Store.\n\nPlease select a different item.`);
        return;
      }
      
      if (requestedQty > availableStock) {
        alert(`⚠️ INSUFFICIENT STOCK\n\nRequested: ${requestedQty}\nAvailable: ${availableStock}\n\nQuantity has been adjusted to the maximum available.`);
        value = availableStock;
      }
    }
    
    // If selecting an item, check if it's out of stock
    if (field === 'item_id' && value) {
      const availableStock = stockData[value] || 0;
      if (availableStock === 0) {
        alert(`⚠️ OUT OF STOCK\n\nThis item is currently out of stock in the Main Store.\n\nPlease select a different item.`);
        return; // Don't allow selecting out of stock items
      }
    }
    
    updated[index][field] = value;
    setReqItems(updated);
  };

  const handleCreateRequisition = async (e) => {
    e.preventDefault();
    
    const validItems = reqItems.filter(i => i.item_id && i.quantity);
    if (validItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    // Final stock validation before submitting
    const outOfStockItems = [];
    const insufficientStockItems = [];
    
    for (const item of validItems) {
      const availableStock = stockData[item.item_id] || 0;
      const requestedQty = parseFloat(item.quantity);
      const itemInfo = items.find(i => i.id === item.item_id);
      const itemName = itemInfo ? itemInfo.name : 'Unknown Item';
      
      if (availableStock === 0) {
        outOfStockItems.push(itemName);
      } else if (requestedQty > availableStock) {
        insufficientStockItems.push(`${itemName}: Requested ${requestedQty}, Available ${availableStock}`);
      }
    }
    
    if (outOfStockItems.length > 0) {
      alert(`⚠️ OUT OF STOCK ITEMS\n\nThe following items are out of stock:\n\n${outOfStockItems.join('\n')}\n\nPlease remove them from your requisition.`);
      return;
    }
    
    if (insufficientStockItems.length > 0) {
      const proceed = window.confirm(`⚠️ INSUFFICIENT STOCK\n\nThe following items have less stock than requested:\n\n${insufficientStockItems.join('\n')}\n\nDo you want to proceed anyway? The store may dispatch a partial quantity.`);
      if (!proceed) return;
    }

    // Prevent duplicate submissions
    if (submitting) {
      alert('✅ REQUISITION ALREADY SENT\n\nYour requisition is being processed. Please wait...');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await api.post('/api/requisitions', {
        items: validItems.map(i => ({
          item_id: i.item_id,
          quantity: parseFloat(i.quantity),
          notes: i.notes || null
        })),
        priority,
        notes: notes || null
      });
      
      // Show success message with requisition number
      const reqNumber = response.data?.serial_number || response.data?.requisition_number || 'REQ';
      alert(`✅ REQUISITION SENT SUCCESSFULLY!\n\nRequisition Number: ${reqNumber}\n\nYour request has been submitted to Main Store.`);
      
      setShowCreateDialog(false);
      setReqItems([{ item_id: '', quantity: '', notes: '' }]);
      setPriority('normal');
      setNotes('');
      await fetchData();
    } catch (error) {
      console.error('Error creating requisition:', error);
      alert(error.response?.data?.detail || 'Error creating requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const openDispatchDialog = (req) => {
    setShowDispatchDialog(req);
    setDispatchItems(req.items.map(item => ({
      item_id: item.item_id,
      item_name: item.item_name,
      unit: item.unit,
      category: item.category,
      quantity_requested: item.quantity_requested,
      quantity_already_sent: item.quantity_sent,
      quantity_to_send: Math.max(0, item.quantity_requested - item.quantity_sent),
      remark: 'ok'  // Default to OK
    })));
    setDispatchNotes('');
  };

  const handleDispatch = async () => {
    try {
      setSubmitting(true);
      
      const itemsToDispatch = dispatchItems
        .filter(i => i.quantity_to_send > 0)
        .map(i => ({
          item_id: i.item_id,
          quantity_sent: parseInt(i.quantity_to_send),
          remark: i.remark
        }));
      
      if (itemsToDispatch.length === 0) {
        alert('Please enter quantities to dispatch');
        return;
      }
      
      const response = await api.post(`/api/requisitions/${showDispatchDialog.id}/dispatch`, {
        items: itemsToDispatch,
        notes: dispatchNotes || null
      });
      
      // Show success with challan number
      const challanNumber = response.data.challan_number;
      if (response.data.has_shortages) {
        alert(`Dispatch completed with shortages!\nChallan: ${challanNumber}\n\n${response.data.shortages.map(s => `${s.item_name}: Sent ${s.sent}/${s.requested}`).join('\n')}`);
      } else {
        alert(`Dispatch completed successfully!\nChallan: ${challanNumber}`);
      }
      
      setShowDispatchDialog(null);
      await fetchData();
    } catch (error) {
      console.error('Error dispatching:', error);
      alert(error.response?.data?.detail || 'Error dispatching');
    } finally {
      setSubmitting(false);
    }
  };

  // Kitchen confirms receipt of dispatched goods
  const confirmReceipt = async (reqId) => {
    if (!window.confirm('Confirm that you have received all the dispatched items?')) return;
    
    try {
      setSubmitting(true);
      await api.post(`/api/requisitions/${reqId}/confirm-receipt`);
      alert('Receipt confirmed successfully! Main store has been notified.');
      await fetchData();
    } catch (error) {
      console.error('Error confirming receipt:', error);
      alert(error.response?.data?.detail || 'Error confirming receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadChallan = async (reqId, challanNumber) => {
    try {
      const response = await api.get(`/api/requisitions/${reqId}/challan`, {
        responseType: 'blob'
      });
      
      // Explicitly set PDF content type for better browser compatibility
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Challan-${challanNumber}.pdf`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      // Small delay before cleanup for better browser compatibility
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading challan:', error);
      alert('Error downloading challan. Please try again.');
    }
  };

  const updateDispatchItem = (index, field, value) => {
    const updated = [...dispatchItems];
    updated[index][field] = value;
    
    // Auto-set remark to SHORT if quantity is less than requested
    if (field === 'quantity_to_send') {
      const qty = parseInt(value) || 0;
      const remaining = updated[index].quantity_requested - updated[index].quantity_already_sent;
      updated[index].remark = qty < remaining ? 'short' : 'ok';
    }
    
    setDispatchItems(updated);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'dispatched': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'partial': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'received': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'normal': return 'text-slate-400';
      case 'low': return 'text-slate-500';
      default: return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const pendingReqs = requisitions.filter(r => r.status === 'pending');
  const activeReqs = requisitions.filter(r => ['dispatched', 'partial'].includes(r.status));
  const completedReqs = requisitions.filter(r => ['completed', 'received'].includes(r.status));

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="requisitions-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-400" />
            Requisitions
          </h1>
          <p className="text-slate-400 mt-1">
            {isKitchen ? 'Request items from Main Store' : 'Manage kitchen requisitions'}
          </p>
        </div>
        
        {isKitchen && (
          <Button
            onClick={openCreateDialog}
            className="bg-blue-600 hover:bg-blue-500"
            data-testid="create-requisition-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </Button>
        )}
      </div>

      {/* Summary Cards for Main Store */}
      {isMainStore && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
            <Clock className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-2xl font-bold text-white">{pendingReqs.length}</p>
            <p className="text-sm text-amber-400">Pending</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
            <Send className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-white">{activeReqs.length}</p>
            <p className="text-sm text-blue-400">In Progress</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30">
            <Check className="w-6 h-6 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold text-white">{completedReqs.length}</p>
            <p className="text-sm text-emerald-400">Completed</p>
          </div>
        </div>
      )}

      {/* Requisitions Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600">
            Pending ({pendingReqs.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-blue-600">
            In Progress ({activeReqs.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-600">
            Completed ({completedReqs.length})
          </TabsTrigger>
        </TabsList>

        {['pending', 'active', 'completed'].map((tab) => {
          const reqs = tab === 'pending' ? pendingReqs : tab === 'active' ? activeReqs : completedReqs;
          
          return (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {reqs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No {tab} requisitions</p>
              ) : (
                reqs.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800"
                  >
                    {/* Header with Serial Number */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-slate-800 text-xs font-mono text-emerald-400">
                          {req.serial_number || 'REQ-XXX'}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(req.priority)}`}>
                          {req.priority.toUpperCase()}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Kitchen Info */}
                    <div className="mb-3 p-2 rounded-lg bg-slate-800/30">
                      <p className="font-semibold text-white">{req.kitchen_name}</p>
                      {req.kitchen_address && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {req.kitchen_address}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleString()}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-3">
                      {req.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-800/50">
                          <div>
                            <span className="text-white">{item.item_name}</span>
                            {item.category && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">
                              {item.quantity_sent}/{item.quantity_requested} {item.unit}
                            </span>
                            {item.remark && (
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                item.remark === 'ok' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {item.remark.toUpperCase()}
                              </span>
                            )}
                            {item.shortage > 0 && !item.remark && (
                              <span className="text-red-400 text-xs">
                                (-{item.shortage})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shortage Alert */}
                    {req.items.some(i => i.shortage > 0) && (
                      <div className="p-2 rounded-lg bg-red-600/10 border border-red-500/30 mb-3">
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Short delivery</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {isMainStore && req.status === 'pending' && (
                        <Button
                          onClick={() => openDispatchDialog(req)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Dispatch
                        </Button>
                      )}
                      
                      {/* Kitchen can confirm receipt for dispatched/partial requisitions */}
                      {isKitchen && (req.status === 'dispatched' || req.status === 'partial') && (
                        <Button
                          onClick={() => confirmReceipt(req.id)}
                          disabled={submitting}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                          data-testid="confirm-receipt-btn"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {submitting ? 'Confirming...' : 'Confirm Receipt'}
                        </Button>
                      )}
                      
                      {/* Challan Download Button */}
                      {req.challan_number && (
                        <Button
                          variant="outline"
                          onClick={() => downloadChallan(req.id, req.challan_number)}
                          className="border-slate-700 text-slate-300"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Challan
                        </Button>
                      )}
                      
                      {/* Delete button - only for pending requisitions within 3 hours */}
                      {req.status === 'pending' && (() => {
                        const createdAt = new Date(req.created_at);
                        const now = new Date();
                        const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
                        const canDelete = hoursDiff <= 3;
                        
                        if (canDelete) {
                          return (
                            <Button
                              variant="outline"
                              onClick={() => deleteRequisition(req)}
                              className="border-red-700 text-red-400 hover:bg-red-600/20"
                              data-testid={`delete-req-${req.serial_number}`}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Bulk Delete Section - Admin Only */}
      {user?.role === 'admin' && (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
          <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Admin: Bulk Delete Test Data
          </h3>
          <p className="text-slate-400 text-sm mb-4">Delete all Requisitions from a specific month (for cleaning up test data - Admin only)</p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkDeleteRequisitions(1, 2026)}
              className="border-red-700 text-red-400 hover:bg-red-600/20"
              data-testid="bulk-delete-reqs-jan-2026"
            >
              Delete All Jan 2026 Requisitions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkDeleteRequisitions(1, 2026, 'pending')}
              className="border-amber-700 text-amber-400 hover:bg-amber-600/20"
            >
              Delete Pending Jan 2026 Only
            </Button>
          </div>
        </div>
      )}

      {/* Create Requisition Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              New Requisition
            </DialogTitle>
          </DialogHeader>

          {/* Stock Loading Indicator */}
          {loadingStock && (
            <div className="text-center py-2 text-sm text-blue-400 bg-blue-900/20 rounded">
              <span className="animate-pulse">Loading stock availability...</span>
            </div>
          )}

          <form onSubmit={handleCreateRequisition} className="space-y-4">
            {/* Items */}
            <div className="space-y-3">
              <Label className="text-slate-300 flex items-center gap-2">
                Items Needed
                <span className="text-xs text-slate-500 font-normal">(Stock shown in green)</span>
              </Label>
              {reqItems.map((item, idx) => {
                const selectedItem = items.find(i => i.id === item.item_id);
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/50 space-y-3">
                    {/* Category Filter + Item Selection Row */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Category Filter */}
                      <Select
                        value={item.category || "all"}
                        onValueChange={(val) => {
                          const newCategory = val === "all" ? "" : val;
                          updateReqItem(idx, 'category', newCategory);
                          // Clear item selection when category changes
                          updateReqItem(idx, 'item_id', '');
                        }}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              <span className={`px-1.5 py-0.5 rounded text-xs border ${getCategoryColor(cat)}`}>
                                {cat}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Searchable Item Selection */}
                      <div className="col-span-2">
                        <ItemCombobox
                          items={items}
                          value={item.item_id}
                          onSelect={(itemId) => updateReqItem(idx, 'item_id', itemId)}
                          category={item.category}
                          stockData={stockData}
                        />
                      </div>
                    </div>
                    
                    {/* Show selected item info with stock status */}
                    {selectedItem && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-1 rounded-full border ${getCategoryColor(selectedItem.category)}`}>
                            {selectedItem.category}
                          </span>
                          <span className="text-slate-500">Unit: {selectedItem.unit}</span>
                        </div>
                        {/* Stock indicator */}
                        <div className="text-xs">
                          {stockData[selectedItem.id] === 0 ? (
                            <span className="text-red-400 font-semibold flex items-center gap-1">
                              <AlertOctagon className="w-3 h-3" />
                              OUT OF STOCK
                            </span>
                          ) : stockData[selectedItem.id] !== undefined ? (
                            <span className={`font-medium ${
                              stockData[selectedItem.id] < 10 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {stockData[selectedItem.id]} available in store
                            </span>
                          ) : (
                            <span className="text-slate-500">Checking stock...</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Quantity Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Quantity:</span>
                        {selectedItem && stockData[selectedItem.id] > 0 && (
                          <span className="text-xs text-slate-500">(max: {stockData[selectedItem.id]})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <QuantityToggle
                          value={item.quantity}
                          onChange={(val) => updateReqItem(idx, 'quantity', val)}
                          min={0}
                          max={selectedItem ? (stockData[selectedItem.id] || 9999) : 9999}
                          step={1}
                        />
                        {reqItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeReqItem(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Warning if quantity exceeds stock */}
                    {selectedItem && item.quantity && parseFloat(item.quantity) > (stockData[selectedItem.id] || 0) && stockData[selectedItem.id] !== undefined && (
                      <div className="text-xs text-amber-400 flex items-center gap-1 bg-amber-900/20 px-2 py-1 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        Requested qty exceeds available stock ({stockData[selectedItem.id]} available)
                      </div>
                    )}
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addReqItem} className="border-slate-700">
                + Add Item
              </Button>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-slate-300">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-slate-300">Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <Button 
              type="submit" 
              disabled={submitting} 
              className={`w-full ${submitting ? 'bg-emerald-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              {submitting ? '✅ SENT - Processing...' : 'Submit Requisition'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dispatch Dialog */}
      <Dialog open={!!showDispatchDialog} onOpenChange={() => setShowDispatchDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" />
              Dispatch Items
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Requisition Info */}
            {showDispatchDialog && (
              <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-blue-400">
                    {showDispatchDialog.serial_number || 'REQ-XXX'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(showDispatchDialog.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-semibold text-white">{showDispatchDialog.kitchen_name}</p>
                {showDispatchDialog.kitchen_address && (
                  <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {showDispatchDialog.kitchen_address}
                  </p>
                )}
              </div>
            )}

            {/* Items to dispatch with toggle */}
            <div className="space-y-3">
              <Label className="text-slate-300">Items to Issue</Label>
              {dispatchItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  {/* Item Name & Category */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-white font-medium">{item.item_name}</span>
                      {item.category && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-slate-400">
                      Req: {item.quantity_requested} {item.unit}
                    </span>
                  </div>
                  
                  {/* Quantity with Toggle */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Label className="text-slate-400 text-sm">Send:</Label>
                      <QuantityToggle
                        value={item.quantity_to_send}
                        onChange={(val) => updateDispatchItem(idx, 'quantity_to_send', val)}
                        min={0}
                        step={1}
                      />
                    </div>
                    
                    {/* OK/Short Toggle */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => updateDispatchItem(idx, 'remark', 'ok')}
                        className={`px-3 py-1 rounded-l-lg text-sm font-medium transition-colors ${
                          item.remark === 'ok' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDispatchItem(idx, 'remark', 'short')}
                        className={`px-3 py-1 rounded-r-lg text-sm font-medium transition-colors ${
                          item.remark === 'short' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        SHORT
                      </button>
                    </div>
                  </div>
                  
                  {item.quantity_already_sent > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Already sent: {item.quantity_already_sent}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-slate-300">Dispatch Notes</Label>
              <Input
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="Optional notes for delivery"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <Button onClick={handleDispatch} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500">
              <FileText className="w-4 h-4 mr-2" />
              {submitting ? 'Processing...' : 'Confirm & Generate Challan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
