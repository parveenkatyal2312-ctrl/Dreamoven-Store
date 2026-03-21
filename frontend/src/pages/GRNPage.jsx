import { useState, useEffect, useRef } from 'react';
import { Package, Calendar, Plus, QrCode, Building2, Tag, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, ClipboardList, Minus, Check, X, FileText, Camera, MapPin, Clock, Search } from 'lucide-react';
import { getItems, getLocations, getVendors, createGRN, getGRNList } from '../lib/api';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';

// Convert number to words (Indian format)
function numberToWords(num) {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numToWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = 'Rupees ' + numToWords(rupees);
  if (paise > 0) {
    result += ' and ' + numToWords(paise) + ' Paise';
  }
  result += ' Only';
  return result;
}

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

export default function GRNPage() {
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [grnList, setGrnList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [activeTab, setActiveTab] = useState('po-based');
  
  // Auth context for kitchen detection
  const { isKitchen, user } = useAuth();
  
  // PO-based GRN states
  const [pendingPOs, setPendingPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [poVendorId, setPoVendorId] = useState('');
  const [poLocationId, setPoLocationId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [poSubmitting, setPoSubmitting] = useState(false);
  const [poResult, setPoResult] = useState(null);
  
  // PO Search states
  const [poSearchQuery, setPoSearchQuery] = useState('');
  const [poSearchResults, setPOSearchResults] = useState([]);
  const [poSearching, setPOSearching] = useState(false);
  
  // Auto-set kitchen location for kitchen users
  useEffect(() => {
    if (isKitchen && user?.location_id) {
      setPoLocationId(user.location_id);
    }
  }, [isKitchen, user]);
  
  // Photo capture states for GRN verification (supports up to 6 photos)
  const MAX_PHOTOS = 6;
  const [capturedPhotos, setCapturedPhotos] = useState([]); // Array of photos
  const [capturedPhoto, setCapturedPhoto] = useState(null); // Current/preview photo (for backwards compatibility)
  const [gpsLocation, setGpsLocation] = useState(null);
  const [captureTime, setCaptureTime] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Bulk upload states
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkVendorId, setBulkVendorId] = useState('');
  const [bulkLocationId, setBulkLocationId] = useState('');
  const [bulkInvoiceNumber, setBulkInvoiceNumber] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  
  const [form, setForm] = useState({
    item_id: '',
    quantity: '',
    expiry_date: '',
    location_id: '',
    vendor_id: '',
    purchase_rate: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, locsRes, vendorsRes, grnRes] = await Promise.all([
        getItems(),
        getLocations(),
        getVendors(),
        getGRNList()
      ]);
      setAllItems(itemsRes.data);
      setFilteredItems(itemsRes.data);
      setLocations(locsRes.data);
      setVendors(vendorsRes.data);
      setGrnList(grnRes.data.slice(0, 10)); // Last 10
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start camera for photo capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
      // Also get GPS location
      getGPSLocation();
    } catch (error) {
      console.error('Camera error:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (capturedPhotos.length >= MAX_PHOTOS) {
      alert(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0);
      
      // Get image data URL
      const photoData = canvas.toDataURL('image/jpeg', 0.7);
      const timestamp = new Date().toISOString();
      
      // Add to photos array
      setCapturedPhotos(prev => [...prev, { data: photoData, timestamp }]);
      setCapturedPhoto(photoData); // Keep last photo for backwards compatibility
      setCaptureTime(timestamp);
      
      // Stop camera after capture
      stopCamera();
    }
  };

  // Get GPS location
  const getGPSLocation = () => {
    setGettingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by browser');
      setGettingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('GPS error:', error);
        setLocationError(error.message || 'Unable to get location');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Handle file input for photo upload (alternative to camera)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = MAX_PHOTOS - capturedPhotos.length;
    
    if (files.length > remainingSlots) {
      alert(`You can only add ${remainingSlots} more photo(s). Maximum ${MAX_PHOTOS} photos allowed.`);
    }
    
    const filesToProcess = files.slice(0, remainingSlots);
    
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoData = event.target.result;
        const timestamp = new Date().toISOString();
        setCapturedPhotos(prev => [...prev, { data: photoData, timestamp }]);
        setCapturedPhoto(photoData); // Keep last for backwards compatibility
        setCaptureTime(timestamp);
      };
      reader.readAsDataURL(file);
    });
    
    // Also get GPS location when uploading
    if (filesToProcess.length > 0) {
      getGPSLocation();
    }
    
    // Reset input
    e.target.value = '';
  };

  // Clear a specific photo by index
  const removePhoto = (index) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
    if (capturedPhotos.length <= 1) {
      setCapturedPhoto(null);
      setGpsLocation(null);
      setCaptureTime(null);
    }
  };

  // Clear all captured photos
  const clearAllPhotos = () => {
    setCapturedPhotos([]);
    setCapturedPhoto(null);
    setGpsLocation(null);
    setCaptureTime(null);
    setLocationError(null);
  };

  // Clear captured photo (backwards compatibility)
  const clearPhoto = () => {
    clearAllPhotos();
  };

  // Fetch pending POs when vendor changes (for PO-based GRN)
  const fetchPendingPOs = async (vendorId) => {
    if (!vendorId) {
      setPendingPOs([]);
      return;
    }
    
    try {
      const response = await api.get(`/api/purchase-orders?vendor_id=${vendorId}&status=pending&limit=500`);
      // Also include partial POs
      const partialResponse = await api.get(`/api/purchase-orders?vendor_id=${vendorId}&status=partial&limit=500`);
      // Handle both paginated response and legacy array format
      const pendingData = response.data?.purchase_orders || response.data || [];
      const partialData = partialResponse.data?.purchase_orders || partialResponse.data || [];
      const allPOs = [...pendingData, ...partialData];
      setPendingPOs(allPOs);
    } catch (error) {
      console.error('Error fetching pending POs:', error);
      setPendingPOs([]);
    }
  };

  // Search PO by number
  const searchPOByNumber = async (query) => {
    if (!query || query.length < 3) {
      setPOSearchResults([]);
      return;
    }
    
    setPOSearching(true);
    try {
      // Fetch all pending and partial POs and filter by PO number
      const pendingResponse = await api.get('/api/purchase-orders?status=pending&limit=500');
      const partialResponse = await api.get('/api/purchase-orders?status=partial&limit=500');
      // Handle both paginated response and legacy array format
      const pendingData = pendingResponse.data?.purchase_orders || pendingResponse.data || [];
      const partialData = partialResponse.data?.purchase_orders || partialResponse.data || [];
      const allPOs = [...pendingData, ...partialData];
      
      // Filter by PO number (case-insensitive)
      const searchUpper = query.toUpperCase();
      const filtered = allPOs.filter(po => 
        po.po_number?.toUpperCase().includes(searchUpper)
      );
      
      setPOSearchResults(filtered);
    } catch (error) {
      console.error('Error searching POs:', error);
      setPOSearchResults([]);
    } finally {
      setPOSearching(false);
    }
  };

  // Handle PO search selection
  const handleSearchSelectPO = async (po) => {
    setSelectedPO(po);
    setPoVendorId(po.vendor_id || '');
    setPOSearchResults([]);
    setPoSearchQuery('');
    
    // Fetch full PO details including items
    try {
      const response = await api.get(`/api/purchase-orders/${po.id}`);
      const fullPO = response.data;
      setSelectedPO(fullPO);
      
      const items = (fullPO.items || []).map(item => ({
        ...item,
        received_qty: item.quantity,
        invoice_rate: item.rate,
        po_rate: item.rate,
        final_amount: item.quantity * item.rate,
        status: 'ok',
        price_variance: 0
      }));
      setPoItems(items);
    } catch (error) {
      console.error('Error fetching PO details:', error);
      // Fallback to list data
      const items = (po.items || []).map(item => ({
        ...item,
        received_qty: item.quantity,
        invoice_rate: item.rate,
        po_rate: item.rate,
        final_amount: item.quantity * item.rate,
        status: 'ok',
        price_variance: 0
      }));
      setPoItems(items);
    }
  };

  // Handle PO vendor change
  const handlePoVendorChange = (vendorId) => {
    setPoVendorId(vendorId);
    setSelectedPO(null);
    setPoItems([]);
    fetchPendingPOs(vendorId);
  };

  // Handle PO selection - fetch full details including items
  const handleSelectPO = async (po) => {
    console.log('handleSelectPO called with:', po);
    setSelectedPO(po);
    setPoItems([]); // Clear while loading
    
    try {
      // Fetch full PO details including items
      console.log('Fetching PO details for ID:', po.id);
      const response = await api.get(`/api/purchase-orders/${po.id}`);
      const fullPO = response.data;
      console.log('Full PO received:', fullPO);
      console.log('Items count:', fullPO.items?.length);
      
      // Update selected PO with full data
      setSelectedPO(fullPO);
      
      // Initialize PO items with received qty = ordered qty, status = 'ok'
      const items = (fullPO.items || []).map(item => ({
        ...item,
        received_qty: item.quantity,
        invoice_rate: item.rate,
        po_rate: item.rate,
        final_amount: item.quantity * item.rate,
        status: 'ok', // ok, short, rejected
        price_variance: 0
      }));
      console.log('Setting poItems:', items.length, 'items');
      setPoItems(items);
    } catch (error) {
      console.error('Error fetching PO details:', error);
      // Fallback to list data if detail fetch fails
      const items = (po.items || []).map(item => ({
        ...item,
        received_qty: item.quantity,
        invoice_rate: item.rate,
        po_rate: item.rate,
        final_amount: item.quantity * item.rate,
        status: 'ok',
        price_variance: 0
      }));
      setPoItems(items);
    }
  };

  // Update PO item received quantity
  const updatePoItemQty = (index, delta) => {
    const updated = [...poItems];
    const newQty = Math.max(0, (updated[index].received_qty || 0) + delta);
    updated[index].received_qty = newQty;
    updated[index].final_amount = newQty * updated[index].invoice_rate;
    
    // Auto-set status based on qty
    if (newQty === 0) {
      updated[index].status = 'rejected';
    } else if (newQty < updated[index].quantity) {
      updated[index].status = 'short';
    } else {
      updated[index].status = 'ok';
    }
    
    setPoItems(updated);
  };

  // Update PO item quantity directly (for typing)
  const updatePoItemQtyDirect = (index, newQty) => {
    const updated = [...poItems];
    const qty = Math.max(0, newQty);
    updated[index].received_qty = qty;
    updated[index].final_amount = qty * updated[index].invoice_rate;
    
    // Auto-set status based on qty
    if (qty === 0) {
      updated[index].status = 'rejected';
    } else if (qty < updated[index].quantity) {
      updated[index].status = 'short';
    } else {
      updated[index].status = 'ok';
    }
    
    setPoItems(updated);
  };

  // Update PO item invoice rate
  const updatePoItemRate = (index, newRate) => {
    const updated = [...poItems];
    const rate = parseFloat(newRate) || 0;
    updated[index].invoice_rate = rate;
    updated[index].price_variance = rate - updated[index].po_rate;
    updated[index].final_amount = updated[index].received_qty * rate;
    setPoItems(updated);
  };

  // Update PO item status
  const updatePoItemStatus = (index, status) => {
    const updated = [...poItems];
    updated[index].status = status;
    if (status === 'rejected') {
      updated[index].received_qty = 0;
      updated[index].final_amount = 0;
    }
    setPoItems(updated);
  };

  // Calculate totals
  const calculateTotals = () => {
    const okItems = poItems.filter(item => item.status === 'ok' || item.status === 'short');
    const totalAmount = okItems.reduce((sum, item) => sum + item.final_amount, 0);
    const totalItems = okItems.length;
    const rejectedItems = poItems.filter(item => item.status === 'rejected').length;
    return { totalAmount, totalItems, rejectedItems };
  };

  // Submit PO-based GRN
  const handlePoGrnSubmit = async () => {
    if (!selectedPO) {
      alert('Please select a PO');
      return;
    }
    if (!poLocationId) {
      alert('Please select a receiving location');
      return;
    }
    if (!invoiceNumber) {
      alert('Please enter invoice number');
      return;
    }
    
    // Photo is optional until Feb 13, 2026
    const photoOptionalUntil = new Date('2026-02-13');
    const today = new Date();
    const isPhotoRequired = today > photoOptionalUntil;
    
    if (isPhotoRequired && capturedPhotos.length === 0) {
      alert('Please capture at least one photo of the goods received before completing GRN');
      return;
    }

    const okItems = poItems.filter(item => item.status === 'ok' || item.status === 'short');
    if (okItems.length === 0) {
      alert('No items to receive. All items are rejected.');
      return;
    }

    try {
      setPoSubmitting(true);
      
      const { totalAmount } = calculateTotals();
      
      const payload = {
        po_id: selectedPO.id,
        vendor_id: poVendorId,
        location_id: poLocationId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        total_amount: totalAmount,
        items: poItems.map(item => ({
          item_id: item.item_id,
          item_name: item.item_name,
          ordered_qty: item.quantity,
          received_qty: item.received_qty,
          po_rate: item.po_rate,
          invoice_rate: item.invoice_rate,
          final_amount: item.final_amount,
          status: item.status,
          price_variance: item.price_variance
        })),
        // Photo verification data - supports multiple photos (up to 6)
        verification_photo: capturedPhotos.length > 0 ? capturedPhotos[0].data : null, // First photo for backwards compatibility
        verification_photos: capturedPhotos.map(p => ({ data: p.data, timestamp: p.timestamp })), // All photos
        gps_location: gpsLocation || null,
        capture_time: captureTime || null
      };

      const response = await api.post('/api/grn/from-po', payload);
      
      setPoResult({
        success: true,
        message: response.data.message,
        created_lots: response.data.created_lots || response.data.received_items,
        ledger_entry: response.data.ledger_entry,
        is_kitchen_grn: response.data.is_kitchen_grn
      });

      // Clear form including photo
      setSelectedPO(null);
      setPoItems([]);
      setInvoiceNumber('');
      clearPhoto();
      fetchPendingPOs(poVendorId);
      
      // Refresh GRN list
      const grnRes = await getGRNList();
      setGrnList(grnRes.data.slice(0, 10));
      
    } catch (error) {
      console.error('PO GRN error:', error);
      setPoResult({
        success: false,
        message: error.response?.data?.detail || 'Error processing GRN'
      });
    } finally {
      setPoSubmitting(false);
    }
  };

  // Fetch vendor-specific items when vendor changes
  const handleVendorChange = async (vendorId) => {
    setForm({ ...form, vendor_id: vendorId, item_id: '' });
    
    if (!vendorId) {
      setFilteredItems(allItems);
      setSelectedVendor(null);
      return;
    }
    
    const vendor = vendors.find(v => v.id === vendorId);
    setSelectedVendor(vendor);
    
    try {
      // Fetch items specific to this vendor's categories
      const response = await api.get(`/api/vendors/${vendorId}/items`);
      setFilteredItems(response.data);
    } catch (error) {
      console.error('Error fetching vendor items:', error);
      // Fallback to all items
      setFilteredItems(allItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.vendor_id) {
      alert('Please select a vendor first');
      return;
    }
    
    if (!form.item_id || !form.quantity || !form.expiry_date || !form.location_id) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await createGRN({
        item_id: form.item_id,
        quantity: parseFloat(form.quantity),
        expiry_date: form.expiry_date,
        location_id: form.location_id,
        vendor_id: form.vendor_id || null,
        purchase_rate: form.purchase_rate ? parseFloat(form.purchase_rate) : null,
        notes: form.notes || null
      });
      
      // Show QR code for the created lot
      setShowQR(response.data.lot);
      
      // Reset form but keep vendor selected
      const currentVendorId = form.vendor_id;
      setForm({
        item_id: '',
        quantity: '',
        expiry_date: '',
        location_id: form.location_id, // Keep location
        vendor_id: currentVendorId, // Keep vendor
        purchase_rate: '',
        notes: ''
      });
      
      // Refresh GRN list
      const grnRes = await getGRNList();
      setGrnList(grnRes.data.slice(0, 10));
      
    } catch (error) {
      console.error('Error creating GRN:', error);
      alert(error.response?.data?.detail || 'Error creating GRN');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk upload handler
  const handleBulkUpload = async () => {
    if (!bulkFile) {
      alert('Please select an Excel file');
      return;
    }
    if (!bulkVendorId) {
      alert('Please select a vendor');
      return;
    }
    if (!bulkLocationId) {
      alert('Please select a location');
      return;
    }

    try {
      setBulkUploading(true);
      setBulkResult(null);
      
      const formData = new FormData();
      formData.append('file', bulkFile);
      formData.append('vendor_id', bulkVendorId);
      formData.append('location_id', bulkLocationId);
      if (bulkInvoiceNumber) {
        formData.append('invoice_number', bulkInvoiceNumber);
      }

      const response = await api.post('/api/grn/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setBulkResult(response.data);
      
      // Refresh GRN list
      const grnRes = await getGRNList();
      setGrnList(grnRes.data.slice(0, 10));
      
      // Clear form
      setBulkFile(null);
      setBulkInvoiceNumber('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Bulk upload error:', error);
      setBulkResult({
        error: true,
        message: error.response?.data?.detail || 'Error uploading file'
      });
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadTemplate = () => {
    window.open(`${api.defaults.baseURL}/api/grn/template`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { totalAmount, totalItems, rejectedItems } = calculateTotals();

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="grn-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="w-7 h-7 text-emerald-400" />
          Receive Stock (GRN)
        </h1>
        <p className="text-slate-400 mt-1">Receive goods against Purchase Orders</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700 w-full justify-start">
          <TabsTrigger value="po-based" className="data-[state=active]:bg-emerald-600">
            <ClipboardList className="w-4 h-4 mr-2" />
            Receive Against PO
          </TabsTrigger>
          <TabsTrigger value="single" className="data-[state=active]:bg-violet-600">
            <Plus className="w-4 h-4 mr-2" />
            Direct Entry
          </TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-blue-600">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel Upload
          </TabsTrigger>
        </TabsList>

        {/* ========== PO-BASED GRN TAB ========== */}
        <TabsContent value="po-based">
          <div className="space-y-4">
            {/* Quick PO Search */}
            <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-xl border border-emerald-700/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <Label className="text-emerald-300 font-medium">Quick Search: Find PO by Number</Label>
              </div>
              <div className="relative">
                <Input
                  placeholder="Enter PO number (e.g., PO-20260220-0393)"
                  value={poSearchQuery}
                  onChange={(e) => {
                    setPoSearchQuery(e.target.value);
                    searchPOByNumber(e.target.value);
                  }}
                  className="bg-slate-800 border-slate-700 pr-10"
                />
                {poSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {/* Search Results */}
              {poSearchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {poSearchResults.map((po) => (
                    <div
                      key={po.id}
                      onClick={() => handleSearchSelectPO(po)}
                      className="p-3 rounded-lg border cursor-pointer transition-all bg-slate-800/50 border-slate-700 hover:border-emerald-500 hover:bg-emerald-900/20"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{po.po_number}</p>
                          <p className="text-sm text-slate-400">
                            {po.vendor_name} • {selectedPO?.id === po.id ? (poItems.length > 0 ? `${poItems.length} items` : 'Loading...') : `${po.items_count || po.items?.length || '?'} items`} • ₹{(po.total_amount || 0).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          po.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {po.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {poSearchQuery.length >= 3 && poSearchResults.length === 0 && !poSearching && (
                <p className="text-slate-400 text-sm mt-2">No POs found matching "{poSearchQuery}"</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-slate-500 text-sm">OR browse by vendor</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            {/* Step 1: Select Vendor */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-violet-400" />
                <Label className="text-violet-300 font-medium">Step 1: Select Vendor</Label>
              </div>
              <Select value={poVendorId} onValueChange={handlePoVendorChange}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Choose vendor to see pending POs" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id} className="text-white hover:bg-slate-700">
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Select Pending PO */}
            {poVendorId && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <Label className="text-blue-300 font-medium">Step 2: Select Pending PO</Label>
                </div>
                
                {pendingPOs.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No pending POs for this vendor</p>
                ) : (
                  <div className="space-y-2">
                    {pendingPOs.map((po) => (
                      <div
                        key={po.id}
                        onClick={() => handleSelectPO(po)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedPO?.id === po.id 
                            ? 'bg-emerald-600/20 border-emerald-500' 
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-white">{po.po_number}</p>
                            <p className="text-sm text-slate-400">
                              {po.items_count || po.items?.length || 0} items • ₹{(po.total_amount || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              po.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {po.status?.toUpperCase()}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">{po.created_at?.split('T')[0]}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Receive Location */}
            {selectedPO && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-teal-400" />
                  <Label className="text-teal-300 font-medium">Step 3: Receive at Location</Label>
                </div>
                {isKitchen && user?.location_id ? (
                  // Kitchen user - auto-set to their kitchen, show as read-only
                  <div className="p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Receiving at:</p>
                    <p className="text-emerald-400 font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {user.location_code ? `[${user.location_code}] ` : ''}{user.location_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Items will be added to your kitchen inventory (Daily Perishables)
                    </p>
                  </div>
                ) : (
                  // Main store user - show location dropdown
                  <Select value={poLocationId} onValueChange={setPoLocationId}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select receiving location" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {locations.filter(l => l.type === 'store' || l.type === 'main_store' || l.type === 'warehouse').map((loc) => (
                        <SelectItem key={loc.id} value={loc.id} className="text-white hover:bg-slate-700">
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Step 4: Verify Items */}
            {selectedPO && poLocationId && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <Label className="text-emerald-300 font-medium">Step 4: Verify Received Items</Label>
                  </div>
                  <p className="text-sm text-slate-400">PO: {selectedPO.po_number}</p>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left p-2 text-slate-400">Item</th>
                        <th className="text-center p-2 text-slate-400">Ordered</th>
                        <th className="text-center p-2 text-slate-400">Received</th>
                        <th className="text-center p-2 text-slate-400">PO Rate</th>
                        <th className="text-center p-2 text-slate-400">Invoice Rate</th>
                        <th className="text-center p-2 text-slate-400">Variance</th>
                        <th className="text-right p-2 text-slate-400">Amount</th>
                        <th className="text-center p-2 text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poItems.map((item, idx) => (
                        <tr key={idx} className="border-t border-slate-800">
                          <td className="p-2 text-white max-w-[200px] truncate" title={item.item_name}>
                            {item.item_name}
                          </td>
                          <td className="p-2 text-center text-slate-400">{item.quantity}</td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => updatePoItemQty(idx, -1)}
                                className="w-7 h-7 rounded bg-red-600/20 text-red-400 hover:bg-red-600/40 flex items-center justify-center"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={item.received_qty}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updatePoItemQtyDirect(idx, val);
                                }}
                                className="w-16 h-8 text-center bg-slate-800 border-slate-700 text-white font-medium"
                                data-testid={`qty-input-${idx}`}
                              />
                              <button
                                type="button"
                                onClick={() => updatePoItemQty(idx, 1)}
                                className="w-7 h-7 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 flex items-center justify-center"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="p-2 text-center text-slate-400">₹{item.po_rate}</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.invoice_rate}
                              onChange={(e) => updatePoItemRate(idx, e.target.value)}
                              className="w-20 h-8 text-center bg-slate-800 border-slate-700 text-white mx-auto"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {item.price_variance !== 0 && (
                              <span className={item.price_variance > 0 ? 'text-red-400' : 'text-emerald-400'}>
                                {item.price_variance > 0 ? '+' : ''}₹{item.price_variance.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-right text-white font-medium">
                            ₹{item.final_amount.toFixed(2)}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => updatePoItemStatus(idx, 'ok')}
                                className={`px-2 py-1 rounded text-xs ${
                                  item.status === 'ok' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                                }`}
                              >
                                OK
                              </button>
                              <button
                                type="button"
                                onClick={() => updatePoItemStatus(idx, 'short')}
                                className={`px-2 py-1 rounded text-xs ${
                                  item.status === 'short' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'
                                }`}
                              >
                                Short
                              </button>
                              <button
                                type="button"
                                onClick={() => updatePoItemStatus(idx, 'rejected')}
                                className={`px-2 py-1 rounded text-xs ${
                                  item.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'
                                }`}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 5: Invoice Details */}
            {selectedPO && poLocationId && poItems.length > 0 && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <Label className="text-amber-300 font-medium">Step 5: Invoice Details</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">Invoice Number *</Label>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g., INV-2026-001"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Invoice Date *</Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Items Received</Label>
                    <p className="text-white font-medium py-2">
                      {totalItems} OK/Short • {rejectedItems} Rejected
                    </p>
                  </div>
                </div>

                {/* Final Amount Summary */}
                <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">Final Invoice Amount:</span>
                    <span className="text-3xl font-bold text-emerald-400">₹{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <p className="text-sm text-slate-400 italic">
                    {numberToWords(totalAmount)}
                  </p>
                </div>

                {/* Photo Verification Section */}
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-400" />
                      <Label className="text-blue-300 font-medium">Photo Verification (Max {MAX_PHOTOS} photos)</Label>
                    </div>
                    <span className="text-xs text-slate-400">{capturedPhotos.length}/{MAX_PHOTOS}</span>
                  </div>
                  
                  {capturedPhotos.length === 0 ? (
                    <div className="space-y-3">
                      {/* Camera Preview */}
                      {showCamera && (
                        <div className="relative">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline
                            className="w-full rounded-lg border border-slate-700"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                          <div className="flex gap-2 mt-2">
                            <Button 
                              type="button"
                              onClick={capturePhoto}
                              className="flex-1 bg-blue-600 hover:bg-blue-500"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Capture Photo
                            </Button>
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={stopCamera}
                              className="border-slate-600"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Camera / Upload Buttons */}
                      {!showCamera && (
                        <div className="flex gap-2">
                          <Button 
                            type="button"
                            onClick={startCamera}
                            variant="outline"
                            className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-600/20"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Open Camera
                          </Button>
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => photoInputRef.current?.click()}
                            className="flex-1 border-slate-600"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </Button>
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </div>
                      )}
                      
                      {/* GPS Status */}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className={`w-4 h-4 ${gpsLocation ? 'text-emerald-400' : gettingLocation ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                        {gettingLocation ? (
                          <span className="text-amber-400">Getting location...</span>
                        ) : gpsLocation ? (
                          <span className="text-emerald-400">
                            Location: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)} 
                            <span className="text-slate-500 ml-1">(±{Math.round(gpsLocation.accuracy)}m)</span>
                          </span>
                        ) : locationError ? (
                          <span className="text-red-400">{locationError}</span>
                        ) : (
                          <span className="text-slate-500">Location will be captured with photo</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Multiple Photos Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {capturedPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={photo.data} 
                              alt={`Captured goods ${index + 1}`} 
                              className="w-full h-24 object-cover rounded-lg border border-slate-700"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-red-600/90 hover:bg-red-500 text-white rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        
                        {/* Add More Photos Button (if less than MAX_PHOTOS) */}
                        {capturedPhotos.length < MAX_PHOTOS && (
                          <div 
                            onClick={() => photoInputRef.current?.click()}
                            className="h-24 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/50 transition-colors"
                          >
                            <Camera className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-xs text-slate-400">Add Photo</span>
                            <span className="text-xs text-slate-500">({capturedPhotos.length}/{MAX_PHOTOS})</span>
                          </div>
                        )}
                      </div>
                      
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      
                      {/* Photo Metadata */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>{captureTime ? new Date(captureTime).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {gpsLocation 
                              ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}`
                              : 'Location unavailable'
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* Verification Badge */}
                      <div className="flex items-center justify-between p-2 bg-emerald-600/20 rounded-lg border border-emerald-500/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400 text-sm font-medium">
                            {capturedPhotos.length} photo{capturedPhotos.length !== 1 ? 's' : ''} ready
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearAllPhotos}
                          className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handlePoGrnSubmit}
                  disabled={poSubmitting || !invoiceNumber}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 py-6 text-lg disabled:opacity-50"
                >
                  {poSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      {isKitchen ? 'Confirm GRN (Daily Perishable)' : 'Confirm GRN & Add to Stock'}
                    </span>
                  )}
                </Button>

                {/* Result Message */}
                {poResult && (
                  <div className={`mt-4 p-4 rounded-xl ${poResult.success ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <div className="flex items-center gap-2">
                      {poResult.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className={poResult.success ? 'text-emerald-400' : 'text-red-400'}>
                        {poResult.message}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ========== SINGLE ITEM TAB ========== */}
        <TabsContent value="single">
          <form onSubmit={handleSubmit} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-4">
            
            {/* Step 1: Select Vendor First */}
            <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-violet-400" />
                <Label className="text-violet-300 font-medium">Step 1: Select Vendor *</Label>
              </div>
              <Select value={form.vendor_id} onValueChange={handleVendorChange}>
                <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="vendor-select">
                  <SelectValue placeholder="Choose vendor first" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id} className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <span>{vendor.name}</span>
                        {vendor.supply_categories?.length > 0 && (
                          <span className="text-xs text-slate-400">
                            ({vendor.supply_categories.length} categories)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Show vendor's supply categories */}
              {selectedVendor && selectedVendor.supply_categories?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    This vendor supplies:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedVendor.supply_categories.map((cat) => (
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
        </div>

        {/* Step 2: Select Item (filtered by vendor) */}
        {form.vendor_id && (
          <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <Label className="text-emerald-300 font-medium">Step 2: Select Item *</Label>
              </div>
              <span className="text-xs text-emerald-400">
                {filteredItems.length} items available
              </span>
            </div>
            <Select value={form.item_id} onValueChange={(val) => setForm({ ...form, item_id: val })}>
              <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="item-select">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                {filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    No items found for this vendor&apos;s categories
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs border ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="text-slate-400 text-xs">({item.unit})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Step 3: Enter Details */}
        {form.item_id && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-slate-300">Quantity *</Label>
              <Input
                type="number"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="Enter quantity"
                className="bg-slate-800 border-slate-700"
                data-testid="quantity-input"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label className="text-slate-300">Expiry Date *</Label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="bg-slate-800 border-slate-700"
                data-testid="expiry-date-input"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-slate-300">Receive at Location *</Label>
              <Select value={form.location_id} onValueChange={(val) => setForm({ ...form, location_id: val })}>
                <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="location-select">
                  <SelectValue placeholder="Select location" />
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

            {/* Purchase Rate */}
            <div className="space-y-2">
              <Label className="text-slate-300">Purchase Rate (per unit)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.purchase_rate}
                onChange={(e) => setForm({ ...form, purchase_rate: e.target.value })}
                placeholder="₹ 0.00"
                className="bg-slate-800 border-slate-700"
                data-testid="purchase-rate-input"
              />
            </div>
          </div>
        )}

        {/* Notes */}
        {form.item_id && (
          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
              className="bg-slate-800 border-slate-700"
            />
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitting || !form.vendor_id || !form.item_id}
          className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 text-lg disabled:opacity-50"
          data-testid="create-grn-btn"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Creating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create GRN & Generate QR
            </span>
          )}
        </Button>
          </form>
        </TabsContent>

        {/* ========== BULK UPLOAD TAB ========== */}
        <TabsContent value="bulk">
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Upload Invoice Excel
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Upload an Excel file with invoice items to create GRN entries in bulk
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="border-slate-600 hover:bg-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vendor Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Vendor *</Label>
                <Select value={bulkVendorId} onValueChange={setBulkVendorId}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id} className="text-white hover:bg-slate-700">
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Receive at Location *</Label>
                <Select value={bulkLocationId} onValueChange={setBulkLocationId}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select location" />
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

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label className="text-slate-300">Invoice Number (Optional)</Label>
              <Input
                value={bulkInvoiceNumber}
                onChange={(e) => setBulkInvoiceNumber(e.target.value)}
                placeholder="e.g., INV-2026-001"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-slate-300">Excel File *</Label>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="bulk-file-input"
                />
                <label htmlFor="bulk-file-input" className="cursor-pointer">
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                  {bulkFile ? (
                    <div>
                      <p className="text-emerald-400 font-medium">{bulkFile.name}</p>
                      <p className="text-sm text-slate-400 mt-1">Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-300">Click to upload Excel file</p>
                      <p className="text-sm text-slate-500 mt-1">Supported: .xlsx, .xls</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleBulkUpload}
              disabled={bulkUploading || !bulkFile || !bulkVendorId || !bulkLocationId}
              className="w-full bg-blue-600 hover:bg-blue-500 py-6 text-lg disabled:opacity-50"
            >
              {bulkUploading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload & Create GRN Entries
                </span>
              )}
            </Button>

            {/* Upload Results */}
            {bulkResult && (
              <div className={`p-4 rounded-xl ${bulkResult.error ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
                {bulkResult.error ? (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{bulkResult.message}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{bulkResult.message}</span>
                    </div>
                    
                    {bulkResult.created_lots?.length > 0 && (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        <p className="text-sm text-slate-400">Created items:</p>
                        {bulkResult.created_lots.map((lot, idx) => (
                          <div key={idx} className="text-sm text-slate-300 pl-2">
                            ✓ {lot.item_name} - Qty: {lot.quantity} @ ₹{lot.rate}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {bulkResult.errors?.length > 0 && (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        <p className="text-sm text-amber-400">Errors ({bulkResult.error_count}):</p>
                        {bulkResult.errors.map((err, idx) => (
                          <div key={idx} className="text-sm text-amber-300/70 pl-2">
                            ⚠ {err}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent GRNs */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          Recent GRNs
        </h2>
        
        {grnList.length === 0 ? (
          <p className="text-slate-400 text-center py-6">No GRNs created yet</p>
        ) : (
          <div className="space-y-2">
            {grnList.map((grn) => (
              <div
                key={grn.id}
                className="p-3 rounded-xl bg-slate-800/50 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-white">{grn.item_name}</p>
                  <p className="text-sm text-slate-400">
                    {grn.lot_number} • Qty: {grn.quantity} • {grn.destination_location}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(grn.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              GRN Created Successfully!
            </DialogTitle>
          </DialogHeader>
          
          {showQR && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                <img 
                  src={`data:image/png;base64,${showQR.qr_code}`} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lot Number:</span>
                  <span className="text-white font-mono">{showQR.lot_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Item:</span>
                  <span className="text-white">{showQR.item_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="text-white">{showQR.initial_quantity} {showQR.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expiry:</span>
                  <span className="text-white">{new Date(showQR.expiry_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-white">{showQR.location_name}</span>
                </div>
              </div>
              
              <Button
                onClick={() => setShowQR(null)}
                className="w-full bg-emerald-600 hover:bg-emerald-500"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
