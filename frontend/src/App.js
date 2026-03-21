import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { 
  Package, Store, Users, ShoppingCart, BarChart3, LogOut, Menu, X, 
  Plus, Search, Edit, Trash2, ChevronDown, ChevronRight, Box, Truck,
  FileText, Settings, Home, AlertCircle, Check
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
        
        <p className="text-center text-slate-500 text-sm mt-6">DREAMOVEN Inventory Management System</p>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, user, onLogout, collapsed, setCollapsed }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'kitchens', label: 'Kitchens', icon: Store },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'categories', label: 'Categories', icon: FileText },
  ];

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300`} data-testid="sidebar">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-amber-500 font-bold text-lg">DREAMOVEN</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white p-2">
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            data-testid={`nav-${item.id}`}
          >
            <item.icon className="w-5 h-5" />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        {!collapsed && (
          <div className="mb-3 px-4">
            <p className="text-sm text-slate-400">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ stats }) => {
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
      
      {stats?.pending_orders > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-amber-500 font-medium">{stats.pending_orders} pending purchase orders require attention</span>
          </div>
        </div>
      )}
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Items by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.category_stats?.map((cat, idx) => (
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

// Items Component
const ItemsPage = ({ items, categories, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", category: "", unit: "PCS", vendor: "", standard_price: "", hsn_code: "", gst_rate: "" });
  const [loading, setLoading] = useState(false);

  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        standard_price: formData.standard_price ? parseFloat(formData.standard_price) : null,
        gst_rate: formData.gst_rate ? parseFloat(formData.gst_rate) : 0
      };
      if (editItem) {
        await api.put(`/items/${editItem.id}`, data);
      } else {
        await api.post('/items', data);
      }
      setShowModal(false);
      setEditItem(null);
      setFormData({ name: "", category: "", unit: "PCS", vendor: "", standard_price: "", hsn_code: "", gst_rate: "" });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/items/${id}`);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6" data-testid="items-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Items ({items.length})</h1>
        <button
          onClick={() => { setEditItem(null); setFormData({ name: "", category: categories[0]?.name || "", unit: "PCS", vendor: "", standard_price: "", hsn_code: "", gst_rate: "" }); setShowModal(true); }}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          data-testid="add-item-btn"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>
      
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            data-testid="search-items"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
          data-testid="filter-category"
        >
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
        </select>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Name</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Category</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Unit</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Price</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Vendor</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.slice(0, 50).map(item => (
              <tr key={item.id} className="border-t border-slate-700 hover:bg-slate-700/30" data-testid={`item-row-${item.id}`}>
                <td className="px-4 py-3 text-white">{item.name}</td>
                <td className="px-4 py-3 text-slate-400">{item.category}</td>
                <td className="px-4 py-3 text-slate-400">{item.unit}</td>
                <td className="px-4 py-3 text-slate-400">{item.standard_price ? `₹${item.standard_price.toFixed(2)}` : '-'}</td>
                <td className="px-4 py-3 text-slate-400">{item.vendor || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditItem(item); setFormData(item); setShowModal(true); }} className="text-slate-400 hover:text-amber-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length > 50 && (
          <div className="p-4 text-center text-slate-400">Showing 50 of {filteredItems.length} items</div>
        )}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="item-modal">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">{editItem ? 'Edit Item' : 'Add Item'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Item Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                required
                data-testid="item-name-input"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                required
                data-testid="item-category-input"
              >
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Unit (PCS, KG, etc)"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  data-testid="item-unit-input"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={formData.standard_price || ""}
                  onChange={(e) => setFormData({...formData, standard_price: e.target.value})}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  data-testid="item-price-input"
                />
              </div>
              <input
                type="text"
                placeholder="Vendor"
                value={formData.vendor || ""}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                data-testid="item-vendor-input"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="HSN Code"
                  value={formData.hsn_code || ""}
                  onChange={(e) => setFormData({...formData, hsn_code: e.target.value})}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="GST Rate %"
                  value={formData.gst_rate || ""}
                  onChange={(e) => setFormData({...formData, gst_rate: e.target.value})}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50" data-testid="item-save-btn">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Kitchens Component
const KitchensPage = ({ kitchens, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editKitchen, setEditKitchen] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", address: "", is_main_store: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editKitchen) {
        await api.put(`/kitchens/${editKitchen.id}`, formData);
      } else {
        await api.post('/kitchens', formData);
      }
      setShowModal(false);
      setEditKitchen(null);
      setFormData({ name: "", code: "", address: "", is_main_store: false });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this kitchen?')) {
      try {
        await api.delete(`/kitchens/${id}`);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6" data-testid="kitchens-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Kitchens ({kitchens.length})</h1>
        <button
          onClick={() => { setEditKitchen(null); setFormData({ name: "", code: "", address: "", is_main_store: false }); setShowModal(true); }}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          data-testid="add-kitchen-btn"
        >
          <Plus className="w-4 h-4" /> Add Kitchen
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kitchens.map(kitchen => (
          <div key={kitchen.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4" data-testid={`kitchen-card-${kitchen.id}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{kitchen.name}</h3>
                <p className="text-sm text-slate-400">{kitchen.code}</p>
              </div>
              {kitchen.is_main_store && (
                <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-1 rounded">Main Store</span>
              )}
            </div>
            {kitchen.address && <p className="text-sm text-slate-500 mb-3">{kitchen.address}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setEditKitchen(kitchen); setFormData(kitchen); setShowModal(true); }} className="text-slate-400 hover:text-amber-500">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(kitchen.id)} className="text-slate-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="kitchen-modal">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">{editKitchen ? 'Edit Kitchen' : 'Add Kitchen'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Kitchen Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                required
                data-testid="kitchen-name-input"
              />
              <input
                type="text"
                placeholder="Code (e.g., MAIN, SRPB)"
                value={formData.code || ""}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                data-testid="kitchen-code-input"
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address || ""}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.is_main_store}
                  onChange={(e) => setFormData({...formData, is_main_store: e.target.checked})}
                  className="w-4 h-4"
                />
                Main Store
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50" data-testid="kitchen-save-btn">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Vendors Component
const VendorsPage = ({ vendors, categories, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [formData, setFormData] = useState({ name: "", contact: "", email: "", phone: "", address: "", gst_number: "", payment_terms: "", supply_categories: [] });
  const [loading, setLoading] = useState(false);

  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editVendor) {
        await api.put(`/vendors/${editVendor.id}`, formData);
      } else {
        await api.post('/vendors', formData);
      }
      setShowModal(false);
      setEditVendor(null);
      setFormData({ name: "", contact: "", email: "", phone: "", address: "", gst_number: "", payment_terms: "", supply_categories: [] });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await api.delete(`/vendors/${id}`);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6" data-testid="vendors-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Vendors ({vendors.length})</h1>
        <button
          onClick={() => { setEditVendor(null); setFormData({ name: "", contact: "", email: "", phone: "", address: "", gst_number: "", payment_terms: "", supply_categories: [] }); setShowModal(true); }}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          data-testid="add-vendor-btn"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            data-testid="search-vendors"
          />
        </div>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Name</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Phone</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">GST Number</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Categories</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map(vendor => (
              <tr key={vendor.id} className="border-t border-slate-700 hover:bg-slate-700/30" data-testid={`vendor-row-${vendor.id}`}>
                <td className="px-4 py-3 text-white">{vendor.name}</td>
                <td className="px-4 py-3 text-slate-400">{vendor.phone || '-'}</td>
                <td className="px-4 py-3 text-slate-400">{vendor.gst_number || '-'}</td>
                <td className="px-4 py-3 text-slate-400">{vendor.supply_categories?.slice(0, 2).join(', ') || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditVendor(vendor); setFormData(vendor); setShowModal(true); }} className="text-slate-400 hover:text-amber-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(vendor.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="vendor-modal">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">{editVendor ? 'Edit Vendor' : 'Add Vendor'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Vendor Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                required
                data-testid="vendor-name-input"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={formData.contact || ""}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email || ""}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address || ""}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="GST Number"
                  value={formData.gst_number || ""}
                  onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Payment Terms"
                  value={formData.payment_terms || ""}
                  onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50" data-testid="vendor-save-btn">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Purchase Orders Component
const PurchaseOrdersPage = ({ purchaseOrders, vendors, kitchens, items, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ vendor_id: "", kitchen_id: "", items: [], notes: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/purchase-orders', formData);
      setShowModal(false);
      setFormData({ vendor_id: "", kitchen_id: "", items: [], notes: "" });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (poId, status) => {
    try {
      await api.put(`/purchase-orders/${poId}/status?status=${status}`);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    approved: 'bg-blue-500/20 text-blue-500',
    received: 'bg-green-500/20 text-green-500',
    cancelled: 'bg-red-500/20 text-red-500'
  };

  return (
    <div className="p-6" data-testid="purchase-orders-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Purchase Orders ({purchaseOrders.length})</h1>
        <button
          onClick={() => { setFormData({ vendor_id: vendors[0]?.id || "", kitchen_id: kitchens[0]?.id || "", items: [], notes: "" }); setShowModal(true); }}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          data-testid="add-po-btn"
        >
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-300 font-medium px-4 py-3">PO Number</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Vendor</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Kitchen</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Total</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Status</th>
              <th className="text-left text-slate-300 font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map(po => (
              <tr key={po.id} className="border-t border-slate-700 hover:bg-slate-700/30" data-testid={`po-row-${po.id}`}>
                <td className="px-4 py-3 text-white font-mono">{po.po_number}</td>
                <td className="px-4 py-3 text-slate-400">{po.vendor_name}</td>
                <td className="px-4 py-3 text-slate-400">{po.kitchen_name}</td>
                <td className="px-4 py-3 text-slate-400">₹{po.total_amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[po.status]}`}>
                    {po.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={po.status}
                    onChange={(e) => updateStatus(po.id, e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchaseOrders.length === 0 && (
          <div className="p-8 text-center text-slate-400">No purchase orders yet</div>
        )}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="po-modal">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Create Purchase Order</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={formData.vendor_id}
                onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                required
                data-testid="po-vendor-select"
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <select
                value={formData.kitchen_id}
                onChange={(e) => setFormData({...formData, kitchen_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                required
                data-testid="po-kitchen-select"
              >
                <option value="">Select Kitchen</option>
                {kitchens.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
              <textarea
                placeholder="Notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white h-24"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50" data-testid="po-save-btn">
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Categories Component
const CategoriesPage = ({ categories, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/categories', formData);
      setShowModal(false);
      setFormData({ name: "" });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6" data-testid="categories-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Categories ({categories.length})</h1>
        <button
          onClick={() => { setFormData({ name: "" }); setShowModal(true); }}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          data-testid="add-category-btn"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4" data-testid={`category-card-${cat.id}`}>
            <h3 className="text-white font-medium">{cat.name}</h3>
          </div>
        ))}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="category-modal">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add Category</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                required
                data-testid="category-name-input"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-white py-2 rounded-lg hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50" data-testid="category-save-btn">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, itemsRes, kitchensRes, vendorsRes, categoriesRes, posRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: {} })),
        api.get('/items').catch(() => ({ data: [] })),
        api.get('/kitchens').catch(() => ({ data: [] })),
        api.get('/vendors').catch(() => ({ data: [] })),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/purchase-orders').catch(() => ({ data: [] }))
      ]);
      
      setStats(statsRes.data);
      setItems(itemsRes.data);
      setKitchens(kitchensRes.data);
      setVendors(vendorsRes.data);
      setCategories(categoriesRes.data);
      setPurchaseOrders(posRes.data);
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
      />
      
      <main className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && <Dashboard stats={stats} />}
        {activeTab === 'items' && <ItemsPage items={items} categories={categories} onRefresh={loadData} />}
        {activeTab === 'kitchens' && <KitchensPage kitchens={kitchens} onRefresh={loadData} />}
        {activeTab === 'vendors' && <VendorsPage vendors={vendors} categories={categories} onRefresh={loadData} />}
        {activeTab === 'purchase-orders' && <PurchaseOrdersPage purchaseOrders={purchaseOrders} vendors={vendors} kitchens={kitchens} items={items} onRefresh={loadData} />}
        {activeTab === 'categories' && <CategoriesPage categories={categories} onRefresh={loadData} />}
      </main>
    </div>
  );
}

export default App;
