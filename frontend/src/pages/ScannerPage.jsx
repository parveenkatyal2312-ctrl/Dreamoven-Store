import { useState, useEffect, useRef } from 'react';
import { ScanLine, Camera, QrCode, AlertCircle, Package, MapPin, Calendar, Hash } from 'lucide-react';
import { getLotByQR, getLotById } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [scannedLot, setScannedLot] = useState(null);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    setScanning(true);
    setError(null);
    setScannedLot(null);

    setTimeout(() => {
      if (scannerRef.current) {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        html5QrCodeRef.current = new Html5QrcodeScanner(
          "qr-reader",
          config,
          false
        );

        html5QrCodeRef.current.render(
          async (decodedText) => {
            // Success callback
            await handleScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Error callback (we can ignore most scanning errors)
            console.log('Scan error:', errorMessage);
          }
        );
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.clear().catch(console.error);
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const handleScan = async (qrData) => {
    try {
      setError(null);
      const response = await getLotByQR(qrData);
      setScannedLot(response.data);
    } catch (err) {
      console.error('Error fetching lot:', err);
      setError(err.response?.data?.detail || 'Invalid QR code or lot not found');
    }
  };

  const handleManualSearch = async () => {
    if (!manualInput.trim()) return;
    
    try {
      setError(null);
      // Try to parse as QR data format first
      if (manualInput.startsWith('LOT:')) {
        const response = await getLotByQR(manualInput);
        setScannedLot(response.data);
      } else {
        // Try as lot ID
        const response = await getLotById(manualInput.trim());
        setScannedLot(response.data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Lot not found. Please check the ID or scan a valid QR code.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'exhausted': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="scanner-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ScanLine className="w-7 h-7 text-amber-400" />
          Scan QR Code
        </h1>
        <p className="text-slate-400 mt-1">Scan lot QR code to view details</p>
      </div>

      {/* Scanner Area */}
      {!scannedLot && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
          {!scanning ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-amber-600/20 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-amber-400" />
              </div>
              <Button
                onClick={startScanner}
                className="bg-amber-600 hover:bg-amber-500 px-8 py-6 text-lg"
                data-testid="start-scan-btn"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Camera Scanner
              </Button>
              <p className="text-slate-400 text-sm mt-4">
                Position the QR code within the camera frame
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                id="qr-reader" 
                ref={scannerRef}
                className="rounded-xl overflow-hidden"
              ></div>
              <Button
                onClick={stopScanner}
                variant="outline"
                className="w-full border-slate-700"
              >
                Cancel Scanning
              </Button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-slate-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {/* Manual Input */}
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Enter Lot ID manually:</p>
            <div className="flex gap-2">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter Lot ID or scan data..."
                className="bg-slate-800 border-slate-700"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                data-testid="manual-lot-input"
              />
              <Button 
                onClick={handleManualSearch}
                className="bg-slate-700 hover:bg-slate-600"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-600/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <p className="font-medium text-red-400">Error</p>
            <p className="text-sm text-slate-300">{error}</p>
          </div>
        </div>
      )}

      {/* Scanned Lot Details */}
      {scannedLot && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-emerald-600/10 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-600/20">
                  <QrCode className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white">{scannedLot.item_name}</p>
                  <p className="text-sm text-emerald-400 font-mono">{scannedLot.lot_number}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(scannedLot.status)}`}>
                {scannedLot.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="p-4 bg-white flex justify-center">
            <img 
              src={`data:image/png;base64,${scannedLot.qr_code}`} 
              alt="QR Code" 
              className="w-40 h-40"
            />
          </div>

          {/* Details */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Current Qty</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {scannedLot.current_quantity} <span className="text-sm text-slate-400">{scannedLot.unit}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Initial Qty</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {scannedLot.initial_quantity} <span className="text-sm text-slate-400">{scannedLot.unit}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">Location</span>
                </div>
                <span className="text-white font-medium">{scannedLot.location_name}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">Expiry Date</span>
                </div>
                <span className={`font-medium ${scannedLot.status === 'expired' ? 'text-red-400' : 'text-white'}`}>
                  {new Date(scannedLot.expiry_date).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Category</span>
                <span className="text-white">{scannedLot.category}</span>
              </div>

              {scannedLot.vendor_name && (
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Vendor</span>
                  <span className="text-white">{scannedLot.vendor_name}</span>
                </div>
              )}

              {scannedLot.purchase_rate && (
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Purchase Rate</span>
                  <span className="text-white">₹{scannedLot.purchase_rate}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Created</span>
                <span className="text-white text-sm">{new Date(scannedLot.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex gap-3">
              <Button
                onClick={() => {
                  setScannedLot(null);
                  setManualInput('');
                }}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Scan Another
              </Button>
              <Button
                onClick={startScanner}
                className="flex-1 bg-amber-600 hover:bg-amber-500"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan New
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
