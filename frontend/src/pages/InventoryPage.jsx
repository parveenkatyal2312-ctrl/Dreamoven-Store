import { useState, useEffect } from 'react';
import { Boxes, Search, Filter, QrCode, MapPin } from 'lucide-react';
import { getLots, getLocations, getCategories } from '../lib/api';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function InventoryPage() {
  const [lots, setLots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedLot, setSelectedLot] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lotsRes, locsRes, catsRes] = await Promise.all([
        getLots(),
        getLocations(),
        getCategories()
      ]);
      setLots(lotsRes.data);
      setLocations(locsRes.data);
      setCategories(catsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLots = lots.filter(lot => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!lot.item_name.toLowerCase().includes(query) && 
          !lot.lot_number.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Location filter
    if (filterLocation !== 'all' && lot.location_id !== filterLocation) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== 'all' && lot.status !== filterStatus) {
      return false;
    }
    
    // Category filter
    if (filterCategory !== 'all' && lot.category !== filterCategory) {
      return false;
    }
    
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      case 'exhausted': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
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
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="inventory-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Boxes className="w-7 h-7 text-emerald-400" />
          Inventory
        </h1>
        <p className="text-slate-400 mt-1">View all lots and stock levels</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items or lot numbers..."
            className="pl-10 bg-slate-800 border-slate-700"
            data-testid="inventory-search"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-sm">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="exhausted">Exhausted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-slate-400">
        Showing {filteredLots.length} of {lots.length} lots
      </p>

      {/* Lots Grid */}
      <div className="space-y-2">
        {filteredLots.length === 0 ? (
          <div className="text-center py-12">
            <Boxes className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No lots found</p>
          </div>
        ) : (
          filteredLots.map(lot => (
            <div
              key={lot.id}
              onClick={() => setSelectedLot(lot)}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-white">{lot.item_name}</p>
                  <p className="text-sm text-slate-400">{lot.lot_number}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lot.status)}`}>
                  {lot.status}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-slate-400">Qty</p>
                  <p className="text-white font-medium">{lot.current_quantity} {lot.unit}</p>
                </div>
                <div>
                  <p className="text-slate-400">Location</p>
                  <p className="text-white font-medium truncate">{lot.location_name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Category</p>
                  <p className="text-white font-medium truncate">{lot.category}</p>
                </div>
                <div>
                  <p className="text-slate-400">Expiry</p>
                  <p className="text-white font-medium">{new Date(lot.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lot Details Dialog */}
      <Dialog open={!!selectedLot} onOpenChange={() => setSelectedLot(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              Lot Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedLot && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                <img 
                  src={`data:image/png;base64,${selectedLot.qr_code}`} 
                  alt="QR Code" 
                  className="w-40 h-40"
                />
              </div>

              {/* Details Grid */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Lot Number</span>
                  <span className="text-white font-mono">{selectedLot.lot_number}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Item</span>
                  <span className="text-white">{selectedLot.item_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Category</span>
                  <span className="text-white">{selectedLot.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Current Qty</span>
                  <span className="text-white">{selectedLot.current_quantity} {selectedLot.unit}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Initial Qty</span>
                  <span className="text-white">{selectedLot.initial_quantity} {selectedLot.unit}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Location</span>
                  <span className="text-white">{selectedLot.location_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Expiry Date</span>
                  <span className="text-white">{new Date(selectedLot.expiry_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLot.status)}`}>
                    {selectedLot.status}
                  </span>
                </div>
                {selectedLot.vendor_name && (
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Vendor</span>
                    <span className="text-white">{selectedLot.vendor_name}</span>
                  </div>
                )}
                {selectedLot.purchase_rate && (
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Purchase Rate</span>
                    <span className="text-white">₹{selectedLot.purchase_rate}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Created</span>
                  <span className="text-white">{new Date(selectedLot.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
