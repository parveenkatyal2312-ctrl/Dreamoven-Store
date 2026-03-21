import { useState, useEffect } from 'react';
import { ArrowRightLeft, Search, ArrowRight, Send } from 'lucide-react';
import { getLots, getLocations, createTransfer, getTransferList } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function TransferPage() {
  const [lots, setLots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [form, setForm] = useState({
    quantity: '',
    destination_id: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lotsRes, locsRes, transfersRes] = await Promise.all([
        getLots({ status: 'active' }),
        getLocations(),
        getTransferList()
      ]);
      setLots(lotsRes.data);
      setLocations(locsRes.data);
      setTransfers(transfersRes.data.slice(0, 10));
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
      lot.lot_number.toLowerCase().includes(query) ||
      lot.location_name.toLowerCase().includes(query)
    );
  });

  const handleTransfer = async (e) => {
    e.preventDefault();
    
    if (!selectedLot || !form.quantity || !form.destination_id) {
      alert('Please fill all required fields');
      return;
    }

    const qty = parseFloat(form.quantity);
    if (qty > selectedLot.current_quantity) {
      alert(`Cannot transfer more than available (${selectedLot.current_quantity})`);
      return;
    }

    if (form.destination_id === selectedLot.location_id) {
      alert('Destination must be different from source location');
      return;
    }

    try {
      setSubmitting(true);
      await createTransfer({
        lot_id: selectedLot.id,
        quantity: qty,
        destination_id: form.destination_id,
        notes: form.notes || null
      });
      
      const destLoc = locations.find(l => l.id === form.destination_id);
      setSuccessMessage(
        `Successfully transferred ${qty} ${selectedLot.unit} of ${selectedLot.item_name} to ${destLoc?.name || 'destination'}`
      );
      setSelectedLot(null);
      setForm({ quantity: '', destination_id: '', notes: '' });
      
      // Refresh data
      const [lotsRes, transfersRes] = await Promise.all([
        getLots({ status: 'active' }),
        getTransferList()
      ]);
      setLots(lotsRes.data);
      setTransfers(transfersRes.data.slice(0, 10));
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert(error.response?.data?.detail || 'Error creating transfer');
    } finally {
      setSubmitting(false);
    }
  };

  // Get available destinations (exclude current lot location)
  const availableDestinations = selectedLot
    ? locations.filter(l => l.id !== selectedLot.location_id)
    : locations;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="transfer-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ArrowRightLeft className="w-7 h-7 text-violet-400" />
          Transfer Stock
        </h1>
        <p className="text-slate-400 mt-1">Move stock between godowns and outlets</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
          {successMessage}
        </div>
      )}

      {/* Lot Selection */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
        <h2 className="text-lg font-semibold mb-3 text-white">Select Lot to Transfer</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item, lot number, or location..."
            className="pl-10 bg-slate-800 border-slate-700"
            data-testid="transfer-search"
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
                onClick={() => {
                  setSelectedLot(lot);
                  setForm({ ...form, destination_id: '' });
                }}
                className={`
                  p-3 rounded-xl cursor-pointer transition-all
                  ${selectedLot?.id === lot.id
                    ? 'bg-violet-600/20 border border-violet-500/50'
                    : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{lot.item_name}</p>
                    <p className="text-sm text-slate-400">
                      {lot.lot_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{lot.current_quantity} {lot.unit}</p>
                    <p className="text-xs text-violet-400">
                      @ {lot.location_name}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transfer Form */}
      {selectedLot && (
        <form onSubmit={handleTransfer} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-4">
          {/* Transfer Preview */}
          <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-slate-800/50">
            <div className="text-center">
              <p className="text-xs text-slate-400">FROM</p>
              <p className="font-semibold text-white">{selectedLot.location_name}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-violet-400" />
            <div className="text-center">
              <p className="text-xs text-slate-400">TO</p>
              <p className="font-semibold text-white">
                {form.destination_id 
                  ? locations.find(l => l.id === form.destination_id)?.name 
                  : '?'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/30">
            <p className="text-sm text-violet-400">{selectedLot.item_name}</p>
            <p className="text-xs text-slate-400">
              Available: {selectedLot.current_quantity} {selectedLot.unit} • 
              Expiry: {new Date(selectedLot.expiry_date).toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Quantity to Transfer *</Label>
              <Input
                type="number"
                step="0.01"
                max={selectedLot.current_quantity}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder={`Max: ${selectedLot.current_quantity}`}
                className="bg-slate-800 border-slate-700"
                data-testid="transfer-quantity"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Destination *</Label>
              <Select 
                value={form.destination_id} 
                onValueChange={(val) => setForm({ ...form, destination_id: val })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="transfer-destination">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {availableDestinations.map((loc) => (
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
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional transfer notes"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-violet-600 hover:bg-violet-500 py-6"
            data-testid="submit-transfer-btn"
          >
            {submitting ? 'Processing...' : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Transfer Stock
              </span>
            )}
          </Button>
        </form>
      )}

      {/* Recent Transfers */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
        <h2 className="text-lg font-semibold mb-4 text-white">Recent Transfers</h2>
        
        {transfers.length === 0 ? (
          <p className="text-slate-400 text-center py-6">No transfers yet</p>
        ) : (
          <div className="space-y-2">
            {transfers.map((t) => (
              <div key={t.id} className="p-3 rounded-xl bg-slate-800/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{t.item_name}</p>
                    <p className="text-sm text-slate-400">
                      {t.source_location} → {t.destination_location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-violet-400">{t.quantity}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
