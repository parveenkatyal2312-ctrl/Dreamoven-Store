import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { 
  Carrot, 
  Building2, 
  ShoppingCart, 
  PackageCheck, 
  Calendar,
  MapPin,
  Clock,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  CalendarRange,
  AlertCircle
} from 'lucide-react';
import api from '../lib/api';

// Category color helper
const getCategoryColor = (category) => {
  const colors = {
    'Vegetables': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Non Veg': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Dairy': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Seafood': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Fruits': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Bakery': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Beverages': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

export default function DailyPerishablesPage() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receivables, setReceivables] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [showPhotoDialog, setShowPhotoDialog] = useState(null);
  const [categoryTotals, setCategoryTotals] = useState({});

  useEffect(() => {
    fetchData();
  }, [selectedLocation, dateRange, customStartDate, customEndDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch locations (kitchens only)
      const locRes = await api.get('/api/locations');
      const kitchens = locRes.data.filter(l => l.type === 'kitchen');
      setLocations(kitchens);

      // Build query params
      const params = new URLSearchParams();
      if (selectedLocation !== 'all') {
        params.append('kitchen_id', selectedLocation);
      }
      
      // Handle date range
      if (dateRange === 'today') {
        params.append('start_date', new Date().toISOString().split('T')[0]);
        params.append('end_date', new Date().toISOString().split('T')[0]);
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.append('start_date', weekAgo.toISOString().split('T')[0]);
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        params.append('start_date', monthAgo.toISOString().split('T')[0]);
      } else if (dateRange === 'custom' && customStartDate) {
        params.append('start_date', customStartDate.toISOString().split('T')[0]);
        if (customEndDate) {
          params.append('end_date', customEndDate.toISOString().split('T')[0]);
        }
      }

      // Fetch kitchen receivables (daily perishables)
      const recRes = await api.get(`/api/reports/kitchen-receivables?${params.toString()}`);
      setReceivables(recRes.data.receivables || []);

      // Fetch kitchen POs with GRN verification
      const poRes = await api.get('/api/purchase-orders?limit=500');
      // Handle paginated response
      const posData = poRes.data?.purchase_orders || poRes.data || [];
      const kitchenPOs = posData.filter(po => {
        // Only kitchen GRNs
        if (po.grn_location_type !== 'kitchen') return false;
        // Filter by location if selected
        if (selectedLocation !== 'all' && po.grn_kitchen_id !== selectedLocation) return false;
        return true;
      });
      setPurchaseOrders(kitchenPOs);

      // Calculate category totals
      const totals = {};
      (recRes.data.receivables || []).forEach(item => {
        const cat = item.category || 'Uncategorized';
        if (!totals[cat]) {
          totals[cat] = { count: 0, quantity: 0, amount: 0 };
        }
        totals[cat].count++;
        totals[cat].quantity += item.quantity || 0;
        totals[cat].amount += item.amount || 0;
      });
      setCategoryTotals(totals);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePOExpand = (poId) => {
    setExpandedPOs(prev => ({ ...prev, [poId]: !prev[poId] }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group receivables by kitchen for ledger view
  const groupedByKitchen = receivables.reduce((acc, item) => {
    const kitchenId = item.kitchen_id;
    if (!acc[kitchenId]) {
      acc[kitchenId] = {
        kitchen_name: item.kitchen_name,
        items: [],
        total: 0,
        categories: {}
      };
    }
    acc[kitchenId].items.push(item);
    acc[kitchenId].total += item.amount || 0;
    
    // Track by category
    const cat = item.category || 'Uncategorized';
    if (!acc[kitchenId].categories[cat]) {
      acc[kitchenId].categories[cat] = { count: 0, amount: 0 };
    }
    acc[kitchenId].categories[cat].count++;
    acc[kitchenId].categories[cat].amount += item.amount || 0;
    
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Carrot className="w-7 h-7 text-emerald-400" />
            Daily Perishables
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track kitchen GRN receivables with verification
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <Building2 className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All Outlets" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white hover:bg-emerald-600 focus:bg-emerald-600">All Outlets</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id} className="text-white hover:bg-emerald-600 focus:bg-emerald-600">
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(val) => {
            setDateRange(val);
            if (val !== 'custom') {
              setCustomStartDate(null);
              setCustomEndDate(null);
            }
          }}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="today" className="text-white hover:bg-emerald-600 focus:bg-emerald-600">Today</SelectItem>
              <SelectItem value="week" className="text-white hover:bg-emerald-600 focus:bg-emerald-600">Last 7 Days</SelectItem>
              <SelectItem value="month" className="text-white hover:bg-emerald-600 focus:bg-emerald-600">Last 30 Days</SelectItem>
              <SelectItem value="all" className="text-white hover:bg-emerald-600 focus:bg-emerald-600">All Time</SelectItem>
              <SelectItem value="custom" className="text-white hover:bg-emerald-600 focus:bg-emerald-600">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Picker */}
          {dateRange === 'custom' && (
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 min-w-[200px] justify-start"
                >
                  <CalendarRange className="w-4 h-4 mr-2 text-emerald-400" />
                  {customStartDate ? (
                    customEndDate ? (
                      <span>
                        {customStartDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {customEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    ) : (
                      <span>{customStartDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    )
                  ) : (
                    <span className="text-slate-400">Pick dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <div className="p-3 border-b border-slate-700">
                  <p className="text-sm text-slate-400 mb-2">Select date range</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs bg-slate-700 border-slate-600 text-white hover:bg-emerald-600"
                      onClick={() => {
                        const today = new Date();
                        setCustomStartDate(today);
                        setCustomEndDate(today);
                      }}
                    >
                      Today
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs bg-slate-700 border-slate-600 text-white hover:bg-emerald-600"
                      onClick={() => {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        setCustomStartDate(yesterday);
                        setCustomEndDate(yesterday);
                      }}
                    >
                      Yesterday
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs bg-slate-700 border-slate-600 text-white hover:bg-emerald-600"
                      onClick={() => {
                        const today = new Date();
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        setCustomStartDate(weekAgo);
                        setCustomEndDate(today);
                      }}
                    >
                      Last 7 Days
                    </Button>
                  </div>
                </div>
                <div className="flex">
                  <div className="p-2 border-r border-slate-700">
                    <p className="text-xs text-slate-400 mb-1 text-center">Start Date</p>
                    <CalendarComponent
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        setCustomStartDate(date);
                        if (!customEndDate || date > customEndDate) {
                          setCustomEndDate(date);
                        }
                      }}
                      className="rounded-md"
                      classNames={{
                        day_selected: "bg-emerald-600 text-white hover:bg-emerald-600",
                        day_today: "bg-slate-700 text-white",
                      }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-slate-400 mb-1 text-center">End Date</p>
                    <CalendarComponent
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      disabled={(date) => customStartDate && date < customStartDate}
                      className="rounded-md"
                      classNames={{
                        day_selected: "bg-emerald-600 text-white hover:bg-emerald-600",
                        day_today: "bg-slate-700 text-white",
                      }}
                    />
                  </div>
                </div>
                <div className="p-3 border-t border-slate-700 flex justify-end gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    onClick={() => {
                      setCustomStartDate(null);
                      setCustomEndDate(null);
                    }}
                  >
                    Clear
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => setShowDatePicker(false)}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Outlets</p>
                <p className="text-xl font-bold text-white">{Object.keys(groupedByKitchen).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">POs Received</p>
                <p className="text-xl font-bold text-white">{purchaseOrders.filter(po => po.status === 'received').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600/20">
                <PackageCheck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Items Received</p>
                <p className="text-xl font-bold text-white">{receivables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-600/20">
                <Carrot className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Value</p>
                <p className="text-xl font-bold text-white">
                  ₹{receivables.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="outlets" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="outlets" className="data-[state=active]:bg-emerald-600">
            <Building2 className="w-4 h-4 mr-2" />
            Outlets
          </TabsTrigger>
          <TabsTrigger value="pos" className="data-[state=active]:bg-emerald-600">
            <ShoppingCart className="w-4 h-4 mr-2" />
            PO & GRN
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-emerald-600">
            <Carrot className="w-4 h-4 mr-2" />
            By Category
          </TabsTrigger>
        </TabsList>

        {/* Outlets Tab */}
        <TabsContent value="outlets" className="space-y-4">
          {Object.keys(groupedByKitchen).length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-8 text-center">
                <Carrot className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No perishables received for the selected period</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByKitchen).map(([kitchenId, data]) => (
              <Card key={kitchenId} className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                      {data.kitchen_name}
                    </CardTitle>
                    <span className="text-xl font-bold text-emerald-400">
                      ₹{data.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Category breakdown */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(data.categories).map(([cat, info]) => (
                      <span key={cat} className={`px-2 py-1 rounded text-xs border ${getCategoryColor(cat)}`}>
                        {cat}: {info.count} items (₹{info.amount.toLocaleString('en-IN')})
                      </span>
                    ))}
                  </div>
                  
                  {/* Items list */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {data.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                        <div className="flex-1">
                          <p className="text-sm text-white">{item.item_name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className={`px-1.5 py-0.5 rounded border ${getCategoryColor(item.category)}`}>
                              {item.category || 'Uncategorized'}
                            </span>
                            <span>{item.vendor_name}</span>
                            <span>{formatDate(item.receive_date)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">{item.quantity} {item.unit}</p>
                          <p className="text-xs text-emerald-400">₹{item.amount?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* PO & GRN Tab */}
        <TabsContent value="pos" className="space-y-4">
          {purchaseOrders.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No kitchen POs found for the selected period</p>
              </CardContent>
            </Card>
          ) : (
            purchaseOrders.map(po => (
              <Card key={po.id} className="bg-slate-900 border-slate-800">
                <CardHeader 
                  className="cursor-pointer" 
                  onClick={() => togglePOExpand(po.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-blue-400" />
                        {po.po_number}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          po.status === 'received' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {po.status}
                        </span>
                      </CardTitle>
                      <p className="text-sm text-slate-400 mt-1">
                        {po.vendor_name} • {po.delivery_address}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-emerald-400">
                        ₹{po.grn_amount?.toLocaleString('en-IN') || po.total?.toLocaleString('en-IN')}
                      </span>
                      {expandedPOs[po.id] ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {expandedPOs[po.id] && (
                  <CardContent className="pt-0">
                    {/* GRN Verification Info */}
                    {po.grn_verification && (
                      <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                          <PackageCheck className="w-4 h-4" />
                          GRN Verification
                        </h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300">
                              {formatDate(po.grn_verification.capture_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300">
                              {formatTime(po.grn_verification.capture_time)}
                            </span>
                          </div>
                          {po.grn_verification.gps_location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-300">
                                {po.grn_verification.gps_location.latitude?.toFixed(4)}, 
                                {po.grn_verification.gps_location.longitude?.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Photo Actions - View & Download */}
                        <div className="mt-3 flex items-center gap-2">
                          {po.grn_verification.photo ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowPhotoDialog(po);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Photo
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Download the photo
                                  const link = document.createElement('a');
                                  link.href = po.grn_verification.photo;
                                  link.download = `GRN-${po.po_number}-verification.jpg`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </>
                          ) : po.grn_verification.has_photos ? (
                            <div className="flex items-center gap-2 text-sm text-amber-400">
                              <AlertCircle className="w-4 h-4" />
                              <span>{po.grn_verification.photo_count || 0} photo(s) captured but not synced. Update app to retry.</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <ImageIcon className="w-4 h-4" />
                              <span>No verification photo attached</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Items */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-400">Items Received</h4>
                      {(po.received_items || po.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                          <div>
                            <p className="text-sm text-white">{item.item_name || item.name}</p>
                            <span className={`px-1.5 py-0.5 rounded text-xs border ${getCategoryColor(item.category)}`}>
                              {item.category || 'Uncategorized'}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">
                              {item.received_qty || item.quantity} {item.unit}
                            </p>
                            <p className="text-xs text-emerald-400">
                              @ ₹{item.rate || item.invoice_rate} = ₹{(item.final_amount || item.amount || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          {Object.keys(categoryTotals).length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-8 text-center">
                <Carrot className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No category data for the selected period</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(categoryTotals).map(([category, data]) => (
                <Card key={category} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-2 rounded-lg text-sm font-medium border ${getCategoryColor(category)}`}>
                          {category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">₹{data.amount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-slate-400">{data.count} items</p>
                      </div>
                    </div>
                    
                    {/* Items in this category */}
                    <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                      {receivables
                        .filter(r => (r.category || 'Uncategorized') === category)
                        .map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm py-1 border-t border-slate-800">
                            <span className="text-slate-300">{item.item_name}</span>
                            <span className="text-slate-400">
                              {item.quantity} {item.unit} • ₹{item.amount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* This data adds to kitchen ledgers notice */}
          <Card className="bg-emerald-900/20 border-emerald-600/30">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <PackageCheck className="w-4 h-4" />
                Category totals are automatically added to respective kitchen ledgers
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Photo Dialog */}
      <Dialog open={!!showPhotoDialog} onOpenChange={() => setShowPhotoDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              GRN Verification Photo - {showPhotoDialog?.po_number}
            </DialogTitle>
          </DialogHeader>
          
          {showPhotoDialog?.grn_verification && (
            <div className="space-y-4">
              {/* Photo */}
              {showPhotoDialog.grn_verification.photo && (
                <div className="rounded-lg overflow-hidden border border-slate-700">
                  <img 
                    src={showPhotoDialog.grn_verification.photo} 
                    alt="GRN Verification"
                    className="w-full max-h-96 object-contain bg-slate-800"
                  />
                </div>
              )}
              
              {/* Metadata */}
              <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-slate-800/50">
                <div className="text-center">
                  <Calendar className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs text-slate-400">Date</p>
                  <p className="text-sm text-white">{formatDate(showPhotoDialog.grn_verification.capture_time)}</p>
                </div>
                <div className="text-center">
                  <Clock className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs text-slate-400">Time</p>
                  <p className="text-sm text-white">{formatTime(showPhotoDialog.grn_verification.capture_time)}</p>
                </div>
                {showPhotoDialog.grn_verification.gps_location && (
                  <div className="text-center">
                    <MapPin className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm text-white">
                      {showPhotoDialog.grn_verification.gps_location.latitude?.toFixed(4)}, 
                      {showPhotoDialog.grn_verification.gps_location.longitude?.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Additional Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Vendor: <span className="text-white">{showPhotoDialog.vendor_name}</span>
                </span>
                <span className="text-slate-400">
                  Outlet: <span className="text-white">{showPhotoDialog.delivery_address}</span>
                </span>
              </div>
              
              {/* Download Button */}
              {showPhotoDialog.grn_verification.photo && (
                <div className="flex justify-end">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = showPhotoDialog.grn_verification.photo;
                      link.download = `GRN-${showPhotoDialog.po_number}-verification.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Photo
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
