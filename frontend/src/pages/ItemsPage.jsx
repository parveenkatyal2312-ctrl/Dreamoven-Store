import { useState, useEffect, useRef } from 'react';
import { QrCode, Plus, Search, Trash2, Package, Upload, Download, FileSpreadsheet, X, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';
import { getItems, createItem, deleteItem, getCategories, getVendors } from '../lib/api';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    hsn_code: '',
    gst_rate: '',
    vendor: '',
    standard_price: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    unit: '',
    hsn_code: '',
    gst_rate: '',
    vendor: '',
    standard_price: ''
  });

  const units = ['KG', 'G', 'L', 'ML', 'PCS', 'PKT', 'CAN', 'BTL', 'BAG', 'TIN', 'CASE', 'ROLL', 'BOX'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, catsRes, vendorsRes] = await Promise.all([
        getItems(),
        getCategories(),
        getVendors()
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
      setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = items.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(query)) return false;
    }
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.category || !form.unit) {
      alert('Please fill name, category, and unit');
      return;
    }

    try {
      setSubmitting(true);
      await createItem({
        name: form.name,
        category: form.category,
        unit: form.unit,
        hsn_code: form.hsn_code || null,
        gst_rate: form.gst_rate ? parseFloat(form.gst_rate) : 0,
        vendor: form.vendor || null,
        standard_price: form.standard_price ? parseFloat(form.standard_price) : null
      });
      
      setForm({ name: '', category: '', unit: '', hsn_code: '', gst_rate: '', vendor: '', standard_price: '' });
      setShowAddDialog(false);
      await fetchData();
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Error creating item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteItem(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || '',
      category: item.category || '',
      unit: item.unit || '',
      hsn_code: item.hsn_code || '',
      gst_rate: item.gst_rate?.toString() || '',
      vendor: item.vendor || '',
      standard_price: item.standard_price?.toString() || ''
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name || !editForm.category || !editForm.unit) {
      alert('Please fill name, category, and unit');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/api/items/${editingItem.id}`, {
        name: editForm.name,
        category: editForm.category,
        unit: editForm.unit,
        hsn_code: editForm.hsn_code || null,
        gst_rate: editForm.gst_rate ? parseFloat(editForm.gst_rate) : 0,
        vendor: editForm.vendor || null,
        standard_price: editForm.standard_price ? parseFloat(editForm.standard_price) : null
      });
      
      setShowEditDialog(false);
      setEditingItem(null);
      await fetchData();
      alert('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      alert(error.response?.data?.detail || 'Error updating item');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/api/items/template/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'items_upload_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error downloading template');
    }
  };

  const downloadItemsList = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory && filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      
      const response = await api.get(`/api/export/items?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `items_list_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading items list:', error);
      alert('Error downloading items list');
    }
  };

  const handleFileUpload = async (e) => {
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
      
      const response = await api.post('/api/items/bulk-upload', formData, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="items-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-400" />
            Items Master
          </h1>
          <p className="text-slate-400 mt-1">Manage inventory items</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Download Items List Button */}
          <Button
            variant="outline"
            onClick={downloadItemsList}
            className="border-emerald-700 text-emerald-400 hover:bg-emerald-600/20"
            data-testid="download-items-btn"
          >
            <Download className="w-5 h-5 mr-2" />
            Export to Excel
          </Button>
          
          {/* Bulk Upload Button */}
          <Button
            variant="outline"
            onClick={() => setShowUploadDialog(true)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            data-testid="bulk-upload-btn"
          >
            <Upload className="w-5 h-5 mr-2" />
            Bulk Upload
          </Button>
          
          {/* Add Item Button */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-500" data-testid="add-item-btn">
                <Plus className="w-5 h-5 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Item Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., COCA COLA CAN 300 ML"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Category *</Label>
                    <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Unit *</Label>
                    <Select value={form.unit} onValueChange={(val) => setForm({ ...form, unit: val })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">HSN Code</Label>
                    <Input
                      value={form.hsn_code}
                      onChange={(e) => setForm({ ...form, hsn_code: e.target.value })}
                      placeholder="Optional"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">GST Rate %</Label>
                    <Select value={form.gst_rate} onValueChange={(val) => setForm({ ...form, gst_rate: val })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Default Vendor</Label>
                    <Select value={form.vendor} onValueChange={(val) => setForm({ ...form, vendor: val })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                        {vendors.map(v => (
                          <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Standard Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.standard_price}
                      onChange={(e) => setForm({ ...form, standard_price: e.target.value })}
                      placeholder="₹0.00"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500"
                >
                  {submitting ? 'Creating...' : 'Create Item'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open);
        if (!open) setUploadResult(null);
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Bulk Upload Items
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Instructions */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h4 className="font-medium text-white mb-2">Instructions:</h4>
              <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                <li>Download the template or use your own Excel file</li>
                <li>Required columns: <span className="text-emerald-400">ITEM NAME</span>, CATEGORY, UNIT</li>
                <li>Optional: RATE/PRICE, VENDOR, HSN CODE, GST RATE</li>
                <li>If VENDOR column is provided, items will be linked to that vendor</li>
                <li>New vendors will be auto-created if not found</li>
              </ol>
            </div>

            {/* Download Template */}
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              data-testid="download-template-btn"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Excel Template
            </Button>

            {/* File Upload */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className={`flex items-center justify-center w-full p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  uploading 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500"></div>
                    <span className="text-emerald-400">Uploading...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">Click to upload Excel file</p>
                    <p className="text-xs text-slate-500 mt-1">.xlsx or .xls (max 500 items)</p>
                  </div>
                )}
              </label>
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className={`p-4 rounded-xl border ${
                uploadResult.created > 0 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  {uploadResult.created > 0 ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${uploadResult.created > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {uploadResult.message}
                    </p>
                    <div className="mt-2 text-sm text-slate-400 space-y-1">
                      <p>Items created: <span className="text-emerald-400 font-medium">{uploadResult.created}</span></p>
                      {uploadResult.updated > 0 && (
                        <p>Items updated: <span className="text-blue-400 font-medium">{uploadResult.updated}</span></p>
                      )}
                      {uploadResult.skipped > 0 && (
                        <p>Duplicates skipped: <span className="text-amber-400 font-medium">{uploadResult.skipped}</span></p>
                      )}
                      {uploadResult.total_errors > 0 && (
                        <p>Errors: <span className="text-red-400 font-medium">{uploadResult.total_errors}</span></p>
                      )}
                    </div>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-slate-800 text-xs text-red-400 max-h-24 overflow-y-auto">
                        {uploadResult.errors.map((err, idx) => (
                          <p key={idx}>{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setUploadResult(null);
              }}
              className="w-full border-slate-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              data-testid="items-search"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue placeholder="All Categories" />
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
        Showing {filteredItems.length} of {items.length} items
      </p>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No items found</p>
            <p className="text-sm text-slate-500 mt-1">Click "Add Item" or "Bulk Upload" to add items</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-400">
                    {item.category}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-400">
                    {item.unit}
                  </span>
                  {item.gst_rate > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-xs text-amber-400">
                      GST {item.gst_rate}%
                    </span>
                  )}
                  {item.vendor && (
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-xs text-blue-400">
                      {item.vendor}
                    </span>
                  )}
                  {item.standard_price && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-xs text-emerald-400">
                      ₹{item.standard_price}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => handleEdit(item)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  title="Edit item"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(item.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-400" />
              Edit Item
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300">Item Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g., ONION"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Category *</Label>
                <Select value={editForm.category} onValueChange={(val) => setEditForm({ ...editForm, category: val })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name} className="text-white hover:bg-emerald-600">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-slate-300">Unit *</Label>
                <Select value={editForm.unit} onValueChange={(val) => setEditForm({ ...editForm, unit: val })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit} className="text-white hover:bg-emerald-600">
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Standard Price (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.standard_price}
                  onChange={(e) => setEditForm({ ...editForm, standard_price: e.target.value })}
                  placeholder="0.00"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">GST Rate (%)</Label>
                <Input
                  type="number"
                  value={editForm.gst_rate}
                  onChange={(e) => setEditForm({ ...editForm, gst_rate: e.target.value })}
                  placeholder="0"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-slate-300">HSN Code</Label>
              <Input
                value={editForm.hsn_code}
                onChange={(e) => setEditForm({ ...editForm, hsn_code: e.target.value })}
                placeholder="e.g., 0703"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Preferred Vendor</Label>
              <Select value={editForm.vendor || "none"} onValueChange={(val) => setEditForm({ ...editForm, vendor: val === "none" ? "" : val })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none" className="text-white hover:bg-emerald-600">None</SelectItem>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.name} className="text-white hover:bg-emerald-600">
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="border-slate-700">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
