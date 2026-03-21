import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Mail, Shield, Pencil, MapPin } from 'lucide-react';
import api, { getLocations } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createNewKitchen, setCreateNewKitchen] = useState(false);
  const [newKitchenName, setNewKitchenName] = useState('');
  const [newKitchenAddress, setNewKitchenAddress] = useState('');
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'kitchen',
    location_id: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    location_id: '',
    password: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, locsRes] = await Promise.all([
        api.get('/api/users'),
        getLocations()
      ]);
      setUsers(usersRes.data);
      setLocations(locsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.email || !form.password || !form.name) {
      alert('Please fill all required fields');
      return;
    }
    
    if (form.role === 'kitchen' && !createNewKitchen && !form.location_id) {
      alert('Kitchen users must have a location assigned');
      return;
    }

    if (form.role === 'kitchen' && createNewKitchen && !newKitchenName) {
      alert('Please enter a name for the new kitchen');
      return;
    }

    try {
      setSubmitting(true);
      
      let locationId = form.location_id;
      
      // Create new kitchen if requested
      if (form.role === 'kitchen' && createNewKitchen && newKitchenName) {
        const kitchenRes = await api.post('/api/locations', {
          name: newKitchenName,
          type: 'kitchen',
          address: newKitchenAddress || ''
        });
        locationId = kitchenRes.data.id;
      }
      
      await api.post('/api/auth/register', {
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        location_id: form.role === 'kitchen' ? locationId : null
      });
      
      setForm({ email: '', password: '', name: '', role: 'kitchen', location_id: '' });
      setCreateNewKitchen(false);
      setNewKitchenName('');
      setNewKitchenAddress('');
      setShowAddDialog(false);
      await fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.detail || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      location_id: user.location_id || '',
      password: ''
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name || !editForm.email) {
      alert('Name and email are required');
      return;
    }
    
    if (editForm.role === 'kitchen' && !editForm.location_id) {
      alert('Kitchen users must have a location assigned');
      return;
    }

    try {
      setSubmitting(true);
      
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        location_id: editForm.role === 'kitchen' ? editForm.location_id : null
      };
      
      // Only include password if it was changed
      if (editForm.password && editForm.password.trim()) {
        updateData.password = editForm.password;
      }
      
      await api.put(`/api/users/${editingUser.id}`, updateData);
      
      setShowEditDialog(false);
      setEditingUser(null);
      await fetchData();
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.detail || 'Error updating user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/api/users/${userId}`);
      await fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.detail || 'Error deleting user');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'main_store': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'kitchen': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Filter kitchens only for location selection
  const kitchens = locations.filter(l => l.type === 'kitchen');
  // All locations for edit (includes main_store)
  const allLocations = locations;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="users-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-400" />
            User Management
          </h1>
          <p className="text-slate-400 mt-1">Manage user accounts and permissions</p>
        </div>
        
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-500"
          data-testid="add-user-btn"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No users found</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between"
              data-testid={`user-row-${user.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-white">{user.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="text-sm text-slate-400">{user.email}</span>
                  </div>
                  {user.location_name && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-emerald-400">{user.location_name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                  {user.role.toUpperCase()}
                </span>
                <Button
                  onClick={() => handleEdit(user)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  data-testid={`edit-user-${user.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(user.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  data-testid={`delete-user-${user.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Add New User
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Password *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Set password"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Role *</Label>
              <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="main_store">Main Store</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === 'kitchen' && (
              <div className="space-y-3">
                <Label className="text-slate-300">Assigned Kitchen *</Label>
                
                {/* Toggle between existing and new kitchen */}
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={!createNewKitchen ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreateNewKitchen(false)}
                    className={!createNewKitchen ? "bg-emerald-600" : "bg-slate-800 border-slate-700"}
                  >
                    Select Existing
                  </Button>
                  <Button
                    type="button"
                    variant={createNewKitchen ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreateNewKitchen(true)}
                    className={createNewKitchen ? "bg-emerald-600" : "bg-slate-800 border-slate-700"}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Create New
                  </Button>
                </div>
                
                {!createNewKitchen ? (
                  <Select value={form.location_id} onValueChange={(val) => setForm({ ...form, location_id: val })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select kitchen" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {kitchens.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">New Kitchen Name *</Label>
                      <Input
                        value={newKitchenName}
                        onChange={(e) => setNewKitchenName(e.target.value)}
                        placeholder="e.g., Dreamoven Cafe"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Kitchen Address (Optional)</Label>
                      <Input
                        value={newKitchenAddress}
                        onChange={(e) => setNewKitchenAddress(e.target.value)}
                        placeholder="e.g., 123 Main Street"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500">
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-400" />
              Edit User
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Full name"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="user@example.com"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">New Password (leave blank to keep current)</Label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Enter new password or leave blank"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Role *</Label>
              <Select value={editForm.role} onValueChange={(val) => setEditForm({ ...editForm, role: val })}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="main_store">Main Store</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">
                Assigned Location {editForm.role === 'kitchen' ? '*' : '(Optional)'}
              </Label>
              <Select 
                value={editForm.location_id || 'none'} 
                onValueChange={(val) => setEditForm({ ...editForm, location_id: val === 'none' ? '' : val })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none">No Location</SelectItem>
                  {allLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting} 
                className="flex-1 bg-blue-600 hover:bg-blue-500"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
