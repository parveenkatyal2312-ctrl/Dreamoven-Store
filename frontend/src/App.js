import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { 
  Package, Store, Users, ShoppingCart, BarChart3, LogOut, Menu, X, 
  Plus, Search, Edit, Trash2, ChevronDown, ChevronRight, Box, Truck,
  FileText, Settings, Home, AlertCircle, Check, RefreshCw, Download,
  ClipboardList, PackageCheck, Send, Bell, QrCode, Calendar, TrendingUp,
  ArrowRight, ArrowDown, Save, Filter, Eye
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API Helper with auth
const api = {
  get: async (url) => {
    const token = localStorage.getItem('token');
    return axios.get(`${API}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
  post: async (url, data) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API}${url}`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
  put: async (url, data) => {
    const token = localStorage.getItem('token');
    return axios.put(`${API}${url}`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
  delete: async (url) => {
    const token = localStorage.getItem('token');
    return axios.delete(`${API}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }
};

// Login Component
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
            <Box className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-amber-500 tracking-tight">DREAMOVEN</h1>
          <p className="text-slate-400 mt-2">Inventory Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2" data-testid="login-error">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="Enter your email"
              required
              data-testid="login-email"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="Enter your password"
              required
              data-testid="login-password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold py-3 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
            data-testid="login-submit"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, user, onLogout, collapsed, setCollapsed, selectedKitchen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'auto-pos', label: 'Auto POs', icon: RefreshCw },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'grn', label: 'Receive (GRN)', icon: PackageCheck },
    { id: 'requisitions', label: 'Requisitions', icon: ClipboardList },
    { id: 'issue', label: 'Issue', icon: Send },
    { id: 'daily-perishables', label: 'Daily Perishables', icon: Calendar },
    { id: 'current-stock', label: 'Current Stock', icon: Package },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'inventory', label: 'Inventory', icon: Box, children: [
      { id: 'items', label: 'Items' },
      { id: 'vendors', label: 'Vendors' },
      { id: 'categories', label: 'Categories' },
      { id: 'kitchens', label: 'Kitchens' },
    ]},
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
  ];

  const [expandedMenus, setExpandedMenus] = useState(['inventory']);

  const toggleMenu = (id) => {
    setExpandedMenus(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300 h-screen`} data-testid="sidebar">
      <div className="p-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-amber-500 font-bold text-lg block">DREAMOVEN</span>
              <span className="text-slate-400 text-xs">{selectedKitchen?.name || 'Main Store'}</span>
            </div>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="w-full flex items-center justify-center text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all text-slate-400 hover:text-white hover:bg-slate-700/50`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.includes(item.id) ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {!collapsed && expandedMenus.includes(item.id) && (
                  <div className="ml-8 space-y-1 mt-1">
                    {item.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => setActiveTab(child.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          activeTab === child.id 
                            ? 'bg-amber-500/10 text-amber-500' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                        data-testid={`nav-${child.id}`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === item.id 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-5 h-5" />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </button>
            )}
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        {!collapsed && (
          <div className="mb-3 px-2">
            <p className="text-sm text-white font-medium">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ stats, onNavigate }) => {
  const statCards = [
    { label: 'Total Items', value: stats?.items_count || 0, icon: Package, color: 'from-blue-500 to-cyan-500' },
    { label: 'Vendors', value: stats?.vendors_count || 0, icon: Truck, color: 'from-green-500 to-emerald-500' },
    { label: 'Kitchens', value: stats?.kitchens_count || 0, icon: Store, color: 'from-amber-500 to-orange-500' },
    { label: 'Purchase Orders', value: stats?.purchase_orders_count || 0, icon: ShoppingCart, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="p-6" data-testid="dashboard">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6" data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">{stat.value}</span>
            </div>
            <p className="text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button onClick={() => onNavigate('auto-pos')} className="w-full text-left px-4 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              Generate Auto PO
            </button>
            <button onClick={() => onNavigate('requisitions')} className="w-full text-left px-4 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-green-500" />
              New Requisition
            </button>
            <button onClick={() => onNavigate('grn')} className="w-full text-left px-4 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 flex items-center gap-3">
              <PackageCheck className="w-5 h-5 text-blue-500" />
              Receive GRN
            </button>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pending Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pending POs</span>
              <span className="text-amber-500 font-bold">{stats?.pending_orders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pending Requisitions</span>
              <span className="text-green-500 font-bold">{stats?.pending_requisitions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Critical Alerts</span>
              <span className="text-red-500 font-bold">{stats?.critical_alerts || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total GRNs</span>
              <span className="text-blue-500 font-bold">{stats?.grn_count || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Requisitions</span>
              <span className="text-purple-500 font-bold">{stats?.requisition_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {stats?.critical_alerts > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500 font-medium">{stats.critical_alerts} critical stock alerts require attention</span>
            <button onClick={() => onNavigate('alerts')} className="ml-auto text-red-400 hover:text-red-300 text-sm">View Alerts →</button>
          </div>
        </div>
      )}
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Items by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.category_stats?.slice(0, 8).map((cat, idx) => (
            <div key={idx} className="bg-slate-700/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm">{cat.name}</p>
              <p className="text-xl font-bold text-white">{cat.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Current Stock Component
const CurrentStockPage = ({ kitchens, selectedKitchen, onRefresh }) => {
  const [stock, setStock] = useState([]);
  const [stockStats, setStockStats] = useState({ total_items: 0, today_grn_items: 0, below_par: 0, stock_ok: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [editedStock, setEditedStock] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadStock();
    loadStockStats();
    loadCategories();
  }, [selectedKitchen]);

  const loadStock = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/current-stock?kitchen_id=${selectedKitchen?.id || ''}`);
      setStock(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStockStats = async () => {
    try {
      const response = await api.get(`/current-stock/stats?kitchen_id=${selectedKitchen?.id || ''}`);
      setStockStats(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStockChange = (itemId, field, value) => {
    setEditedStock(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        item_id: itemId,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const saveStock = async () => {
    setSaving(true);
    try {
      const updates = Object.values(editedStock).map(item => ({
        item_id: item.item_id,
        current_stock: item.current_stock ?? stock.find(s => s.item_id === item.item_id)?.current_stock ?? 0,
        par_stock: item.par_stock ?? stock.find(s => s.item_id === item.item_id)?.par_stock ?? 0
      }));
      
      await api.post(`/current-stock/update?kitchen_id=${selectedKitchen?.id || ''}`, updates);
      setEditedStock({});
      loadStock();
      loadStockStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const syncStock = async () => {
    try {
      await api.post(`/current-stock/save-sync?kitchen_id=${selectedKitchen?.id || ''}`);
      alert('Stock synced successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStock = stock.filter(item => {
    const matchSearch = item.item_name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || item.category === category;
    const matchFilter = activeFilter === 'all' || 
      (activeFilter === 'below_par' && item.deficit < 0) ||
      (activeFilter === 'stock_ok' && item.deficit >= 0);
    return matchSearch && matchCategory && matchFilter;
  });

  const filterCounts = {
    all: stock.length,
    below_par: stock.filter(s => s.deficit < 0).length,
    stock_ok: stock.filter(s => s.deficit >= 0).length
  };

  return (
    <div className="p-6" data-testid="current-stock-page">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl font-bold text-white">Current Stock</h1>
          </div>
          <p className="text-slate-400">View stock levels and upload opening stock</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">
            <Download className="w-4 h-4" /> Upload Opening Stock
          </button>
          <button className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">
            <FileText className="w-4 h-4" /> Stock Ledger (7 Days)
          </button>
          <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
            <Download className="w-4 h-4" /> Export to Excel
          </button>
          <button className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors">
            <RefreshCw className="w-4 h-4" /> Update PAR Stock
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-3xl font-bold text-white">{stockStats.total_items}</p>
              <p className="text-slate-400 text-sm">Total Items</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-3xl font-bold text-blue-500">{stockStats.today_grn_items}</p>
              <p className="text-slate-400 text-sm">Today's GRN Items</p>
            </div>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-3xl font-bold text-red-500">{stockStats.below_par}</p>
              <p className="text-slate-400 text-sm">Below Par Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Check className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-3xl font-bold text-green-500">{stockStats.stock_ok}</p>
              <p className="text-slate-400 text-sm">Stock OK</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
        </select>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All', count: filterCounts.all },
          { id: 'below_par', label: 'Below Par', count: filterCounts.below_par },
          { id: 'stock_ok', label: 'Stock OK', count: filterCounts.stock_ok }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === tab.id
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
        
        {Object.keys(editedStock).length > 0 && (
          <button
            onClick={saveStock}
            disabled={saving}
            className="ml-auto flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
      
      {/* Stock Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-300 font-medium px-4 py-3">ITEM</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">CATEGORY</th>
              <th className="text-center text-slate-300 font-medium px-4 py-3">CURRENT</th>
              <th className="text-center text-slate-300 font-medium px-4 py-3">TODAY GRN</th>
              <th className="text-center text-slate-300 font-medium px-4 py-3">TOTAL</th>
              <th className="text-center text-slate-300 font-medium px-4 py-3">PAR STOCK</th>
              <th className="text-center text-slate-300 font-medium px-4 py-3">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : filteredStock.slice(0, 100).map(item => {
              const edited = editedStock[item.item_id] || {};
              const currentStock = edited.current_stock ?? item.current_stock;
              const parStock = edited.par_stock ?? item.par_stock;
              const total = currentStock + (item.today_grn || 0);
              const deficit = total - parStock;
              
              return (
                <tr key={item.item_id} className="border-t border-slate-700 hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{item.item_name}</span>
                    <span className="text-slate-500 text-xs ml-2">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        value={currentStock}
                        onChange={(e) => handleStockChange(item.item_id, 'current_stock', e.target.value)}
                        className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-slate-500 text-xs">{item.unit}</span>
                      <Edit className="w-3 h-3 text-amber-500 cursor-pointer" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400">
                    {item.today_grn > 0 ? item.today_grn : 'NIL'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-amber-500 font-medium">{total}</span>
                      <Edit className="w-3 h-3 text-amber-500 cursor-pointer" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        value={parStock}
                        onChange={(e) => handleStockChange(item.item_id, 'par_stock', e.target.value)}
                        className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-amber-500"
                      />
                      <Edit className="w-3 h-3 text-amber-500 cursor-pointer" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {deficit < 0 ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-red-500/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500" 
                            style={{ width: `${Math.min(100, Math.abs(deficit / parStock) * 100)}%` }}
                          />
                        </div>
                        <span className="text-red-500 text-sm flex items-center gap-1">
                          <ArrowDown className="w-3 h-3" />
                          {deficit}
                        </span>
                      </div>
                    ) : (
                      <span className="text-green-500">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredStock.length > 100 && (
          <div className="p-4 text-center text-slate-400">Showing 100 of {filteredStock.length} items</div>
        )}
      </div>
    </div>
  );
};

// Requisitions Component
const RequisitionsPage = ({ kitchens, items, onRefresh }) => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    loadRequisitions();
  }, []);

  const loadRequisitions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/requisitions');
      setRequisitions(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createRequisition = async () => {
    if (!selectedKitchen || selectedItems.length === 0) return;
    
    try {
      await api.post('/requisitions', {
        kitchen_id: selectedKitchen,
        items: selectedItems.map(i => ({ item_id: i.item_id, quantity: i.quantity }))
      });
      setShowModal(false);
      setSelectedKitchen("");
      setSelectedItems([]);
      loadRequisitions();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (reqId, status) => {
    try {
      await api.put(`/requisitions/${reqId}/status?status=${status}`);
      loadRequisitions();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    approved: 'bg-blue-500/20 text-blue-500',
    issued: 'bg-green-500/20 text-green-500',
    cancelled: 'bg-red-500/20 text-red-500'
  };

  return (
    <div className="p-6" data-testid="requisitions-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Requisitions</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Requisition
        </button>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Req Number</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Kitchen</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Items</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Status</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Created By</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : requisitions.map(req => (
              <tr key={req.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-white font-mono">{req.requisition_number}</td>
                <td className="px-4 py-3 text-slate-400">{req.kitchen_name}</td>
                <td className="px-4 py-3 text-slate-400">{req.total_items} items</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{req.created_by}</td>
                <td className="px-4 py-3">
                  <select
                    value={req.status}
                    onChange={(e) => updateStatus(req.id, e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="issued">Issued</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requisitions.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-400">No requisitions yet</div>
        )}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">New Requisition</h2>
            
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">Kitchen</label>
              <select
                value={selectedKitchen}
                onChange={(e) => setSelectedKitchen(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="">Select Kitchen</option>
                {kitchens.filter(k => !k.is_main_store).map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">Add Items</label>
              <div className="max-h-60 overflow-y-auto border border-slate-600 rounded-lg">
                {items.slice(0, 50).map(item => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 border-b border-slate-700 last:border-0">
                    <span className="text-slate-300">{item.name}</span>
                    <input
                      type="number"
                      placeholder="Qty"
                      className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-center"
                      onChange={(e) => {
                        const qty = parseFloat(e.target.value) || 0;
                        if (qty > 0) {
                          setSelectedItems(prev => {
                            const existing = prev.find(i => i.item_id === item.id);
                            if (existing) {
                              return prev.map(i => i.item_id === item.id ? {...i, quantity: qty} : i);
                            }
                            return [...prev, { item_id: item.id, quantity: qty }];
                          });
                        } else {
                          setSelectedItems(prev => prev.filter(i => i.item_id !== item.id));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={createRequisition} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600">
                Create Requisition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// GRN Component
const GRNPage = ({ onRefresh }) => {
  const [grns, setGRNs] = useState([]);
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [grnsRes, posRes] = await Promise.all([
        api.get('/grns'),
        api.get('/purchase-orders?status=approved')
      ]);
      setGRNs(grnsRes.data);
      setPOs(posRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createGRN = async () => {
    if (!selectedPO) return;
    
    try {
      const items = selectedPO.items.map(item => ({
        item_id: item.item_id,
        ordered_qty: item.quantity,
        received_qty: item.quantity,
        unit_price: item.unit_price
      }));
      
      await api.post('/grns', {
        po_id: selectedPO.id,
        items: items
      });
      setShowModal(false);
      setSelectedPO(null);
      loadData();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6" data-testid="grn-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Receive (GRN)</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          disabled={pos.length === 0}
        >
          <Plus className="w-4 h-4" /> New GRN
        </button>
      </div>
      
      {pos.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <PackageCheck className="w-5 h-5 text-blue-500" />
            <span className="text-blue-500">{pos.length} approved POs ready for receiving</span>
          </div>
        </div>
      )}
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-300 font-medium px-4 py-3">GRN Number</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">PO Number</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Vendor</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Total</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Received By</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : grns.map(grn => (
              <tr key={grn.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-white font-mono">{grn.grn_number}</td>
                <td className="px-4 py-3 text-slate-400">{grn.po_number}</td>
                <td className="px-4 py-3 text-slate-400">{grn.vendor_name}</td>
                <td className="px-4 py-3 text-green-500 font-medium">₹{grn.total_amount?.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-400">{grn.received_by}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(grn.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {grns.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-400">No GRNs yet</div>
        )}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Receive Goods (GRN)</h2>
            
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">Select Purchase Order</label>
              <select
                value={selectedPO?.id || ""}
                onChange={(e) => setSelectedPO(pos.find(p => p.id === e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="">Select PO</option>
                {pos.map(po => (
                  <option key={po.id} value={po.id}>{po.po_number} - {po.vendor_name} (₹{po.total_amount?.toFixed(2)})</option>
                ))}
              </select>
            </div>
            
            {selectedPO && (
              <div className="mb-4">
                <h3 className="text-slate-300 text-sm mb-2">Items to Receive</h3>
                <div className="max-h-60 overflow-y-auto border border-slate-600 rounded-lg">
                  {selectedPO.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 border-b border-slate-700 last:border-0">
                      <span className="text-slate-300">{item.item_name}</span>
                      <span className="text-amber-500">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-green-500 font-bold">
                  Total: ₹{selectedPO.total_amount?.toFixed(2)}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => { setShowModal(false); setSelectedPO(null); }} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={createGRN} disabled={!selectedPO} className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50">
                Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Issue Page Component
const IssuePage = ({ kitchens, items, onRefresh }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const response = await api.get('/issues');
      setIssues(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createIssue = async () => {
    if (!selectedKitchen || selectedItems.length === 0) return;
    
    try {
      await api.post('/issues', {
        kitchen_id: selectedKitchen,
        items: selectedItems.map(i => ({ item_id: i.item_id, quantity: i.quantity }))
      });
      setShowModal(false);
      setSelectedKitchen("");
      setSelectedItems([]);
      loadIssues();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6" data-testid="issue-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Issue Items</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Issue
        </button>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Issue Number</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">To Kitchen</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Items</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Status</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Issued By</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : issues.map(issue => (
              <tr key={issue.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-white font-mono">{issue.issue_number}</td>
                <td className="px-4 py-3 text-slate-400">{issue.kitchen_name}</td>
                <td className="px-4 py-3 text-slate-400">{issue.total_items} items</td>
                <td className="px-4 py-3">
                  <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs">{issue.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">{issue.issued_by}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(issue.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {issues.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-400">No issues yet</div>
        )}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Issue Items to Kitchen</h2>
            
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">To Kitchen</label>
              <select
                value={selectedKitchen}
                onChange={(e) => setSelectedKitchen(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="">Select Kitchen</option>
                {kitchens.filter(k => !k.is_main_store).map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">Items to Issue</label>
              <div className="max-h-60 overflow-y-auto border border-slate-600 rounded-lg">
                {items.slice(0, 50).map(item => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 border-b border-slate-700 last:border-0">
                    <span className="text-slate-300">{item.name}</span>
                    <input
                      type="number"
                      placeholder="Qty"
                      className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-center"
                      onChange={(e) => {
                        const qty = parseFloat(e.target.value) || 0;
                        if (qty > 0) {
                          setSelectedItems(prev => {
                            const existing = prev.find(i => i.item_id === item.id);
                            if (existing) {
                              return prev.map(i => i.item_id === item.id ? {...i, quantity: qty} : i);
                            }
                            return [...prev, { item_id: item.id, quantity: qty }];
                          });
                        } else {
                          setSelectedItems(prev => prev.filter(i => i.item_id !== item.id));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={createIssue} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600">
                Issue Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Daily Perishables Component
const DailyPerishablesPage = ({ kitchens, items, vendors, selectedKitchen, onRefresh }) => {
  const [perishables, setPerishables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ item_id: "", quantity: "", vendor_id: "", rate: "" });

  useEffect(() => {
    loadPerishables();
  }, [selectedKitchen]);

  const loadPerishables = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/daily-perishables?kitchen_id=${selectedKitchen?.id || ''}`);
      setPerishables(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPerishable = async () => {
    if (!formData.item_id || !formData.quantity) return;
    
    try {
      await api.post(`/daily-perishables?kitchen_id=${selectedKitchen?.id || ''}`, {
        item_id: formData.item_id,
        quantity: parseFloat(formData.quantity),
        vendor_id: formData.vendor_id || null,
        rate: formData.rate ? parseFloat(formData.rate) : null
      });
      setShowModal(false);
      setFormData({ item_id: "", quantity: "", vendor_id: "", rate: "" });
      loadPerishables();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const totalValue = perishables.reduce((sum, p) => sum + (p.total_value || 0), 0);

  return (
    <div className="p-6" data-testid="daily-perishables-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Perishables</h1>
          <p className="text-slate-400">Today: {new Date().toLocaleDateString()}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>
      
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-green-500">Today's Total Value</span>
          <span className="text-2xl font-bold text-green-500">₹{totalValue.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Item</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Category</th>
              <th className="text-center text-slate-300 font-medium px-4 py-3">Quantity</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Vendor</th>
              <th className="text-right text-slate-300 font-medium px-4 py-3">Rate</th>
              <th className="text-right text-slate-300 font-medium px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : perishables.map(p => (
              <tr key={p.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-white">{p.item_name}</td>
                <td className="px-4 py-3">
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">{p.category}</span>
                </td>
                <td className="px-4 py-3 text-center text-amber-500">{p.quantity} {p.unit}</td>
                <td className="px-4 py-3 text-slate-400">{p.vendor_name || '-'}</td>
                <td className="px-4 py-3 text-right text-slate-400">₹{p.rate?.toFixed(2) || '-'}</td>
                <td className="px-4 py-3 text-right text-green-500 font-medium">₹{p.total_value?.toFixed(2) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {perishables.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-400">No entries for today</div>
        )}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Daily Perishable</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Item</label>
                <select
                  value={formData.item_id}
                  onChange={(e) => setFormData({...formData, item_id: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select Item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                    placeholder="Qty"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Rate</label>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({...formData, rate: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm mb-2">Vendor</label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select Vendor (Optional)</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={createPerishable} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600">
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Alerts Component
const AlertsPage = ({ selectedKitchen }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [selectedKitchen]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/alerts?kitchen_id=${selectedKitchen?.id || ''}`);
      setAlerts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    critical: 'bg-red-500/20 border-red-500/30 text-red-500',
    high: 'bg-orange-500/20 border-orange-500/30 text-orange-500',
    medium: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500',
    low: 'bg-blue-500/20 border-blue-500/30 text-blue-500'
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="p-6" data-testid="alerts-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <button onClick={loadAlerts} className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-3xl font-bold text-red-500">{criticalCount}</p>
              <p className="text-slate-400">Critical</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-3xl font-bold text-orange-500">{highCount}</p>
              <p className="text-slate-400">High Priority</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-3xl font-bold text-white">{alerts.length}</p>
              <p className="text-slate-400">Total Alerts</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-500 font-medium">All stock levels are healthy!</p>
          </div>
        ) : alerts.map(alert => (
          <div key={alert.id} className={`border rounded-xl p-4 ${severityColors[alert.severity]}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm opacity-80">Current: {alert.current_stock} | Par: {alert.par_stock}</p>
                </div>
              </div>
              <span className="text-xs uppercase font-bold">{alert.severity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Reports Component
const ReportsPage = ({ vendors }) => {
  const [activeReport, setActiveReport] = useState('vendor-ledger');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ vendor_id: '', start_date: '', end_date: '' });

  const reportTabs = [
    { id: 'vendor-ledger', label: 'Vendor Ledger' },
    { id: 'kitchen-ledger', label: 'Kitchen Ledger' },
    { id: 'daywise', label: 'Daywise Reports' },
    { id: 'stock-in-hand', label: 'Stock in Hand Main Store' },
    { id: 'consumption', label: 'Consumption Analysis' },
  ];

  const loadReport = async () => {
    setLoading(true);
    try {
      let url = `/reports/${activeReport}`;
      const params = new URLSearchParams();
      if (filters.vendor_id) params.append('vendor_id', filters.vendor_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await api.get(url);
      setReportData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  return (
    <div className="p-6" data-testid="reports-page">
      <h1 className="text-2xl font-bold text-white mb-2">Reports</h1>
      <p className="text-slate-400 mb-6">Inventory reports, ledgers and analytics</p>
      
      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeReport === tab.id
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {activeReport === 'vendor-ledger' && (
          <select
            value={filters.vendor_id}
            onChange={(e) => setFilters({...filters, vendor_id: e.target.value})}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters({...filters, start_date: e.target.value})}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          placeholder="Start Date"
        />
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters({...filters, end_date: e.target.value})}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          placeholder="End Date"
        />
        <button
          onClick={loadReport}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
        >
          Generate Report
        </button>
        <button className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 flex items-center gap-2">
          <Download className="w-4 h-4" /> Excel
        </button>
      </div>
      
      {/* Report Content */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading report...</div>
      ) : activeReport === 'vendor-ledger' && reportData?.summary && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-3xl font-bold text-white">{reportData.summary.total_vendors}</p>
              <p className="text-slate-400">Vendors</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-3xl font-bold text-blue-500">{reportData.summary.total_pos}</p>
              <p className="text-slate-400">Main Store POs</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-3xl font-bold text-amber-500">₹{(reportData.summary.total_po_value || 0).toLocaleString()}</p>
              <p className="text-slate-400">Main Store PO Value</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-3xl font-bold text-green-500">{reportData.summary.total_grns}</p>
              <p className="text-slate-400">Main Store GRNs</p>
            </div>
          </div>
          
          {/* Vendor List */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-300 font-medium px-4 py-3">Vendor</th>
                  <th className="text-center text-slate-300 font-medium px-4 py-3">POs</th>
                  <th className="text-right text-slate-300 font-medium px-4 py-3">PO Value</th>
                  <th className="text-center text-slate-300 font-medium px-4 py-3">GRNs</th>
                  <th className="text-right text-slate-300 font-medium px-4 py-3">GRN Value</th>
                </tr>
              </thead>
              <tbody>
                {reportData.vendors?.map(vendor => (
                  <tr key={vendor.vendor_id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white">{vendor.vendor_name}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{vendor.po_count}</td>
                    <td className="px-4 py-3 text-right text-amber-500">₹{vendor.po_value?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{vendor.grn_count}</td>
                    <td className="px-4 py-3 text-right text-green-500">₹{vendor.grn_value?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {activeReport === 'stock-in-hand' && reportData && (
        <>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
            <p className="text-green-500">Total Stock Value: <span className="text-2xl font-bold">₹{(reportData.total_value || 0).toLocaleString()}</span></p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left text-slate-300 font-medium px-4 py-3">Item</th>
                  <th className="text-left text-slate-300 font-medium px-4 py-3">Category</th>
                  <th className="text-center text-slate-300 font-medium px-4 py-3">Stock</th>
                  <th className="text-right text-slate-300 font-medium px-4 py-3">Price</th>
                  <th className="text-right text-slate-300 font-medium px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {reportData.items?.slice(0, 50).map(item => (
                  <tr key={item.item_id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white">{item.item_name}</td>
                    <td className="px-4 py-3 text-slate-400">{item.category}</td>
                    <td className="px-4 py-3 text-center text-amber-500">{item.current_stock} {item.unit}</td>
                    <td className="px-4 py-3 text-right text-slate-400">₹{item.standard_price?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-500">₹{item.stock_value?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// Users Component
const UsersPage = ({ kitchens }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user', kitchen_id: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      await api.post('/users', formData);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'user', kitchen_id: '' });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/users/${userId}`);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6" data-testid="users-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Name</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Email</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Role</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Kitchen</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8 text-slate-400">Loading...</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-white">{user.name}</td>
                <td className="px-4 py-3 text-slate-400">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-600 text-slate-300'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{user.kitchen_name || '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteUser(user.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add User</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
              <select
                value={formData.kitchen_id}
                onChange={(e) => setFormData({...formData, kitchen_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="">No Kitchen (Admin)</option>
                {kitchens.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">Cancel</button>
              <button onClick={createUser} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Pages
const ItemsPage = ({ items, categories, onRefresh }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white mb-6">Items ({items.length})</h1>
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-700/50">
          <tr>
            <th className="text-left text-slate-300 font-medium px-4 py-3">Name</th>
            <th className="text-left text-slate-300 font-medium px-4 py-3">Category</th>
            <th className="text-left text-slate-300 font-medium px-4 py-3">Unit</th>
            <th className="text-left text-slate-300 font-medium px-4 py-3">Price</th>
            <th className="text-left text-slate-300 font-medium px-4 py-3">Vendor</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 50).map(item => (
            <tr key={item.id} className="border-t border-slate-700">
              <td className="px-4 py-3 text-white">{item.name}</td>
              <td className="px-4 py-3 text-slate-400">{item.category}</td>
              <td className="px-4 py-3 text-slate-400">{item.unit}</td>
              <td className="px-4 py-3 text-slate-400">{item.standard_price ? `₹${item.standard_price}` : '-'}</td>
              <td className="px-4 py-3 text-slate-400">{item.vendor || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const VendorsPage = ({ vendors }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white mb-6">Vendors ({vendors.length})</h1>
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-700/50">
          <tr>
            <th className="text-left text-slate-300 font-medium px-4 py-3">Name</th>
            <th className="text-left text-slate-300 font-medium px-4 py-3">Phone</th>
            <th className="text-left text-slate-300 font-medium px-4 py-3">Categories</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map(vendor => (
            <tr key={vendor.id} className="border-t border-slate-700">
              <td className="px-4 py-3 text-white">{vendor.name}</td>
              <td className="px-4 py-3 text-slate-400">{vendor.phone || '-'}</td>
              <td className="px-4 py-3 text-slate-400">{vendor.supply_categories?.join(', ') || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const KitchensPage = ({ kitchens }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white mb-6">Kitchens ({kitchens.length})</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kitchens.map(kitchen => (
        <div key={kitchen.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-white font-medium">{kitchen.name}</h3>
            {kitchen.is_main_store && <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-1 rounded">Main</span>}
          </div>
          <p className="text-slate-500 text-sm">{kitchen.code}</p>
        </div>
      ))}
    </div>
  </div>
);

const CategoriesPage = ({ categories }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white mb-6">Categories ({categories.length})</h1>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map(cat => (
        <div key={cat.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-medium">{cat.name}</h3>
        </div>
      ))}
    </div>
  </div>
);

const PurchaseOrdersPage = ({ onRefresh, vendors }) => {
  const [pos, setPOs] = useState([]);
  const [stats, setStats] = useState({ pending: 0, partial: 0, received: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadPOs();
    loadStats();
  }, []);

  const loadPOs = async () => {
    try {
      const response = await api.get('/purchase-orders');
      setPOs(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/purchase-orders/stats/summary');
      setStats(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (poId, status) => {
    try {
      await api.put(`/purchase-orders/${poId}/status?status=${status}`);
      loadPOs();
      loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  const deletePO = async (poId) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await api.delete(`/purchase-orders/${poId}`);
      loadPOs();
      loadStats();
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete PO');
    }
  };

  const viewPO = async (po) => {
    try {
      const response = await api.get(`/purchase-orders/${po.id}`);
      setSelectedPO(response.data);
      setShowModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPOs = pos.filter(po => {
    const matchStatus = activeFilter === 'all' || po.status === activeFilter;
    const matchVendor = !selectedVendor || po.vendor_id === selectedVendor;
    return matchStatus && matchVendor;
  });

  const statusCounts = {
    pending: pos.filter(p => p.status === 'pending').length,
    partial: pos.filter(p => p.status === 'partial').length,
    received: pos.filter(p => p.status === 'received').length,
    all: pos.length
  };

  return (
    <div className="p-6" data-testid="purchase-orders-page">
      <h1 className="text-2xl font-bold text-white mb-6">Purchase Orders</h1>
      
      {/* Vendor Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-700">
        {vendors?.slice(0, 20).map(v => (
          <button
            key={v.id}
            onClick={() => setSelectedVendor(selectedVendor === v.id ? '' : v.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedVendor === v.id
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>
      
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-slate-400 text-sm">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-3xl font-bold text-orange-500">{stats.partial}</p>
              <p className="text-slate-400 text-sm">Partial</p>
            </div>
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Check className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-3xl font-bold text-green-500">{stats.received}</p>
              <p className="text-slate-400 text-sm">Received</p>
            </div>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <X className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-3xl font-bold text-red-500">{stats.cancelled}</p>
              <p className="text-slate-400 text-sm">Cancelled</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'pending', label: 'Pending', count: statusCounts.pending },
          { id: 'partial', label: 'Partial', count: statusCounts.partial },
          { id: 'received', label: 'Received', count: statusCounts.received },
          { id: 'all', label: 'All', count: statusCounts.all }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === tab.id
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      
      {/* PO List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : filteredPOs.map(po => (
          <div key={po.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-mono font-bold text-lg">{po.po_number}</h3>
                <p className="text-slate-400">{po.vendor_name}</p>
                <p className="text-amber-500 text-sm">Raised by: {po.created_by || 'Admin'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  po.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                  po.status === 'partial' ? 'bg-orange-500/20 text-orange-500' :
                  po.status === 'received' ? 'bg-green-500/20 text-green-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {po.status === 'pending' && <RefreshCw className="w-3 h-3" />}
                  {po.status === 'received' && <Check className="w-3 h-3" />}
                  {po.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-bold text-xl">₹{po.total_amount?.toFixed(2)}</span>
                <span className="text-slate-500 text-sm">{new Date(po.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => viewPO(po)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm">
                  <Send className="w-4 h-4" /> Email
                </button>
                {po.status !== 'received' && (
                  <button
                    onClick={() => deletePO(po.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredPOs.length === 0 && !loading && (
          <div className="text-center py-8 text-slate-400">No purchase orders found</div>
        )}
      </div>
      
      {/* PO Detail Modal */}
      {showModal && selectedPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-bold text-white">{selectedPO.po_number}</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Vendor</p>
                  <p className="text-white font-bold text-lg">{selectedPO.vendor_name}</p>
                </div>
                
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">PO Raised By</p>
                  <p className="text-amber-500 font-medium">{selectedPO.created_by || 'Admin'}</p>
                </div>
              </div>
              
              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Items</h3>
                <div className="bg-slate-700/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="text-left text-slate-300 text-sm font-medium px-4 py-2">Item</th>
                        <th className="text-center text-slate-300 text-sm font-medium px-4 py-2">Ordered</th>
                        <th className="text-center text-slate-300 text-sm font-medium px-4 py-2">Received</th>
                        <th className="text-center text-slate-300 text-sm font-medium px-4 py-2">Short</th>
                        <th className="text-right text-slate-300 text-sm font-medium px-4 py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPO.items?.map((item, idx) => {
                        const grnItem = selectedPO.grn?.items?.find(g => g.item_id === item.item_id);
                        const received = grnItem?.received_qty || 0;
                        const short = item.quantity - received;
                        return (
                          <tr key={idx} className="border-t border-slate-600">
                            <td className="px-4 py-2">
                              <span className="text-white">{item.item_name}</span>
                              <span className="text-slate-500 text-xs ml-1">{item.unit}</span>
                            </td>
                            <td className="px-4 py-2 text-center text-slate-300">{item.quantity}</td>
                            <td className="px-4 py-2 text-center text-amber-500">{received}</td>
                            <td className="px-4 py-2 text-center text-red-400">{short > 0 ? short : 0}</td>
                            <td className="px-4 py-2 text-right text-amber-500">₹{item.total?.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end mt-3">
                  <div className="text-right">
                    <span className="text-slate-400">Total: </span>
                    <span className="text-amber-500 font-bold text-xl">₹{selectedPO.total_amount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* PO Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-slate-400 text-sm">Created</p>
                  <p className="text-white">{new Date(selectedPO.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Delivery Date</p>
                  <p className="text-white">{selectedPO.delivery_date || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Payment Terms</p>
                  <p className="text-white">{selectedPO.payment_terms || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedPO.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    selectedPO.status === 'received' ? 'bg-green-500/20 text-green-500' :
                    'bg-slate-700 text-slate-300'
                  }`}>{selectedPO.status?.toUpperCase()}</span>
                </div>
              </div>
              
              {/* GRN Verification Section */}
              {selectedPO.grn && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PackageCheck className="w-5 h-5 text-blue-500" />
                    <span className="text-blue-500 font-medium">GRN Verification</span>
                    {selectedPO.grn.photos && (
                      <span className="text-slate-400 text-sm">{selectedPO.grn.photos?.length || 0} photos</span>
                    )}
                  </div>
                  
                  {selectedPO.grn.photos && selectedPO.grn.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {selectedPO.grn.photos.map((photo, idx) => (
                        <div key={idx} className="aspect-square bg-slate-700 rounded-lg overflow-hidden">
                          <img src={photo} alt={`GRN ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Invoice #:</p>
                      <p className="text-white">{selectedPO.grn.invoice_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">GRN Date:</p>
                      <p className="text-white">{selectedPO.grn.created_at ? new Date(selectedPO.grn.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                  Close
                </button>
                {selectedPO.status !== 'received' && (
                  <button
                    onClick={() => { updateStatus(selectedPO.id, 'received'); setShowModal(false); }}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                  >
                    Mark as Received
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AutoPOsPage = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-white mb-6">Auto POs</h1>
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
      <RefreshCw className="w-16 h-16 text-amber-500 mx-auto mb-4" />
      <p className="text-slate-400">Auto PO generation based on stock levels below par</p>
      <button className="mt-4 bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600">
        Generate Auto POs
      </button>
    </div>
  </div>
);

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedKitchen, setSelectedKitchen] = useState(null);
  
  // Data states
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, itemsRes, kitchensRes, vendorsRes, categoriesRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: {} })),
        api.get('/items').catch(() => ({ data: [] })),
        api.get('/kitchens').catch(() => ({ data: [] })),
        api.get('/vendors').catch(() => ({ data: [] })),
        api.get('/categories').catch(() => ({ data: [] }))
      ]);
      
      setStats(statsRes.data);
      setItems(itemsRes.data);
      setKitchens(kitchensRes.data);
      setVendors(vendorsRes.data);
      setCategories(categoriesRes.data);
      
      // Set main store as default kitchen
      const mainStore = kitchensRes.data.find(k => k.is_main_store);
      if (mainStore) setSelectedKitchen(mainStore);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-amber-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex" data-testid="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        selectedKitchen={selectedKitchen}
      />
      
      <main className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && <Dashboard stats={stats} onNavigate={setActiveTab} />}
        {activeTab === 'current-stock' && <CurrentStockPage kitchens={kitchens} selectedKitchen={selectedKitchen} onRefresh={loadData} />}
        {activeTab === 'requisitions' && <RequisitionsPage kitchens={kitchens} items={items} onRefresh={loadData} />}
        {activeTab === 'grn' && <GRNPage onRefresh={loadData} />}
        {activeTab === 'issue' && <IssuePage kitchens={kitchens} items={items} onRefresh={loadData} />}
        {activeTab === 'daily-perishables' && <DailyPerishablesPage kitchens={kitchens} items={items} vendors={vendors} selectedKitchen={selectedKitchen} onRefresh={loadData} />}
        {activeTab === 'alerts' && <AlertsPage selectedKitchen={selectedKitchen} />}
        {activeTab === 'reports' && <ReportsPage vendors={vendors} />}
        {activeTab === 'users' && <UsersPage kitchens={kitchens} />}
        {activeTab === 'items' && <ItemsPage items={items} categories={categories} onRefresh={loadData} />}
        {activeTab === 'vendors' && <VendorsPage vendors={vendors} />}
        {activeTab === 'kitchens' && <KitchensPage kitchens={kitchens} />}
        {activeTab === 'categories' && <CategoriesPage categories={categories} />}
        {activeTab === 'purchase-orders' && <PurchaseOrdersPage onRefresh={loadData} vendors={vendors} />}
        {activeTab === 'auto-pos' && <AutoPOsPage />}
      </main>
    </div>
  );
}

export default App;
