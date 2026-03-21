import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Phone, Mail, MapPin, FileText, X, Tag, Check } from 'lucide-react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    gst_number: '',
    payment_terms: '',
    supply_categories: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vendorsRes, catsRes] = await Promise.all([
        api.get('/api/vendors'),
        api.get('/api/categories')
      ]);
      setVendors(vendorsRes.data);
      setCategories(catsRes.data.map(c => c.name));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      gst_number: '',
      payment_terms: '',
      supply_categories: []
    });
    setEditingVendor(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (vendor) => {
    setFormData({
      name: vendor.name || '',
      contact: vendor.contact || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      gst_number: vendor.gst_number || '',
      payment_terms: vendor.payment_terms || '',
      supply_categories: vendor.supply_categories || []
    });
    setEditingVendor(vendor);
    setShowDialog(true);
  };

  const toggleCategory = (category) => {
    setFormData(prev => {
      const current = prev.supply_categories || [];
      if (current.includes(category)) {
        return { ...prev, supply_categories: current.filter(c => c !== category) };
      } else {
        return { ...prev, supply_categories: [...current, category] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vendor name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingVendor) {
        await api.put(`/api/vendors/${editingVendor.id}`, formData);
      } else {
        await api.post('/api/vendors', formData);
      }
      setShowDialog(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert(error.response?.data?.detail || 'Error saving vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vendor) => {
    if (!confirm(`Are you sure you want to delete "${vendor.name}"?`)) return;
    
    try {
      await api.delete(`/api/vendors/${vendor.id}`);
      await fetchData();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert(error.response?.data?.detail || 'Error deleting vendor');
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
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="vendors-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-violet-400" />
            Vendors
          </h1>
          <p className="text-slate-400 mt-1">Manage your suppliers and their supply categories</p>
        </div>
        
        <Button
          onClick={openCreateDialog}
          className="bg-violet-600 hover:bg-violet-500"
          data-testid="add-vendor-btn"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Vendors List */}
      <div className="space-y-3">
        {vendors.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No vendors found. Add your first vendor to get started.</p>
          </div>
        ) : (
          vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
              data-testid={`vendor-card-${vendor.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-lg">{vendor.name}</h3>
                  
                  <div className="mt-2 space-y-1">
                    {vendor.phone && (
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {vendor.phone}
                      </p>
                    )}
                    {vendor.email && (
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {vendor.email}
                      </p>
                    )}
                    {vendor.address && (
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{vendor.address}</span>
                      </p>
                    )}
                    {vendor.gst_number && (
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        GST: {vendor.gst_number}
                      </p>
                    )}
                  </div>
                  
                  {/* Supply Categories */}
                  {vendor.supply_categories && vendor.supply_categories.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Supplies:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {vendor.supply_categories.map((cat) => (
                          <span
                            key={cat}
                            className={`px-2 py-0.5 rounded-full text-xs border ${getCategoryColor(cat)}`}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {vendor.payment_terms && (
                    <div className="mt-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-slate-800 text-slate-300">
                        {vendor.payment_terms}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(vendor)}
                    className="text-slate-400 hover:text-white"
                    data-testid={`edit-vendor-${vendor.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(vendor)}
                    className="text-red-400 hover:text-red-300"
                    data-testid={`delete-vendor-${vendor.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {editingVendor ? (
                <>
                  <Edit2 className="w-5 h-5 text-violet-400" />
                  Edit Vendor
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-violet-400" />
                  Add New Vendor
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Vendor Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter vendor name"
                className="bg-slate-800 border-slate-700"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vendor@email.com"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">GST Number</Label>
                <Input
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Payment Terms</Label>
                <Input
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  placeholder="Net 30, COD, etc."
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Contact Person</Label>
              <Input
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Contact person name"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            {/* Supply Categories */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Supply Categories
              </Label>
              <p className="text-xs text-slate-500">Select which categories this vendor supplies</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map((cat) => {
                  const isSelected = formData.supply_categories?.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-1 ${
                        isSelected
                          ? getCategoryColor(cat)
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {cat}
                    </button>
                  );
                })}
              </div>
              {formData.supply_categories?.length === 0 && (
                <p className="text-xs text-amber-400 mt-1">
                  No categories selected = vendor can supply all items
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1 border-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                {submitting ? 'Saving...' : editingVendor ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
