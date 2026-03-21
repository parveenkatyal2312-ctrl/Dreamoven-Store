import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, TrendingDown, Package, Search, Edit2, ShoppingCart } from 'lucide-react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

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
  };
  return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showEditDialog, setShowEditDialog] = useState(null);
  const [editParStock, setEditParStock] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, catsRes] = await Promise.all([
        api.get('/api/stock/current?below_par_only=true'),
        api.get('/api/categories')
      ]);
      setAlerts(alertsRes.data);
      setCategories(catsRes.data.map(c => c.name));
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAlerts = alerts.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.item_name.toLowerCase().includes(query)) return false;
    }
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  // Group by severity
  const criticalAlerts = filteredAlerts.filter(i => i.current_stock === 0);
  const lowStockAlerts = filteredAlerts.filter(i => i.current_stock > 0 && i.current_stock < i.par_stock * 0.5);
  const warningAlerts = filteredAlerts.filter(i => i.current_stock >= i.par_stock * 0.5);

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

  // Calculate total shortage value (for summary)
  const totalShortage = alerts.reduce((sum, item) => sum + item.shortage, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="alerts-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="w-7 h-7 text-red-400" />
          Stock Alerts
        </h1>
        <p className="text-slate-400 mt-1">Items below par stock level - need reordering</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-red-600/10 border border-red-500/30">
          <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
          <p className="text-sm text-red-400">Total Alerts</p>
        </div>
        <div className="p-4 rounded-xl bg-red-600/20 border border-red-600/40">
          <Package className="w-6 h-6 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-400">{criticalAlerts.length}</p>
          <p className="text-sm text-red-500">Out of Stock</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
          <TrendingDown className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{lowStockAlerts.length}</p>
          <p className="text-sm text-amber-400">Low Stock</p>
        </div>
        <div className="p-4 rounded-xl bg-yellow-600/10 border border-yellow-500/30">
          <ShoppingCart className="w-6 h-6 text-yellow-400 mb-2" />
          <p className="text-2xl font-bold text-white">{totalShortage.toFixed(0)}</p>
          <p className="text-sm text-yellow-400">Units to Order</p>
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

      {/* No Alerts Message */}
      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-emerald-600/10 border border-emerald-500/30 rounded-xl">
          <Package className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
          <p className="text-emerald-400 font-medium">All stock levels are OK!</p>
          <p className="text-sm text-slate-400 mt-1">No items below par stock level</p>
        </div>
      ) : (
        /* Alert Cards */
        <div className="space-y-3">
          {/* Critical - Out of Stock */}
          {criticalAlerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-red-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Out of Stock ({criticalAlerts.length})
              </h3>
              {criticalAlerts.map((item) => (
                <AlertCard 
                  key={item.item_id} 
                  item={item} 
                  severity="critical"
                  onEdit={() => openEditDialog(item)}
                />
              ))}
            </div>
          )}

          {/* Low Stock */}
          {lowStockAlerts.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-medium text-amber-400 uppercase flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Low Stock ({lowStockAlerts.length})
              </h3>
              {lowStockAlerts.map((item) => (
                <AlertCard 
                  key={item.item_id} 
                  item={item} 
                  severity="low"
                  onEdit={() => openEditDialog(item)}
                />
              ))}
            </div>
          )}

          {/* Warning */}
          {warningAlerts.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-medium text-yellow-400 uppercase flex items-center gap-2">
                <Package className="w-4 h-4" />
                Below Par ({warningAlerts.length})
              </h3>
              {warningAlerts.map((item) => (
                <AlertCard 
                  key={item.item_id} 
                  item={item} 
                  severity="warning"
                  onEdit={() => openEditDialog(item)}
                />
              ))}
            </div>
          )}
        </div>
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
    </div>
  );
}

// Alert Card Component
function AlertCard({ item, severity, onEdit }) {
  const severityStyles = {
    critical: 'bg-red-600/10 border-red-500/40',
    low: 'bg-amber-600/10 border-amber-500/30',
    warning: 'bg-yellow-600/10 border-yellow-500/30'
  };

  const badgeStyles = {
    critical: 'bg-red-500/20 text-red-400',
    low: 'bg-amber-500/20 text-amber-400',
    warning: 'bg-yellow-500/20 text-yellow-400'
  };

  return (
    <div className={`p-4 rounded-xl border ${severityStyles[severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{item.item_name}</span>
            <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(item.category)}`}>
              {item.category}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm mt-2">
            <div>
              <span className="text-slate-400">Current: </span>
              <span className={`font-semibold ${severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                {item.current_stock} {item.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Par: </span>
              <span className="text-white font-medium">{item.par_stock}</span>
            </div>
            <div>
              <span className="text-slate-400">Need: </span>
              <span className="text-red-400 font-semibold">+{item.shortage}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeStyles[severity]}`}>
            {severity === 'critical' ? 'OUT' : severity === 'low' ? 'LOW' : 'BELOW PAR'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-slate-400 hover:text-white p-1 h-7 w-7"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
