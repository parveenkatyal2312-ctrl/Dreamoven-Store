import { useState, useEffect } from 'react';
import { ClipboardList, ScanLine, Search, Send, AlertCircle } from 'lucide-react';
import { getLots, getLocations, getItems, createIssue, createFEFOIssue, getLotByQR } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function IssuePage() {
  const [lots, setLots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Manual Issue Form
  const [issueForm, setIssueForm] = useState({
    quantity: '',
    destination_id: '',
    notes: ''
  });

  // FEFO Issue Form
  const [fefoForm, setFefoForm] = useState({
    item_id: '',
    quantity: '',
    destination_id: '',
    source_location_id: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lotsRes, locsRes, itemsRes] = await Promise.all([
        getLots({ status: 'active' }),
        getLocations(),
        getItems()
      ]);
      setLots(lotsRes.data);
      setLocations(locsRes.data);
      setItems(itemsRes.data);
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
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lot.item_name.toLowerCase().includes(query) ||
      lot.lot_number.toLowerCase().includes(query)
    );
  });

  const handleManualIssue = async (e) => {
    e.preventDefault();
    
    if (!selectedLot || !issueForm.quantity || !issueForm.destination_id) {
      alert('Please fill all required fields');
      return;
    }

    const qty = parseFloat(issueForm.quantity);
    if (qty > selectedLot.current_quantity) {
      alert(`Cannot issue more than available (${selectedLot.current_quantity})`);
      return;
    }

    try {
      setSubmitting(true);
      await createIssue({
        lot_id: selectedLot.id,
        quantity: qty,
        destination_id: issueForm.destination_id,
        notes: issueForm.notes || null
      });
      
      setSuccessMessage(`Successfully issued ${qty} ${selectedLot.unit} of ${selectedLot.item_name}`);
      setSelectedLot(null);
      setIssueForm({ quantity: '', destination_id: '', notes: '' });
      
      // Refresh lots
      const lotsRes = await getLots({ status: 'active' });
      setLots(lotsRes.data);
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error creating issue:', error);
      alert(error.response?.data?.detail || 'Error creating issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFEFOIssue = async (e) => {
    e.preventDefault();
    
    if (!fefoForm.item_id || !fefoForm.quantity || !fefoForm.destination_id) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await createFEFOIssue({
        item_id: fefoForm.item_id,
        quantity: parseFloat(fefoForm.quantity),
        destination_id: fefoForm.destination_id,
        source_location_id: fefoForm.source_location_id || undefined,
        notes: fefoForm.notes || undefined
      });
      
      const issuedFrom = response.data.issued_from;
      setSuccessMessage(
        `FEFO Issue successful! Issued from ${issuedFrom.length} lot(s): ${issuedFrom.map(l => l.lot_number).join(', ')}`
      );
      setFefoForm({ item_id: '', quantity: '', destination_id: '', source_location_id: '', notes: '' });
      
      // Refresh lots
      const lotsRes = await getLots({ status: 'active' });
      setLots(lotsRes.data);
      
      setTimeout(() => setSuccessMessage(''), 8000);
    } catch (error) {
      console.error('Error creating FEFO issue:', error);
      alert(error.response?.data?.detail || 'Error creating FEFO issue');
    } finally {
      setSubmitting(false);
    }
  };

  // Get kitchens only (for issue destinations)
  const kitchens = locations.filter(l => l.type === 'kitchen');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="issue-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-blue-400" />
          Issue to Kitchen
        </h1>
        <p className="text-slate-400 mt-1">Issue stock from lots to kitchen locations</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
          {successMessage}
        </div>
      )}

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="manual" className="data-[state=active]:bg-blue-600">
            Manual Issue
          </TabsTrigger>
          <TabsTrigger value="fefo" className="data-[state=active]:bg-blue-600">
            FEFO Issue
          </TabsTrigger>
        </TabsList>

        {/* Manual Issue Tab */}
        <TabsContent value="manual" className="space-y-4">
          {/* Lot Selection */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
            <h2 className="text-lg font-semibold mb-3 text-white">Select Lot</h2>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name or lot number..."
                className="pl-10 bg-slate-800 border-slate-700"
                data-testid="lot-search"
              />
            </div>

            {/* Lots List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredLots.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No active lots found</p>
              ) : (
                filteredLots.map((lot) => (
                  <div
                    key={lot.id}
                    onClick={() => setSelectedLot(lot)}
                    className={`
                      p-3 rounded-xl cursor-pointer transition-all
                      ${selectedLot?.id === lot.id
                        ? 'bg-blue-600/20 border border-blue-500/50'
                        : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white">{lot.item_name}</p>
                        <p className="text-sm text-slate-400">
                          {lot.lot_number} • {lot.location_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{lot.current_quantity} {lot.unit}</p>
                        <p className="text-xs text-slate-400">
                          Exp: {new Date(lot.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Issue Form */}
          {selectedLot && (
            <form onSubmit={handleManualIssue} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-4">
              <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/30">
                <p className="text-sm text-blue-400">Selected: {selectedLot.item_name}</p>
                <p className="text-xs text-slate-400">
                  Available: {selectedLot.current_quantity} {selectedLot.unit} • 
                  Expiry: {new Date(selectedLot.expiry_date).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Quantity to Issue *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    max={selectedLot.current_quantity}
                    value={issueForm.quantity}
                    onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                    placeholder={`Max: ${selectedLot.current_quantity}`}
                    className="bg-slate-800 border-slate-700"
                    data-testid="issue-quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Issue to Kitchen *</Label>
                  <Select 
                    value={issueForm.destination_id} 
                    onValueChange={(val) => setIssueForm({ ...issueForm, destination_id: val })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="issue-destination">
                      <SelectValue placeholder="Select kitchen" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {kitchens.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id} className="text-white hover:bg-slate-700">
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Notes</Label>
                <Input
                  value={issueForm.notes}
                  onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                  placeholder="Optional notes"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 py-6"
                data-testid="submit-issue-btn"
              >
                {submitting ? 'Processing...' : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Issue Stock
                  </span>
                )}
              </Button>
            </form>
          )}
        </TabsContent>

        {/* FEFO Issue Tab */}
        <TabsContent value="fefo" className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-600/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-400">FEFO - First Expired First Out</p>
                <p className="text-sm text-slate-400">
                  System will automatically pick lots with earliest expiry dates first
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleFEFOIssue} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Item *</Label>
                <Select 
                  value={fefoForm.item_id} 
                  onValueChange={(val) => setFefoForm({ ...fefoForm, item_id: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="fefo-item-select">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-white hover:bg-slate-700">
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Quantity Required *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fefoForm.quantity}
                  onChange={(e) => setFefoForm({ ...fefoForm, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  className="bg-slate-800 border-slate-700"
                  data-testid="fefo-quantity"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Issue to Kitchen *</Label>
                <Select 
                  value={fefoForm.destination_id} 
                  onValueChange={(val) => setFefoForm({ ...fefoForm, destination_id: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="fefo-destination">
                    <SelectValue placeholder="Select kitchen" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {kitchens.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id} className="text-white hover:bg-slate-700">
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Source Location (optional)</Label>
                <Select 
                  value={fefoForm.source_location_id} 
                  onValueChange={(val) => setFefoForm({ ...fefoForm, source_location_id: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id} className="text-white hover:bg-slate-700">
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Notes</Label>
              <Input
                value={fefoForm.notes}
                onChange={(e) => setFefoForm({ ...fefoForm, notes: e.target.value })}
                placeholder="Optional notes"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-600 hover:bg-amber-500 py-6"
              data-testid="submit-fefo-btn"
            >
              {submitting ? 'Processing...' : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Issue Using FEFO
                </span>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
