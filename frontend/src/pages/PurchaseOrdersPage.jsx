import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, FileText, Send, Download, Check, Clock, X, AlertTriangle, MessageCircle, Minus, Search, ChevronsUpDown, Camera, MapPin, Image, Trash2, Edit, RefreshCw, CloudDownload } from 'lucide-react';
import api, { getItems } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';

// Quantity Toggle Component with both input and +/- buttons
// Perishable categories that need decimal quantity support
const PERISHABLE_CATEGORIES = ['Vegetables', 'Non Veg', 'Dairy', 'Noodles', 'Seafood', 'Meat', 'Fruits'];

function QuantityInput({ value, onChange, category }) {
  const numValue = parseFloat(value) || 0;
  
  // Use 0.1 (100g) increments for perishable categories, 0.5 for others
  const isPerishable = category && PERISHABLE_CATEGORIES.some(cat => 
    category.toLowerCase().includes(cat.toLowerCase())
  );
  const step = isPerishable ? 0.1 : 0.5;
  
  const decrease = () => {
    if (numValue > 0) {
      const newVal = Math.max(0, numValue - step);
      // Format to 1 decimal place for perishables, whole or .5 for others
      if (isPerishable) {
        onChange(newVal.toFixed(1));
      } else {
        onChange(newVal % 1 === 0 ? newVal.toString() : newVal.toFixed(1));
      }
    }
  };
  
  const increase = () => {
    const newVal = numValue + step;
    if (isPerishable) {
      onChange(newVal.toFixed(1));
    } else {
      onChange(newVal % 1 === 0 ? newVal.toString() : newVal.toFixed(1));
    }
  };
  
  const handleInputChange = (e) => {
    const val = e.target.value;
    // Allow integers and decimals (e.g., 1.5, 0.5, 10, 2.25)
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
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
        title={`Decrease by ${step} ${isPerishable ? 'kg' : ''}`}
      >
        <Minus className="w-4 h-4" />
      </Button>
      <Input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleInputChange}
        placeholder={isPerishable ? "e.g. 1.5" : "Qty"}
        className="w-20 text-center bg-slate-800 border-slate-700 px-1"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={increase}
        className="w-8 h-8 p-0 border-slate-600 hover:bg-slate-700"
        title={`Increase by ${step} ${isPerishable ? 'kg' : ''}`}
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
    'Seafood': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    'Packaging': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

// Searchable Item Combobox Component
function ItemCombobox({ items, value, onSelect, category }) {
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
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-slate-700 border-slate-500 hover:bg-slate-600 text-white text-left font-normal"
          data-testid="item-combobox-trigger"
        >
          <span className="truncate">
            {selectedItem ? selectedItem.name : "Search or select item..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 bg-slate-700 border-slate-500" align="start">
        <Command className="bg-slate-700">
          <CommandInput 
            placeholder="Type to search items..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="text-white bg-slate-600 border-slate-500"
            data-testid="item-search-input"
          />
          <CommandList className="max-h-[250px] bg-slate-700">
            <CommandEmpty className="py-4 text-center text-slate-300">
              No items found. Try a different search.
            </CommandEmpty>
            <CommandGroup>
              {filteredItems.slice(0, 50).map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onSelect(item.id);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className="cursor-pointer hover:bg-emerald-600 text-white data-[selected=true]:bg-emerald-600 py-2"
                  data-testid={`item-option-${item.id}`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Check
                      className={`h-4 w-4 ${value === item.id ? "opacity-100 text-emerald-300" : "opacity-0"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <span className={`px-1.5 py-0.5 rounded border ${getCategoryColor(item.category)}`}>
                          {item.category || 'Uncategorized'}
                        </span>
                        {item.standard_price && (
                          <span className="text-emerald-300 font-medium">₹{item.standard_price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function PurchaseOrdersPage() {
  const { user, isKitchen } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(true); // Separate loading state for POs
  const [poStats, setPoStats] = useState({ pending: 0, partial: 0, received: 0, cancelled: 0, total: 0 });
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]); // Store all items
  const [vendorItems, setVendorItems] = useState([]); // Items specific to selected vendor
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingVendorItems, setLoadingVendorItems] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false); // Toggle to show all items
  const [showEditVendorDialog, setShowEditVendorDialog] = useState(null);
  const [editVendorId, setEditVendorId] = useState('');
  const [fetchingPhoto, setFetchingPhoto] = useState(false); // For cross-app photo fetching
  const [searchQuery, setSearchQuery] = useState(''); // Search for PO number
  const [loadingPODetail, setLoadingPODetail] = useState(false); // For fetching full PO details
  const [downloadingExcel, setDownloadingExcel] = useState(false); // For Excel download
  const [selectedVendors, setSelectedVendors] = useState([]); // Multi-vendor filter for Excel (max 6)
  const [exportStartDate, setExportStartDate] = useState(''); // Start date for Excel export
  const [exportEndDate, setExportEndDate] = useState(''); // End date for Excel export
  
  // Function to fetch full PO details including photos
  const fetchPODetail = async (po) => {
    try {
      setLoadingPODetail(true);
      // Start with the list data immediately so user sees something
      setShowDetailsDialog(po);
      
      // If it has photo verification marker, fetch full details
      if (po.grn_verification?.has_photo || (po.status === 'received' || po.status === 'partial')) {
        const response = await api.get(`/api/purchase-orders/${po.id}`);
        setShowDetailsDialog(response.data);
      }
    } catch (error) {
      console.error('Error fetching PO details:', error);
      // Keep showing the list data if fetch fails
    } finally {
      setLoadingPODetail(false);
    }
  };
  
  // Create form state - delivery address defaults to user's location for kitchen users
  const [selectedVendor, setSelectedVendor] = useState('');
  const [poItems, setPoItems] = useState([{ item_id: '', quantity: '', rate: '', category: '' }]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Set default delivery address based on user role
  useEffect(() => {
    if (isKitchen && user?.location_id) {
      // For kitchen users, use their full location address with code
      const code = user.location_code ? `[${user.location_code}] ` : '';
      const address = user.location_address || user.location_name || '';
      setDeliveryAddress(`${code}${user.location_name}${address ? ', ' + address : ''}`);
    } else {
      setDeliveryAddress('Main Store');
    }
  }, [isKitchen, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingPOs(true);
      // Load stats and other data first (fast)
      const [statsRes, vendorsRes, itemsRes, catsRes] = await Promise.all([
        api.get('/api/purchase-orders/stats'),
        api.get('/api/vendors'),
        getItems(),
        api.get('/api/categories')
      ]);
      
      // Set stats immediately so user sees counts
      setPoStats(statsRes.data || { pending: 0, partial: 0, received: 0, cancelled: 0, total: 0 });
      setVendors(vendorsRes.data);
      setItems(itemsRes.data);
      setAllItems(itemsRes.data);
      
      // Extract unique categories from items
      const uniqueCats = [...new Set(itemsRes.data.map(i => i.category))].filter(Boolean).sort();
      setCategories(uniqueCats);
      
      // Set loading false so user can see the stats while POs load
      setLoading(false);
      
      // Now load POs (may take longer) - with timeout handling
      try {
        console.log('Fetching POs...');
        const posRes = await api.get('/api/purchase-orders?limit=50');
        console.log('POs response:', posRes.data);
        const posData = posRes.data.purchase_orders || posRes.data;
        console.log('POs data length:', Array.isArray(posData) ? posData.length : 'not an array');
        setPurchaseOrders(Array.isArray(posData) ? posData : []);
      } catch (poError) {
        console.error('Error loading POs:', poError);
        console.error('Error response:', poError.response?.data);
        // Retry once with even smaller limit
        try {
          console.log('Retrying with smaller limit...');
          const retryRes = await api.get('/api/purchase-orders?limit=20');
          const retryData = retryRes.data.purchase_orders || retryRes.data;
          setPurchaseOrders(Array.isArray(retryData) ? retryData : []);
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      } finally {
        setLoadingPOs(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      setLoadingPOs(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter POs based on search query (PO number or vendor name)
  const filterPOs = (pos) => {
    if (!searchQuery.trim()) return pos;
    const query = searchQuery.toLowerCase().trim();
    return pos.filter(po => 
      po.po_number?.toLowerCase().includes(query) ||
      po.vendor_name?.toLowerCase().includes(query)
    );
  };

  const addPoItem = () => {
    setPoItems([...poItems, { item_id: '', quantity: '', rate: '', category: '' }]);
  };

  const removePoItem = (index) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, i) => i !== index));
    }
  };

  // Get filtered items based on selected category for a specific row
  const getFilteredItems = (category) => {
    if (!category) return items;
    return items.filter(i => i.category === category);
  };

  const updatePoItem = (index, field, value) => {
    const updated = [...poItems];
    updated[index][field] = value;
    
    // Auto-fill rate from item standard price
    if (field === 'item_id' && value) {
      const item = items.find(i => i.id === value);
      if (item && item.standard_price) {
        updated[index].rate = item.standard_price.toString();
      }
    }
    
    setPoItems(updated);
  };

  const handleVendorSelect = async (vendorId) => {
    setSelectedVendor(vendorId);
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor && vendor.payment_terms) {
      setPaymentTerms(vendor.payment_terms);
    }
    
    // Fetch vendor-specific items
    if (vendorId) {
      try {
        setLoadingVendorItems(true);
        const response = await api.get(`/api/vendors/${vendorId}/items`);
        const vendorSpecificItems = response.data;
        setVendorItems(vendorSpecificItems);
        
        // If showAllItems is true, always show all items
        if (showAllItems) {
          setItems(allItems);
          const allCats = [...new Set(allItems.map(i => i.category))].filter(Boolean).sort();
          setCategories(allCats);
        } else if (vendorSpecificItems.length > 0) {
          // Use vendor items if available
          setItems(vendorSpecificItems);
          const vendorCats = [...new Set(vendorSpecificItems.map(i => i.category))].filter(Boolean).sort();
          setCategories(vendorCats);
        } else {
          // Fallback to all items if no vendor-specific items
          setItems(allItems);
          const allCats = [...new Set(allItems.map(i => i.category))].filter(Boolean).sort();
          setCategories(allCats);
        }
        
        // Clear selected items when vendor changes
        setPoItems([{ item_id: '', quantity: '', rate: '', category: '' }]);
      } catch (error) {
        console.error('Error fetching vendor items:', error);
        // Fallback to all items
        setItems(allItems);
      } finally {
        setLoadingVendorItems(false);
      }
    } else {
      setItems(allItems);
      const allCats = [...new Set(allItems.map(i => i.category))].filter(Boolean).sort();
      setCategories(allCats);
    }
  };
  
  // Handle toggle for showing all items
  const handleShowAllItemsToggle = () => {
    const newValue = !showAllItems;
    setShowAllItems(newValue);
    
    if (newValue) {
      // Show all items
      setItems(allItems);
      const allCats = [...new Set(allItems.map(i => i.category))].filter(Boolean).sort();
      setCategories(allCats);
    } else if (vendorItems.length > 0) {
      // Show vendor-specific items
      setItems(vendorItems);
      const vendorCats = [...new Set(vendorItems.map(i => i.category))].filter(Boolean).sort();
      setCategories(vendorCats);
    }
  };

  // Handle updating vendor for a PO
  const handleUpdateVendor = async () => {
    if (!showEditVendorDialog || !editVendorId) return;
    
    const vendor = vendors.find(v => v.id === editVendorId);
    if (!vendor) {
      alert('Please select a vendor');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.patch(`/api/purchase-orders/${showEditVendorDialog.id}/vendor`, {
        vendor_id: editVendorId,
        vendor_name: vendor.name
      });
      
      // Refresh data
      await fetchData();
      setShowEditVendorDialog(null);
      setEditVendorId('');
    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Failed to update vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    return poItems.reduce((sum, item) => {
      const qty = parseInt(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    
    if (!selectedVendor) {
      alert('Please select a vendor');
      return;
    }
    
    // Filter items with item_id and quantity, and validate rate
    const validItems = poItems.filter(i => i.item_id && i.quantity);
    
    // Check if any item is missing rate
    const itemsWithoutRate = validItems.filter(i => !i.rate || parseFloat(i.rate) <= 0);
    if (itemsWithoutRate.length > 0) {
      const itemNames = itemsWithoutRate.map(i => {
        const item = items.find(it => it.id === i.item_id);
        return item ? item.name : 'Unknown Item';
      }).join(', ');
      alert(`Please enter rate for: ${itemNames}\n\nItems without standard price must have a rate entered manually.`);
      return;
    }
    
    if (validItems.length === 0) {
      alert('Please add at least one item with quantity and rate');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/api/purchase-orders', {
        vendor_id: selectedVendor,
        items: validItems.map(i => ({
          item_id: i.item_id,
          quantity: parseFloat(i.quantity),  // Changed to parseFloat for decimal support
          rate: parseFloat(i.rate)
        })),
        delivery_date: deliveryDate || null,
        delivery_address: deliveryAddress,
        payment_terms: paymentTerms,
        notes: notes || null
      });
      
      alert(`Purchase Order ${response.data.po_number} created successfully!`);
      setShowCreateDialog(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error creating PO:', error);
      alert(error.response?.data?.detail || 'Error creating Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedVendor('');
    setPoItems([{ item_id: '', quantity: '', rate: '', category: '' }]);
    setDeliveryDate('');
    // Reset delivery address based on user role - use full address with code
    if (isKitchen && user?.location_id) {
      const code = user.location_code ? `[${user.location_code}] ` : '';
      const address = user.location_address || user.location_name || '';
      setDeliveryAddress(`${code}${user.location_name}${address ? ', ' + address : ''}`);
    } else {
      setDeliveryAddress('Main Store');
    }
    setPaymentTerms('');
    setNotes('');
    // Reset items to all items
    setItems(allItems);
    setVendorItems([]);
    setShowAllItems(false);
    const allCats = [...new Set(allItems.map(i => i.category))].filter(Boolean).sort();
    setCategories(allCats);
  };

  const downloadPDF = async (poId, poNumber) => {
    try {
      const response = await api.get(`/api/purchase-orders/${poId}/pdf`, {
        responseType: 'blob'
      });
      
      // Explicitly set PDF content type for better browser compatibility
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PO-${poNumber}.pdf`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      // Small delay before cleanup for better browser compatibility
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    }
  };

  const shareViaEmail = (po) => {
    const subject = encodeURIComponent(`Purchase Order ${po.po_number}`);
    const body = encodeURIComponent(
      `Dear ${po.vendor_name},\n\n` +
      `Please find the Purchase Order ${po.po_number} details below.\n\n` +
      `Total Amount: ₹${po.total_amount.toFixed(2)}\n` +
      `Delivery Date: ${po.delivery_date || 'ASAP'}\n\n` +
      `Items:\n${po.items.map(i => `- ${i.item_name}: ${i.quantity} ${i.unit} @ ₹${i.rate}`).join('\n')}\n\n` +
      `Please confirm the order.\n\n` +
      `Regards`
    );
    window.open(`mailto:${po.vendor_email || ''}?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = async (po) => {
    // First download PDF, then share
    try {
      const response = await api.get(`/api/purchase-orders/${po.id}/pdf`, {
        responseType: 'blob'
      });
      
      // Create download first with explicit PDF type
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PO-${po.po_number}.pdf`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // Then open WhatsApp with message
      const message = encodeURIComponent(
        `*Purchase Order: ${po.po_number}*\n\n` +
        `Vendor: ${po.vendor_name}\n` +
        `Total: ₹${po.total_amount.toFixed(2)}\n` +
        `Delivery: ${po.delivery_date || 'ASAP'}\n\n` +
        `Items:\n${po.items.map(i => `• ${i.item_name}: ${i.quantity} ${i.unit} @ ₹${i.rate}`).join('\n')}\n\n` +
        `Please find the PDF attached separately. Kindly confirm the order.`
      );
      
      const phone = po.vendor_phone ? po.vendor_phone.replace(/[^0-9]/g, '') : '';
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Error generating PDF for sharing');
    }
  };

  // Delete PO function (admin only)
  const deletePO = async (po) => {
    if (!window.confirm(`Are you sure you want to delete ${po.po_number}?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/api/purchase-orders/${po.id}`);
      alert(`${po.po_number} deleted successfully`);
      fetchPurchaseOrders(); // Refresh the list
    } catch (error) {
      console.error('Error deleting PO:', error);
      alert('Error deleting Purchase Order: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Bulk delete POs by month (admin only)
  const bulkDeletePOs = async (month, year, status = null) => {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const confirmMsg = status 
      ? `Delete all ${status.toUpperCase()} POs from ${monthName} ${year}?`
      : `Delete ALL POs from ${monthName} ${year}?`;
    
    if (!window.confirm(`${confirmMsg}\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      const params = new URLSearchParams({ month, year });
      if (status) params.append('status', status);
      
      const response = await api.delete(`/api/purchase-orders/bulk?${params.toString()}`);
      alert(response.data.message);
      fetchPurchaseOrders(); // Refresh the list
    } catch (error) {
      console.error('Error bulk deleting POs:', error);
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Fetch photo from Kitchen App (cross-app photo fetching)
  const fetchPhotoFromKitchenApp = async (poNumber) => {
    if (!poNumber) return;
    
    try {
      setFetchingPhoto(true);
      const response = await api.get(`/api/purchase-orders/${poNumber}/fetch-photo`);
      
      if (response.data?.photo) {
        // Update the showDetailsDialog state with the fetched photo
        setShowDetailsDialog(prev => ({
          ...prev,
          grn_verification: {
            ...(prev.grn_verification || {}),
            photo: response.data.photo,
            gps_location: response.data.gps_location,
            capture_time: response.data.capture_time
          }
        }));
        alert('Photo fetched successfully from Kitchen App!');
      }
    } catch (error) {
      console.error('Error fetching photo:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to fetch photo from Kitchen App';
      alert(errorMsg);
    } finally {
      setFetchingPhoto(false);
    }
  };

  // Sync photo from Kitchen App and save to local DB
  const syncPhotoFromKitchenApp = async (poId, poNumber) => {
    if (!poId) return;
    
    try {
      setFetchingPhoto(true);
      const response = await api.post(`/api/purchase-orders/${poId}/sync-photo`);
      
      if (response.data?.success) {
        alert(`Photo synced and saved successfully for ${poNumber}!`);
        // Refresh data to show updated photo
        await fetchData();
        // Update the current dialog if it's open
        const updatedPOs = await api.get('/api/purchase-orders');
        const posData = updatedPOs.data.purchase_orders || updatedPOs.data;
        const updatedPO = (Array.isArray(posData) ? posData : []).find(p => p.id === poId);
        if (updatedPO) {
          setShowDetailsDialog(updatedPO);
        }
      }
    } catch (error) {
      console.error('Error syncing photo:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to sync photo from Kitchen App';
      alert(errorMsg);
    } finally {
      setFetchingPhoto(false);
    }
  };

  // Download Purchase Orders Excel
  const downloadPOExcel = async () => {
    // Validate that at least one filter is selected
    if (selectedVendors.length === 0 && !exportStartDate && !exportEndDate) {
      alert('Please select at least one vendor OR specify a date range.\n\nDownloading all POs without filters may timeout due to large data size.');
      return;
    }
    
    try {
      setDownloadingExcel(true);
      const params = new URLSearchParams();
      
      // Add selected vendors (max 6)
      if (selectedVendors.length > 0) {
        params.append('vendor_ids', selectedVendors.join(','));
      }
      
      // Add date range if specified
      if (exportStartDate) {
        params.append('start_date', exportStartDate);
      }
      if (exportEndDate) {
        params.append('end_date', exportEndDate);
      }
      
      const response = await api.get(`/api/export/purchase-orders?${params.toString()}`, {
        responseType: 'blob',
        timeout: 60000 // 60 second timeout
      });
      
      // Check if response is an error (blob might contain JSON error)
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.detail || 'Export failed');
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Build filename
      const vendorNames = selectedVendors.length > 0 
        ? selectedVendors.map(id => vendors.find(v => v.id === id)?.name?.replace(/\s+/g, '_')).join('_').substring(0, 50)
        : 'All';
      const dateRange = exportStartDate || exportEndDate 
        ? `_${exportStartDate || 'start'}_to_${exportEndDate || 'end'}`
        : '';
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `PurchaseOrders_${vendorNames}${dateRange}_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      const status = error.response?.status;
      const message = error.response?.data?.detail || error.message || 'Unknown error';
      
      if (status === 404) {
        alert(`No POs found for the selected filters.\n\nPlease check:\n1. Selected vendors have purchase orders\n2. Date range contains actual PO dates\n3. Try expanding the date range`);
      } else {
        alert(`Export failed: ${message}\n\nTry selecting fewer vendors or a different date range.`);
      }
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Toggle vendor selection for Excel export (max 6)
  const toggleVendorSelection = (vendorId) => {
    setSelectedVendors(prev => {
      if (prev.includes(vendorId)) {
        return prev.filter(id => id !== vendorId);
      } else if (prev.length < 6) {
        return [...prev, vendorId];
      } else {
        alert('Maximum 6 vendors can be selected at a time');
        return prev;
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'partial': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'received': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'partial': return <AlertTriangle className="w-4 h-4" />;
      case 'received': return <Check className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Apply search filter to each category
  const pendingPOs = filterPOs(purchaseOrders.filter(po => po.status === 'pending'));
  const partialPOs = filterPOs(purchaseOrders.filter(po => po.status === 'partial'));
  const receivedPOs = filterPOs(purchaseOrders.filter(po => po.status === 'received'));
  const cancelledPOs = filterPOs(purchaseOrders.filter(po => po.status === 'cancelled'));
  const allFilteredPOs = filterPOs(purchaseOrders);

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="purchase-orders-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-orange-400" />
            Purchase Orders
          </h1>
          <p className="text-slate-400 mt-1">Create and manage vendor orders</p>
        </div>
        
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-orange-600 hover:bg-orange-500"
          data-testid="create-po-btn"
        >
          <Plus className="w-5 h-5 mr-2" />
          New PO
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Search by PO number or vendor name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500"
          data-testid="po-search-input"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="text-sm text-slate-400">
          Found {allFilteredPOs.length} result(s) for "{searchQuery}"
        </div>
      )}

      {/* Excel Download Section - Only for Admin and Main Store users */}
      {!isKitchen && (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Download PO Excel</h3>
        
        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              data-testid="export-start-date"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              data-testid="export-end-date"
            />
          </div>
          <div className="sm:col-span-2 flex items-end gap-2">
            <Button
              onClick={downloadPOExcel}
              disabled={downloadingExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="download-po-excel-btn"
            >
              {downloadingExcel ? (
                <span className="animate-spin mr-2">⟳</span>
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download Excel
            </Button>
            {(selectedVendors.length > 0 || exportStartDate || exportEndDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedVendors([]);
                  setExportStartDate('');
                  setExportEndDate('');
                }}
                className="text-slate-400 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        
        {/* Vendor Multi-Select */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            Select Vendors (max 6) - {selectedVendors.length}/6 selected
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-800/50 rounded-lg border border-slate-700">
            {vendors.map(v => (
              <button
                key={v.id}
                onClick={() => toggleVendorSelection(v.id)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedVendors.includes(v.id)
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
                data-testid={`vendor-chip-${v.id}`}
              >
                {v.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {selectedVendors.length === 0 
              ? '⚠️ Select vendors OR date range to download (required to prevent timeout)' 
              : `✅ Selected: ${selectedVendors.map(id => vendors.find(v => v.id === id)?.name).join(', ')}`}
          </p>
        </div>
      </div>
      )}

      {/* Summary Cards - Show actual counts from stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
          <Clock className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{poStats.pending}</p>
          <p className="text-sm text-amber-400">Pending</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
          <AlertTriangle className="w-6 h-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{poStats.partial}</p>
          <p className="text-sm text-blue-400">Partial</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30">
          <Check className="w-6 h-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">{poStats.received}</p>
          <p className="text-sm text-emerald-400">Received</p>
        </div>
        <div className="p-4 rounded-xl bg-red-600/10 border border-red-500/30">
          <X className="w-6 h-6 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-white">{poStats.cancelled}</p>
          <p className="text-sm text-red-400">Cancelled</p>
        </div>
      </div>

      {/* Purchase Orders Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600">
            Pending ({pendingPOs.length})
          </TabsTrigger>
          <TabsTrigger value="partial" className="data-[state=active]:bg-blue-600">
            Partial ({partialPOs.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="data-[state=active]:bg-emerald-600">
            Received ({receivedPOs.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-600">
            All ({poStats.total})
          </TabsTrigger>
        </TabsList>

        {['pending', 'partial', 'received', 'all'].map((tab) => {
          const pos = tab === 'pending' ? pendingPOs 
            : tab === 'partial' ? partialPOs 
            : tab === 'received' ? receivedPOs 
            : allFilteredPOs;
          
          return (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {loadingPOs ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-slate-400">Loading purchase orders...</p>
                </div>
              ) : pos.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  {searchQuery ? `No purchase orders found matching "${searchQuery}"` : 'No purchase orders found'}
                </p>
              ) : (
                pos.map((po) => (
                  <div
                    key={po.id}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800"
                    data-testid={`po-card-${po.id}`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white text-lg">{po.po_number}</p>
                        <p className="text-sm text-slate-400">{po.vendor_name}</p>
                        <p className="text-xs text-emerald-400 mt-0.5">
                          Raised by: {po.created_by_location_code ? `[${po.created_by_location_code}] ` : ''}{po.created_by_location_name || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(po.status)}`}>
                          {getStatusIcon(po.status)}
                          {po.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Date */}
                    <div className="flex items-center justify-between mb-3 text-sm">
                      <span className="text-emerald-400 font-semibold">₹{po.total_amount.toFixed(2)}</span>
                      <span className="text-slate-400">{new Date(po.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Items Preview */}
                    <div className="text-sm text-slate-400 mb-3">
                      {po.items.slice(0, 2).map((item, idx) => (
                        <span key={idx}>
                          {item.item_name} ({item.quantity})
                          {idx < Math.min(po.items.length - 1, 1) && ', '}
                        </span>
                      ))}
                      {po.items.length > 2 && ` +${po.items.length - 2} more`}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchPODetail(po)}
                        className="border-slate-700 text-slate-300"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPDF(po.id, po.po_number)}
                        className="border-slate-700 text-slate-300"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareViaEmail(po)}
                        className="border-slate-700 text-slate-300"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareViaWhatsApp(po)}
                        className="border-emerald-700 text-emerald-400 hover:bg-emerald-600/20"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                      {/* Edit Vendor button - for POs with missing/unknown vendor */}
                      {(!po.vendor_name || po.vendor_name === 'Unknown' || po.vendor_name === '') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowEditVendorDialog(po);
                            setEditVendorId('');
                          }}
                          className="border-blue-700 text-blue-400 hover:bg-blue-600/20"
                          data-testid={`edit-vendor-${po.po_number}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Set Vendor
                        </Button>
                      )}
                      {/* Delete button - only for pending POs within 3 hours */}
                      {po.status === 'pending' && (() => {
                        const createdAt = new Date(po.created_at);
                        const now = new Date();
                        const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
                        const canDelete = hoursDiff <= 3;
                        
                        if (canDelete) {
                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deletePO(po)}
                              className="border-red-700 text-red-400 hover:bg-red-600/20"
                              data-testid={`delete-po-${po.po_number}`}
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
          <p className="text-slate-400 text-sm mb-4">Delete all Purchase Orders from a specific month (for cleaning up test data - Admin only)</p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkDeletePOs(1, 2026)}
              className="border-red-700 text-red-400 hover:bg-red-600/20"
              data-testid="bulk-delete-jan-2026"
            >
              Delete All Jan 2026 POs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkDeletePOs(1, 2026, 'pending')}
              className="border-amber-700 text-amber-400 hover:bg-amber-600/20"
            >
              Delete Pending Jan 2026 Only
            </Button>
          </div>
        </div>
      )}

      {/* Create PO Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-400" />
              Create Purchase Order
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePO} className="space-y-4">
            {/* Vendor Selection */}
            <div className="space-y-2">
              <Label className="text-slate-300">Select Vendor *</Label>
              <Select value={selectedVendor} onValueChange={handleVendorSelect}>
                <SelectTrigger className="bg-slate-700 border-slate-500 text-white">
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-500 max-h-48">
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-white hover:bg-emerald-600 focus:bg-emerald-600">{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-slate-300">Items *</Label>
                {selectedVendor && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {loadingVendorItems ? (
                        "Loading items..."
                      ) : showAllItems ? (
                        <span className="text-blue-400">Showing all {items.length} items</span>
                      ) : vendorItems.length > 0 ? (
                        <span className="text-emerald-400">{items.length} items from this vendor</span>
                      ) : (
                        <span className="text-slate-500">All {items.length} items</span>
                      )}
                    </span>
                    {vendorItems.length > 0 && (
                      <button
                        type="button"
                        onClick={handleShowAllItemsToggle}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          showAllItems 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {showAllItems ? 'Show Vendor Items' : 'Show All Items'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {poItems.map((item, idx) => {
                const selectedItem = items.find(i => i.id === item.item_id);
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-700/60 border border-slate-500 space-y-3">
                    {/* Category Filter + Item Selection Row */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Category Filter */}
                      <Select
                        value={item.category || "all"}
                        onValueChange={(val) => {
                          const newCategory = val === "all" ? "" : val;
                          updatePoItem(idx, 'category', newCategory);
                          // Clear item selection when category changes
                          updatePoItem(idx, 'item_id', '');
                        }}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-500 text-white">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-500 max-h-64">
                          <SelectItem value="all" className="text-white hover:bg-emerald-600 focus:bg-emerald-600">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-white hover:bg-emerald-600 focus:bg-emerald-600">
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
                          onSelect={(itemId) => updatePoItem(idx, 'item_id', itemId)}
                          category={item.category}
                        />
                      </div>
                    </div>
                    
                    {/* Show selected item info */}
                    {selectedItem && (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(selectedItem.category)}`}>
                          {selectedItem.category}
                        </span>
                        <span className="text-xs text-slate-500">Unit: {selectedItem.unit}</span>
                        {selectedItem.standard_price && (
                          <span className="text-xs text-emerald-500">Std Price: ₹{selectedItem.standard_price}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Quantity and Rate Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Qty:</span>
                        <QuantityInput
                          value={item.quantity}
                          onChange={(val) => updatePoItem(idx, 'quantity', val)}
                          category={selectedItem?.category || item.category}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Rate ₹:</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updatePoItem(idx, 'rate', e.target.value)}
                          placeholder="0.00"
                          className="w-24 bg-slate-600 border-slate-500 text-white"
                        />
                      </div>
                      
                      <span className="text-sm font-medium text-emerald-400 ml-auto">
                        = ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                      </span>
                      
                      {poItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePoItem(idx)}
                          className="text-red-400 px-2 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addPoItem} className="border-slate-700">
                + Add Item
              </Button>
              
              {/* Total */}
              <div className="text-right text-lg font-semibold text-emerald-400 pt-2 border-t border-slate-800">
                Total: ₹{calculateTotal().toFixed(2)}
              </div>
            </div>

            {/* Delivery Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Delivery Date</Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Payment Terms</Label>
                <Input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Net 30, COD, etc."
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Delivery Address</Label>
              <Input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Delivery address"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for vendor"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="flex-1 border-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-orange-600 hover:bg-orange-500"
              >
                {submitting ? 'Creating...' : 'Create PO'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PO Details Dialog */}
      <Dialog open={!!showDetailsDialog} onOpenChange={() => setShowDetailsDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" />
              {showDetailsDialog?.po_number}
            </DialogTitle>
          </DialogHeader>

          {showDetailsDialog && (
            <div className="space-y-4">
              {/* Vendor Info */}
              <div className="p-3 rounded-xl bg-slate-800/50">
                <p className="font-semibold text-white">{showDetailsDialog.vendor_name}</p>
                {showDetailsDialog.vendor_phone && (
                  <p className="text-sm text-slate-400">Phone: {showDetailsDialog.vendor_phone}</p>
                )}
                {showDetailsDialog.vendor_email && (
                  <p className="text-sm text-slate-400">Email: {showDetailsDialog.vendor_email}</p>
                )}
              </div>

              {/* Raised By Info */}
              <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/30">
                <p className="text-xs text-slate-400 mb-1">PO Raised By</p>
                <p className="text-emerald-400 font-medium">
                  {showDetailsDialog.created_by_location_code ? `[${showDetailsDialog.created_by_location_code}] ` : ''}
                  {showDetailsDialog.created_by_location_name || 'Unknown'}
                </p>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label className="text-slate-400">Items</Label>
                {/* Header for partial/received POs */}
                {(showDetailsDialog.status === 'partial' || showDetailsDialog.status === 'received') && (
                  <div className="grid grid-cols-12 gap-2 px-2 text-xs text-slate-500 font-medium">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2 text-right">Ordered</div>
                    <div className="col-span-2 text-right">Received</div>
                    <div className="col-span-2 text-right">Short</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                )}
                {showDetailsDialog.items.map((item, idx) => (
                  <div key={idx} className={`p-2 rounded-lg bg-slate-800/50 ${item.short_quantity > 0 ? 'border border-amber-500/30' : ''}`}>
                    {(showDetailsDialog.status === 'partial' || showDetailsDialog.status === 'received') ? (
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <span className="text-white text-sm">{item.item_name}</span>
                          <span className="text-slate-500 text-xs ml-1">{item.unit}</span>
                        </div>
                        <div className="col-span-2 text-right text-slate-300 text-sm">{item.quantity}</div>
                        <div className="col-span-2 text-right text-emerald-400 text-sm">{item.received_quantity || 0}</div>
                        <div className={`col-span-2 text-right text-sm ${item.short_quantity > 0 ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
                          {item.short_quantity || 0}
                        </div>
                        <div className="col-span-2 text-right text-emerald-400 text-sm">₹{item.amount?.toFixed(2) || '0.00'}</div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white">{item.item_name}</span>
                          <span className="text-slate-400 text-sm ml-2">
                            {item.quantity} {item.unit} @ ₹{item.rate}
                          </span>
                        </div>
                        <span className="text-emerald-400">₹{item.amount?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 border-t border-slate-700 font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-emerald-400">₹{showDetailsDialog.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Created</p>
                  <p className="text-white">{new Date(showDetailsDialog.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400">Delivery Date</p>
                  <p className="text-white">{showDetailsDialog.delivery_date || 'ASAP'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Payment Terms</p>
                  <p className="text-white">{showDetailsDialog.payment_terms || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(showDetailsDialog.status)}`}>
                    {showDetailsDialog.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {showDetailsDialog.notes && (
                <div>
                  <p className="text-slate-400 text-sm">Notes</p>
                  <p className="text-white">{showDetailsDialog.notes}</p>
                </div>
              )}

              {/* GRN Verification Section - Show if PO has been received */}
              {(showDetailsDialog.status === 'received' || showDetailsDialog.status === 'partial') && showDetailsDialog.grn_verification && (
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-400" />
                    <Label className="text-blue-300 font-medium">GRN Verification</Label>
                    {showDetailsDialog.grn_verification.photo_count && showDetailsDialog.grn_verification.photo_count > 1 && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                        {showDetailsDialog.grn_verification.photo_count} photos
                      </span>
                    )}
                    {loadingPODetail && (
                      <span className="text-xs text-slate-400 ml-2">(Loading photo...)</span>
                    )}
                  </div>
                  
                  {/* Photo Preview - Support Multiple Photos */}
                  {(showDetailsDialog.grn_verification.photos && showDetailsDialog.grn_verification.photos.length > 0) ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {showDetailsDialog.grn_verification.photos.map((photo, index) => (
                        <div 
                          key={index}
                          className="relative cursor-pointer group"
                          onClick={() => setShowPhotoDialog({ 
                            photo: photo.url || photo.data || photo, 
                            index, 
                            total: showDetailsDialog.grn_verification.photos.length,
                            allPhotos: showDetailsDialog.grn_verification.photos
                          })}
                        >
                          <img 
                            src={photo.url || photo.data || photo} 
                            alt={`GRN Photo ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-lg border border-slate-700"
                          />
                          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm flex items-center gap-1">
                              <Image className="w-4 h-4" />
                              {index + 1}/{showDetailsDialog.grn_verification.photos.length}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : showDetailsDialog.grn_verification.photo ? (
                    <div 
                      className="relative cursor-pointer"
                      onClick={() => setShowPhotoDialog(showDetailsDialog.grn_verification)}
                    >
                      <img 
                        src={showDetailsDialog.grn_verification.photo} 
                        alt="GRN Verification" 
                        className="w-full h-48 object-cover rounded-lg border border-slate-700"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white flex items-center gap-2">
                          <Image className="w-5 h-5" />
                          Click to enlarge
                        </span>
                      </div>
                    </div>
                  ) : loadingPODetail ? (
                    <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600 flex items-center justify-center h-48">
                      <span className="text-slate-400">Loading photo...</span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-amber-600/10 border border-amber-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Photo not available locally</span>
                      </div>
                      {showDetailsDialog.grn_verification.has_photos && (
                        <p className="text-amber-300/70 text-sm">
                          {showDetailsDialog.grn_verification.photo_count || 0} photo(s) were captured but may not have synced properly. 
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Verification Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-slate-500">Captured</p>
                        <p className="text-white">
                          {showDetailsDialog.grn_verification.capture_time 
                            ? new Date(showDetailsDialog.grn_verification.capture_time).toLocaleString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-slate-500">Location</p>
                        <p className="text-white text-xs">
                          {showDetailsDialog.grn_verification.gps_location
                            ? `${showDetailsDialog.grn_verification.gps_location.latitude.toFixed(6)}, ${showDetailsDialog.grn_verification.gps_location.longitude.toFixed(6)}`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* GRN Info */}
                  <div className="pt-2 border-t border-blue-500/20 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Invoice #:</span>
                      <span className="text-white">{showDetailsDialog.grn_invoice_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">GRN Date:</span>
                      <span className="text-white">
                        {showDetailsDialog.grn_date 
                          ? new Date(showDetailsDialog.grn_date).toLocaleDateString()
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="text-emerald-400 font-medium">
                        ₹{showDetailsDialog.grn_amount?.toLocaleString() || '-'}
                      </span>
                    </div>
                    {showDetailsDialog.grn_location_type === 'kitchen' && (
                      <div className="mt-2 px-2 py-1 bg-teal-500/20 rounded text-teal-400 text-center text-xs">
                        Kitchen GRN (Daily Perishable)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show message for received POs without GRN verification data */}
              {(showDetailsDialog.status === 'received' || showDetailsDialog.status === 'partial') && !showDetailsDialog.grn_verification && (
                <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600 space-y-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-slate-400" />
                    <Label className="text-slate-300 font-medium">GRN Verification</Label>
                  </div>
                  <p className="text-slate-400 text-sm">
                    No GRN verification photo was captured for this order.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => downloadPDF(showDetailsDialog.id, showDetailsDialog.po_number)}
                  className="flex-1 border-slate-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => shareViaWhatsApp(showDetailsDialog)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Screen Photo Dialog */}
      <Dialog open={!!showPhotoDialog} onOpenChange={() => setShowPhotoDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-4xl max-h-[95vh] overflow-y-auto p-2">
          <DialogHeader className="p-4">
            <DialogTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              GRN Verification Photo
            </DialogTitle>
          </DialogHeader>
          
          {showPhotoDialog && (
            <div className="space-y-4 p-4">
              {/* Photo Navigation for Multiple Photos */}
              {showPhotoDialog.allPhotos && showPhotoDialog.allPhotos.length > 1 && (
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPhotoDialog(prev => ({
                      ...prev,
                      index: Math.max(0, (prev.index || 0) - 1),
                      photo: prev.allPhotos[Math.max(0, (prev.index || 0) - 1)]?.data || prev.allPhotos[Math.max(0, (prev.index || 0) - 1)]
                    }))}
                    disabled={!showPhotoDialog.index || showPhotoDialog.index === 0}
                    className="border-slate-600"
                  >
                    ← Previous
                  </Button>
                  <span className="text-slate-400">
                    Photo {(showPhotoDialog.index || 0) + 1} of {showPhotoDialog.total || showPhotoDialog.allPhotos.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPhotoDialog(prev => ({
                      ...prev,
                      index: Math.min(prev.allPhotos.length - 1, (prev.index || 0) + 1),
                      photo: prev.allPhotos[Math.min(prev.allPhotos.length - 1, (prev.index || 0) + 1)]?.data || prev.allPhotos[Math.min(prev.allPhotos.length - 1, (prev.index || 0) + 1)]
                    }))}
                    disabled={showPhotoDialog.index >= showPhotoDialog.allPhotos.length - 1}
                    className="border-slate-600"
                  >
                    Next →
                  </Button>
                </div>
              )}
              
              {/* Large Photo */}
              <img 
                src={showPhotoDialog.photo} 
                alt="GRN Verification" 
                className="w-full rounded-lg border border-slate-700"
              />
              
              {/* Photo Thumbnails for Multiple Photos */}
              {showPhotoDialog.allPhotos && showPhotoDialog.allPhotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {showPhotoDialog.allPhotos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo.url || photo.data || photo}
                      alt={`Photo ${idx + 1}`}
                      className={`w-16 h-16 object-cover rounded cursor-pointer border-2 flex-shrink-0 ${
                        idx === showPhotoDialog.index ? 'border-blue-500' : 'border-slate-700'
                      }`}
                      onClick={() => setShowPhotoDialog(prev => ({
                        ...prev,
                        index: idx,
                        photo: photo.url || photo.data || photo
                      }))}
                    />
                  ))}
                </div>
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
                    <p className="text-slate-400 text-sm">GPS Coordinates</p>
                    <p className="text-white">
                      {showPhotoDialog.gps_location
                        ? `${showPhotoDialog.gps_location.latitude.toFixed(6)}, ${showPhotoDialog.gps_location.longitude.toFixed(6)}`
                        : 'Not recorded'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Verified At</p>
                    <p className="text-white">
                      {showPhotoDialog.verified_at 
                        ? new Date(showPhotoDialog.verified_at).toLocaleString()
                        : 'Not recorded'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Google Maps Link */}
              {showPhotoDialog.gps_location && (
                <a 
                  href={`https://www.google.com/maps?q=${showPhotoDialog.gps_location.latitude},${showPhotoDialog.gps_location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  Open Location in Google Maps
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={!!showEditVendorDialog} onOpenChange={(open) => !open && setShowEditVendorDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-400" />
              Set Vendor for {showEditVendorDialog?.po_number}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Select Vendor</Label>
              <Select value={editVendorId} onValueChange={setEditVendorId}>
                <SelectTrigger className="bg-slate-700 border-slate-500 text-white">
                  <SelectValue placeholder="Choose a vendor..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {vendors.map(vendor => (
                    <SelectItem 
                      key={vendor.id} 
                      value={vendor.id}
                      className="text-white hover:bg-slate-700"
                    >
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditVendorDialog(null)}
                className="flex-1 border-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateVendor}
                disabled={!editVendorId || submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-500"
              >
                {submitting ? 'Saving...' : 'Save Vendor'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
