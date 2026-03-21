import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '../components/ui/dialog';
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Edit2, 
  Save,
  Download,
  Store
} from 'lucide-react';
import api from '../lib/api';

export default function LocationsPage() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_person: '',
    contact_phone: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/locations');
      setLocations(res.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name || '',
      address: location.address || '',
      contact_person: location.contact_person || '',
      contact_phone: location.contact_phone || ''
    });
  };

  const handleSave = async () => {
    if (!editingLocation) return;
    
    try {
      setSaving(true);
      await api.put(`/api/locations/${editingLocation.id}`, formData);
      await fetchLocations();
      setEditingLocation(null);
    } catch (error) {
      console.error('Error saving location:', error);
      alert(error.response?.data?.detail || 'Error saving location');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get('/api/export/all-data', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kinfolk_data_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const mainStore = locations.find(l => l.type === 'main_store');
  const kitchens = locations.filter(l => l.type === 'kitchen');

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="locations-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            Locations & Kitchens
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage outlet details, addresses and contact information
          </p>
        </div>
        
        <Button 
          onClick={handleExportData}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export All Data
        </Button>
      </div>

      {/* Main Store */}
      {mainStore && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-400" />
                Main Store
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                  {mainStore.code}
                </span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleEdit(mainStore)}
                className="text-slate-400 hover:text-white"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="text-sm text-white">{mainStore.address || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Contact Person</p>
                  <p className="text-sm text-white">{mainStore.contact_person || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm text-white">{mainStore.contact_phone || 'Not set'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kitchens */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          Kitchen Outlets ({kitchens.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kitchens.map(kitchen => (
            <Card key={kitchen.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                      {kitchen.code}
                    </span>
                    <h3 className="font-medium text-white">{kitchen.name}</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(kitchen)}
                    className="text-slate-400 hover:text-white h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-300">{kitchen.address || 'Address not set'}</p>
                  </div>
                  {kitchen.contact_person && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <p className="text-slate-300">{kitchen.contact_person}</p>
                    </div>
                  )}
                  {kitchen.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <p className="text-slate-300">{kitchen.contact_phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={() => setEditingLocation(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-emerald-400" />
              Edit {editingLocation?.type === 'main_store' ? 'Main Store' : 'Kitchen'}: {editingLocation?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="Location name"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="Full address"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Contact Person</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="Manager/Contact name"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Contact Phone</Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="Phone number"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingLocation(null)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  Saving...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
